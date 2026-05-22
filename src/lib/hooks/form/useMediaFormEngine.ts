// hooks/useMediaFormEngine.ts
'use client';

import { useState, useCallback, useRef, useEffect } from "react";
import { useForm, DefaultValues } from "react-hook-form";
import { DialogStatus } from "@/ui/components/confirmationDialog";
import { useUploadWorkflow } from "./useUploadWorkerflow";
import { PresignedSlot } from "@/types/upload";

export type MediaFormEngineConfig<
  TForm,
  TMetadataPayload,
  TFileSlot extends string,
  TPresignedSlot extends PresignedSlot<TFileSlot>
> = {
  buildMetadata: (data: TForm) => TMetadataPayload;
  collectFiles: (data: TForm) => { key: TFileSlot; file: File }[];
  submitMetadata: (payload: TMetadataPayload, id?: string | null) => Promise<string>;
  presignUploads: (id: string, files: { key: TFileSlot; file: File }[]) => Promise<TPresignedSlot[]>;
  uploadFile: (uploadUrl: string, file: File, onProgress: (p: number) => void, signal: AbortSignal) => Promise<void>;
  finalizeUploads: (id: string, slots: TPresignedSlot[]) => Promise<void>;
  deleteEntity?: (id: string) => Promise<void>;
};

export function useMediaFormEngine<
  TForm extends Record<string, unknown>,
  TMeta,
  TSlot extends string,
  TPresigned extends PresignedSlot<TSlot>
