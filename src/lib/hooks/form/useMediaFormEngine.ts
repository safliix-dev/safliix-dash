'use client';

import { useState, useCallback } from "react";
import { useForm, DefaultValues } from "react-hook-form";
import { DialogStatus } from "@/ui/components/confirmationDialog";
import { useUploadWorkflow } from "./useUploadWorkerflow";

export type MediaFormEngineConfig<
  TForm,
  TMetadataPayload,
  TFileSlot extends string,
  TPresignedSlot
> = {
  buildMetadata: (data: TForm) => TMetadataPayload;
  collectFiles: (data: TForm) => { key: TFileSlot; file: File }[];
  submitMetadata: (payload: TMetadataPayload, id?: string | null) => Promise<string>;
  presignUploads: (id: string, files: { key: TFileSlot; file: File }[]) => Promise<TPresignedSlot[]>;
  // AJOUT DU SIGNAL ICI
  uploadFile: (uploadUrl: string, file: File, onProgress: (p: number) => void, signal: AbortSignal) => Promise<void>;
  finalizeUploads: (id: string, slots: { key: TFileSlot; finalUrl: string }[]) => Promise<void>;
  // OPTIONNEL : Route de suppression pour le rollback
  deleteEntity?: (id: string) => Promise<void>;
};

export function useMediaFormEngine<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TForm extends Record<string, any>,
  TMeta,
  TSlot extends string,
  TPresigned extends { uploadUrl: string; finalUrl: string; key: TSlot }
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


  
  /* const confirmSubmit = async (retryKeys?: TSlot[]) => {
    if (!pending) return;
    setDialogStatus("loading");

    try {
      let currentId = entityId;

      // 1. Sauvegarde Metadata (uniquement si ce n'est pas un retry partiel d'upload)
      if (!retryKeys) {
        currentId = await cfg.submitMetadata(cfg.buildMetadata(pending), entityId);
        setEntityId(currentId);
      }

      if (!currentId) throw new Error("ID d'entité manquant");

      // 2. Collecte et Upload
      const files = cfg.collectFiles(pending);
      
      if (files.length > 0) {
        const result = await upload.runUpload(files, {
          presign: (f) => cfg.presignUploads(currentId!, f),
          // TRANSMISSION DU SIGNAL ET DU PROGRESS
          uploadToUrl: (url, file, onProg, signal) => cfg.uploadFile(url, file, onProg, signal),
          finalize: (u) => cfg.finalizeUploads(currentId!, u),
        }, { 
          parallel: true, 
          retryKeys // Utilisation des clés de retry si fournies
        });

        // Si après l'upload il y a des erreurs, on ne ferme pas
        if (result.failed.length > 0) {
          setDialogStatus("error"); // Ou un état "partial_success" si tu l'as ajouté
          return;
        }
      }

      setDialogStatus("success");
      
      setTimeout(() => {
        setDialogOpen(false);
        reset(); 
        setEntityId(null);
        setPending(null);
        upload.reset();
      }, 1500);

    } catch (error) {
      setDialogStatus("error");
      console.error("[MediaFormEngine] Submit error:", error);
    }
  }; */


 const confirmSubmit = async (step?: number, retryKeys?: TSlot[]) => {
  if (!pending) return;
  setDialogStatus("loading");

  try {
    let currentId = entityId;

    // --- CAS 1 : SAUVEGARDE INITIALE (STEP 0) ---
    if (step === 0 && !retryKeys) {
      console.log("[Engine] Sauvegarde des métadonnées (Step 0)");
      // Dans confirmSubmit, juste avant le Bloc A
      console.log("Vérification du pending avant build:", pending);
      const payload = cfg.buildMetadata(pending);
      console.log("Payload construit avec succès:", payload);

      currentId = await cfg.submitMetadata(payload, entityId);
      setEntityId(currentId);
      
      setDialogStatus("success");
      return; // ON S'ARRÊTE ICI. Pas d'upload au Step 0.
    }

    // --- CAS 2 : UPLOAD DES FICHIERS (STEP 1) ---
    if (step === 1 || retryKeys) {
      // Sécurité : On vérifie qu'on a bien l'ID avant de parler à S3
      if (!currentId) {
        throw new Error("ID manquant. Veuillez valider l'étape précédente.");
      }

      console.log("[Engine] Lancement de l'upload (Step 1)");
      const files = cfg.collectFiles(pending);

      if (files.length > 0) {
        const result = await upload.runUpload(files, {
          presign: (f) => cfg.presignUploads(currentId!, f),
          uploadToUrl: cfg.uploadFile,
          finalize: (u) => cfg.finalizeUploads(currentId!, u),
        }, { parallel: true, retryKeys });

        if (result.failed.length > 0) {
          setDialogStatus("error");
          return;
        }
      }

      setDialogStatus("success");
      setTimeout(() => {
        setDialogOpen(false);
        resetEngine(); // On nettoie tout, le film est complet.
      }, 1500);
    }

  } catch (error) {
    setDialogStatus("error");
    console.error("[MediaFormEngine] Erreur:", error);
  }
};
  // NOUVELLE FONCTION : Retry
  const retryFailedUploads = () => {
    const failedKeys = upload.errors.map(e => e.key);
    confirmSubmit(undefined, failedKeys);
  };

  // NOUVELLE LOGIQUE : Fermeture avec Rollback
  const closeDialog = useCallback(async () => {
    // Si en chargement, on annule l'upload et on rollback en DB
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

  const resetEngine = useCallback(() => {
    setEntityId(null);
    setPending(null);
    setDialogStatus("idle");
    setDialogOpen(false);
    upload.reset(); // Nettoie les stats et erreurs d'upload
    reset();        // Reset le formulaire React Hook Form
  }, [reset, upload]);

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
    retryFailedUploads, // Exposer le retry
    closeDialog,
    resetEngine
  };
}