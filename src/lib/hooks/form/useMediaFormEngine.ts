'use client';

import { useState } from "react";
import { useForm,DefaultValues } from "react-hook-form";
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
  uploadFile: (uploadUrl: string, file: File) => Promise<void>;
  finalizeUploads: (id: string, slots: { key: TFileSlot; finalUrl: string }[]) => Promise<void>;
};

export function useMediaFormEngine<
  TForm extends Record<string, any>,
  TMeta,
  TSlot extends string,
  TPresigned extends { uploadUrl: string; finalUrl: string; key: TSlot }
>(
  cfg: MediaFormEngineConfig<TForm, TMeta, TSlot, TPresigned>,
  defaultValues: DefaultValues<TForm>
) {
  const upload = useUploadWorkflow<TSlot>();
  const { control, handleSubmit, reset, formState, watch,trigger, setValue } = useForm<TForm>({
    defaultValues,
  });

  const [entityId, setEntityId] = useState<string | null>(null);
  const [pending, setPending] = useState<TForm | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogStatus, setDialogStatus] = useState<DialogStatus>("idle");

  const confirmSubmit = async () => {
    if (!pending) return;
    setDialogStatus("loading");

    try {
      // 1. Sauvegarde/Mise à jour des métadonnées
      // On passe l'entityId actuel pour permettre l'Update si nécessaire
      const id = await cfg.submitMetadata(cfg.buildMetadata(pending), entityId);
      setEntityId(id);

      // 2. Collecte des fichiers via la config (plus flexible que Object.entries)
      const files = cfg.collectFiles(pending);
      
      if (files.length > 0) {
        await upload.runUpload(files, {
          presign: (f) => cfg.presignUploads(id, f),
          uploadToUrl: (url, file) => cfg.uploadFile(url, file),
          finalize: (u) => cfg.finalizeUploads(id, u),
        });
      }

      setDialogStatus("success");
      
      // On reset après succès
      setTimeout(() => {
        setDialogOpen(false);
        reset(); 
        setEntityId(null);
        setPending(null);
      }, 1500);

    } catch (error) {
      console.log("Error during confirmSubmit:", error);
      setDialogStatus("error");
      console.error("[MediaFormEngine] Submit error:", error);
    }
  };

  return {
    control, 
    watch, 
    handleSubmit, 
    reset,
    formState,
    openConfirm: (data: TForm) => { 
      setPending(data); 
      setDialogOpen(true); 
      setDialogStatus("idle");
    },
    confirmSubmit,
    closeDialog: () => {
        if (dialogStatus === "loading") return;
        setDialogOpen(false);
    },
    dialogOpen, 
    dialogStatus, 
    upload,
    entityId,
    setEntityId,
    pendingData: pending,
    trigger,
    setValue, 
    
    // Utile pour annuler complètement et reset
    resetEngine: () => {
        setDialogOpen(false);
        setPending(null);
        setDialogStatus("idle");
    }
  };
}