>(
  cfg: MediaFormEngineConfig<TForm, TMeta, TSlot, TPresigned>,
  defaultValues: DefaultValues<TForm>
) {
  // --- ÉTATS ---
  const upload = useUploadWorkflow<TSlot>();
  const { control, handleSubmit, reset, formState, watch, trigger, setValue } = useForm<TForm>({
    defaultValues,
  });

  const [entityId, setEntityId] = useState<string | null>(null);
  const [pending, setPending] = useState<TForm | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<DialogStatus>("idle");
  const [lastSuccessfulSlots, setLastSuccessfulSlots] = useState<TPresigned[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  
  // Utilisation d'une ref pour l'ID afin d'éviter les problèmes de closure dans les callbacks async
  const idRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);

  // --- ACTIONS DE NETTOYAGE ---
  const updateEntityId = useCallback((id: string | null) => {
    idRef.current = id;
    setEntityId(id);
  }, []);

  const resetEngine = useCallback(() => {
    updateEntityId(null);
    setPending(null);
    setDialogStatus("idle");
    setDialogOpen(false);
    setLastSuccessfulSlots([]);
    setShowCancelConfirm(false);
    upload.reset();
    reset();
  }, [reset, upload, updateEntityId]);

  // --- CŒUR DE LA LOGIQUE D'UPLOAD (CENTRALISÉ) ---
  const executeUploadSequence = useCallback(async (
    filesToProcess: { key: TSlot; file: File }[],
    options: { retryKeys?: TSlot[]; existingSlots?: TPresigned[] } = {}
  ) => {
    const currentId = idRef.current;
    if (!currentId) throw new Error("ID d'entité manquant. L'étape 0 doit être validée.");

    const result = await upload.runUpload(filesToProcess, {
      presign: (f) => cfg.presignUploads(currentId, f),
      uploadToUrl: cfg.uploadFile,
      finalize: (u) => cfg.finalizeUploads(currentId, u as TPresigned[]),
    }, { 
      ...options, 
      parallel: true,
      retryConfig: {
        maxRetries: 3,
        retryDelay: 1000,
        retryCondition: (error: Error) => {
          // Ne pas retenter les erreurs 4xx (client errors)
          return !error.message.includes('400') && !error.message.includes('401') && !error.message.includes('403');
        }
      }
    });

    // Vérifier si le composant est toujours monté avant de mettre à jour l'état
    if (!isMountedRef.current) return result;

    // Mise à jour intelligente des slots réussis
    if (result.successful.length > 0) {
      setLastSuccessfulSlots(prev => {
        const slotMap = new Map(prev.map(s => [s.key, s]));
        result.successful.forEach(slot => slotMap.set(slot.key, slot as TPresigned));
        return Array.from(slotMap.values());
      });
    }

    // Gérer le statut du dialogue
    if (result.failed.length > 0 && result.successful.length === 0) {
      setDialogStatus("error");
    } else if (result.failed.length > 0 && result.successful.length > 0) {
      setDialogStatus("partial_success");
    } else if (result.failed.length === 0 && result.successful.length > 0) {
      setDialogStatus("success");
    }

    return result;
  }, [upload, cfg, resetEngine]);

  // --- ACTIONS UTILISATEUR ---

  const confirmSubmit = useCallback(async (step?: number) => {
    if (!pending) return;
    setDialogStatus("loading");

    try {
      // CAS 1: Sauvegarde des métadonnées (STEP 0)
      if (step === 0) {
        const payload = cfg.buildMetadata(pending);
        const newId = await cfg.submitMetadata(payload, entityId);
        updateEntityId(newId);
        setDialogStatus("success");
        return;
      }

      // CAS 2: Lancement de l'upload (STEP 1)
      const allFiles = cfg.collectFiles(pending);
      if (allFiles.length === 0) {
        setDialogStatus("success");
        setTimeout(() => {
          if (isMountedRef.current) resetEngine();
        }, 1000);
        return;
      }

      await executeUploadSequence(allFiles);

    } catch (error) {
      console.error("[MediaFormEngine] Erreur critique:", error);
      if (isMountedRef.current) {
        setDialogStatus("error");
      }
    }
  }, [pending, cfg, entityId, updateEntityId, executeUploadSequence, resetEngine]);

  const retryFailedUploads = useCallback(async () => {
    if (!pending || upload.failedKeys.length === 0) return;
    
    setDialogStatus("loading");
    const failedKeys = upload.failedKeys;
    const allFiles = cfg.collectFiles(pending);
    const filesToRetry = allFiles.filter(f => failedKeys.includes(f.key));

    // Si l'échec a eu lieu au presign, on ne passe pas les anciens slots pour forcer un refresh
    const needsNewPresign = failedKeys.some(k => upload.failedAtStage.get(k) === 'presign');
    
    await executeUploadSequence(filesToRetry, {
      retryKeys: failedKeys,
      existingSlots: needsNewPresign ? [] : lastSuccessfulSlots.filter(s => failedKeys.includes(s.key))
    });
  }, [upload, pending, cfg, lastSuccessfulSlots, executeUploadSequence]);

  const closeDialog = useCallback(async () => {
    // Si un upload est en cours ou en erreur, on demande confirmation via le dialog
    if (upload.step !== 'idle' && upload.step !== 'done') {
      setShowCancelConfirm(true);
      return;
    }
    
    // Fermeture normale
    setDialogOpen(false);
    setDialogStatus("idle");
  }, [upload.step]);

  const confirmCancel = useCallback(async () => {
    setShowCancelConfirm(false);
    
    // Annuler l'upload et nettoyer
    await upload.cancel(async () => {
      if (idRef.current && cfg.deleteEntity) {
        await cfg.deleteEntity(idRef.current);
      }
    });
    
    updateEntityId(null);
    setDialogOpen(false);
    setDialogStatus("idle");
  }, [upload, cfg, updateEntityId]);

  const cancelCancel = useCallback(() => {
    setShowCancelConfirm(false);
  }, []);

  // --- SÉCURITÉ ---
  // Empêche de fermer l'onglet par erreur si un ID d'entité existe (brouillon orphelin)
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (entityId && dialogStatus !== "success" && upload.step !== 'idle') {
        e.preventDefault();
        e.returnValue = "Vous avez des fichiers en cours d'upload. Êtes-vous sûr de vouloir quitter ?"; 
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [entityId, dialogStatus, upload.step]);

  // Cleanup du mounted ref
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return {
    // Form props
    control, 
    watch, 
    handleSubmit, 
    reset, 
    formState, 
    trigger, 
    setValue,
    
    // Engine state
    entityId, 
    setEntityId, 
    dialogOpen, 
    dialogStatus, 
    upload,
    pendingData: pending,
    lastSuccessfulSlots,
    failedUploads: upload.failedKeys,
    hasFailedUploads: upload.hasFailures(),
    retryFailedUploads,   
    // Cancel confirmation state
    showCancelConfirm,
    
    // Logic actions
    setDialogOpen,
    setDialogStatus,
    openConfirm: useCallback((data: TForm) => { 
      setPending(data); 
      setDialogOpen(true); 
      setDialogStatus("idle");
    }, []),
    confirmSubmit,
    closeDialog,
    confirmCancel,
    cancelCancel,
    resetEngine,
    prepareForNextStep: useCallback(() => {
      setDialogStatus("idle");
      setDialogOpen(false);
    }, []),
  };
}

