// app/dashboard/Ads/add/AdsAdapter.ts

import axios from "axios";
import { uploadApi } from "@/lib/api/uploads";
import { adsApi } from "@/lib/api/ads";
import { AdsFormData, AdsSlot, AdsMetadataPayload } from "@/types/api/ads";
import { MediaFormEngineConfig } from "@/lib/hooks/form/useMediaFormEngine";
import { 
  UploadFinalizePayload, 
  UploadFileDescriptor,
} from "@/types/upload";

export interface AdsPresignedSlot {
  key: AdsSlot;
  uploadUrl: string;
  finalUrl: string;
  mediaFileId: string;
}

export const AdsAdapter: MediaFormEngineConfig<
  AdsFormData,
  AdsMetadataPayload,
  AdsSlot,
  AdsPresignedSlot
> = {
  buildMetadata: (form): AdsMetadataPayload => {
    return {
      title: form.title,
      description: form.description,
      startDate: form.startDate,
      endDate: form.endDate,
      line: form.line,
      status: form.status,
    };
  },

  collectFiles: (form): { key: AdsSlot; file: File }[] => {
    // Aligné sur filmAdapter : utilisation des mêmes clés que le backend
    const slots: { key: AdsSlot; file: File | null | undefined }[] = [
      { key: 'THUMBNAIL', file: form.mainImage },      // Changé: mainImage → THUMBNAIL
      { key: 'POSTER', file: form.secondaryImage },    // Changé: secondaryImage → POSTER
    ];
    
    return slots.filter((s): s is { key: AdsSlot; file: File } => s.file instanceof File);
  },

  submitMetadata: async (payload, id) => {
    const res = id 
      ? await adsApi.update(id, payload) 
      : await adsApi.create(payload);
    
    if (!res?.id) {
      throw new Error("Format de réponse invalide");
    }
    
    return res.id;
  },

  presignUploads: async (id, files): Promise<AdsPresignedSlot[]> => {
    if (files.length === 0) return [];

    // Aligné sur filmAdapter : plus de mapping, on utilise directement la clé
    const descriptors: UploadFileDescriptor<AdsSlot>[] = files.map(f => ({
      key: f.key,  // 'THUMBNAIL' ou 'POSTER'
      name: f.file.name,
      type: f.file.type || "application/octet-stream",
      attachmentType: f.key,  // Directement 'THUMBNAIL' ou 'POSTER'
      file: f.file,
    }));

    const slots = await uploadApi.presignUploads<AdsSlot>(id, "ad", descriptors);

    return slots.map(slot => ({
      uploadUrl: slot.uploadUrl,
      finalUrl: slot.finalUrl,
      key: slot.key as AdsSlot,
      mediaFileId: slot.mediaFileId
    }));
  },

  uploadFile: async (url, file, onProgress, signal) => {
    await axios.put(url, file, {
      signal,
      headers: { 
        'Content-Type': file.type || 'application/octet-stream' 
      },
      onUploadProgress: (progressEvent) => {
        const total = progressEvent.total ?? 1;
        const percentCompleted = Math.round((progressEvent.loaded * 100) / total);
        onProgress?.(percentCompleted);
      },
    });
  },

  finalizeUploads: async (id, slots) => {
    const payload: UploadFinalizePayload = {
      entityId: id,
      mediaFileIds: slots.map(s => s.mediaFileId)
    };

    const res = await uploadApi.finalizeUploads("ad", id, payload);
    
    if (!res || (res.ok === false)) {
      throw new Error("La finalisation de l'upload a échoué côté serveur.");
    }
  },

  deleteEntity: async (_id) => {
    throw new Error("La suppression d'une publicité n'est pas encore implémentée." + _id); 
  },
};