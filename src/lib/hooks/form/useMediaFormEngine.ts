'use client';

import { useState, useCallback } from "react";
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
  TForm extends Record<string,unknown>,
  TMeta,
  TSlot extends string,
  // On force TPresigned à hériter de PresignedSlot pour inclure mediaFileId
  TPresigned extends PresignedSlot<TSlot>
>(
  cfg: MediaFormEngineConfig<TForm, TMeta, TSlot, TPresigned>,
  defaultValues: DefaultValues<TForm>
) {
  const upload = useUploadWorkflow<TSlot>();
  const { control, handleSubmit, reset, formState, watch, trigger, setValue } = useForm<TForm>({
    defaultValues,
  });

  const [entityId, setEntityId] = useState<string | null>(null);
  const [pending, setPending] = useState<TForm | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<DialogStatus>("idle");

  const resetEngine = useCallback(() => {
    setEntityId(null);
    setPending(null);
    setDialogStatus("idle");
    setDialogOpen(false);
    upload.reset();
    reset();
  }, [reset, upload]);
const confirmSubmit = async (step?: number, retryKeys?: TSlot[]) => {
    if (!pending) return;
    
    // On passe en chargement pour bloquer l'UI et ouvrir le mode "travail"
    setDialogStatus("loading");

    try {
      let currentId = entityId;

      // --- CAS 1 : SAUVEGARDE INITIALE (STEP 0) ---
      // On ne lance pas d'upload ici, on crée juste l'entité en base
      if (step === 0 && !retryKeys) {
        console.log("[Engine] Sauvegarde des métadonnées (Step 0)");
        const payload = cfg.buildMetadata(pending);
        
        // Appel API pour créer/maj l'entité
        currentId = await cfg.submitMetadata(payload, entityId);
        setEntityId(currentId);
        
        // On passe en 'success' : FormConfirmation affichera le bouton "Continuer"
        setDialogStatus("success");
        return; 
      }

      // --- CAS 2 : UPLOAD DES FICHIERS (STEP 1 ou RETRY) ---
      if (step === 1 || retryKeys) {
        if (!currentId) {
          throw new Error("ID d'entité manquant. Veuillez valider l'étape précédente.");
        }

        console.log("[Engine] Lancement de l'upload (Step 1)");
        
        // On récupère les fichiers via la config
        const allFiles = cfg.collectFiles(pending);
        
        // Sécurité : si aucun fichier n'est trouvé alors qu'on demande un upload
        if (allFiles.length === 0) {
          setDialogStatus("success");
          setTimeout(() => resetEngine(), 1000);
          return;
        }

        // Lancement du Workflow
        // C'est ici que upload.step va passer par 'presign', 'upload', 'finalize'
        const result = await upload.runUpload(allFiles, {
          presign: (f) => cfg.presignUploads(currentId!, f),
          uploadToUrl: cfg.uploadFile,
          finalize: (u) => cfg.finalizeUploads(currentId!, u as TPresigned[]),
        }, { 
          parallel: true, 
          retryKeys 
        });

        // --- GESTION DES RÉSULTATS DU WORKFLOW ---

        // A. Si des fichiers ont échoué
        if (result.failed.length > 0) {
          setDialogStatus("error"); // L'UI affichera la liste des erreurs et le bouton Retry
          return;
        }

        // B. Si l'utilisateur a annulé (via closeDialog/abort)
        if (result.cancelled) {
          setDialogStatus("idle");
          return;
        }

        // C. Succès total
        setDialogStatus("success");
        
        // On laisse 2 secondes pour que l'utilisateur voie le message de fin/100%
        setTimeout(() => {
          setDialogOpen(false);
          resetEngine(); // Nettoyage complet (formulaire + états)
        }, 2000);
      }

    } catch (error) {
      // Erreurs fatales (API metadata, crash presign, etc.)
      setDialogStatus("error");
      console.error("[MediaFormEngine] Erreur critique:", error);
    }
  };

  const retryFailedUploads = () => {
    const failedKeys = upload.errors.map(e => e.key);
    confirmSubmit(1, failedKeys); // On force le step 1 pour le retry
  };

  const closeDialog = useCallback(async () => {
    if (upload.step !== 'idle' && upload.step !== 'error') {
        const confirmCancel = window.confirm("Annuler l'envoi et supprimer le brouillon ?");
        if (!confirmCancel) return;

        await upload.cancel(async () => {
            if (entityId && cfg.deleteEntity) {
                await cfg.deleteEntity(entityId);
            }
        });
        setEntityId(null);
    }
    
    setDialogOpen(false);
    setDialogStatus("idle");
  }, [upload, entityId, cfg]);

  return {
    control, watch, handleSubmit, reset, formState, trigger, setValue,
    entityId, setEntityId, pendingData: pending,
    dialogOpen, dialogStatus, upload,
    setDialogOpen, setDialogStatus,
    openConfirm: (data: TForm) => { 
      setPending(data); 
      setDialogOpen(true); 
      setDialogStatus("idle");
    },
    confirmSubmit,
    retryFailedUploads,
    closeDialog,
    resetEngine
  };
}