// app/dashboard/series/detail/[id]/seasons/add/seasonAdapter.ts

import axios from "axios";
import { uploadApi } from "@/lib/api/uploads";
import { seasonsApi } from "@/lib/api/season";
import { SeasonFormData, SeasonMetadataPayload, SeasonSlot } from "@/types/api/season";
import { MediaFormEngineConfig } from "@/lib/hooks/form/useMediaFormEngine";
import { 
  UploadFinalizePayload, 
  UploadFileDescriptor,
} from "@/types/upload";

export interface SeasonPresignedSlot {
  key: SeasonSlot;
  uploadUrl: string;
  finalUrl: string;
  mediaFileId:string;
}

export const seasonAdapter: MediaFormEngineConfig<
  SeasonFormData,
  SeasonMetadataPayload,
  SeasonSlot,
  SeasonPresignedSlot
> = {
  buildMetadata: (form): SeasonMetadataPayload => {
    return {
      numero: form.numero ?? 0,
      title: form.title,
      description: form.description,
    };
  },

  collectFiles: (form): { key: SeasonSlot; file: File }[] => {
    const slots: { key: SeasonSlot; file: File | null | undefined }[] = [
      { key: 'poster', file: form.poster },
    ];
    
    return slots.filter((s): s is { key: SeasonSlot; file: File } => s.file instanceof File);
  },

  submitMetadata: async (payload, id) => {
    const res = id 
      ? await seasonsApi.update(id, payload) 
      : await seasonsApi.create(payload);
    
    if (!res?.id) {
      throw new Error("Format de réponse invalide");
    }
    
    return res.id;
  },

  presignUploads: async (id, files): Promise<SeasonPresignedSlot[]> => {
    if (files.length === 0) return [];

    const descriptors: UploadFileDescriptor<SeasonSlot>[] = files.map(f => ({
      key: f.key,
      name: f.file.name,
      type: f.file.type || "application/octet-stream",
      attachmentType:f.key,
      file:f.file
    }));

    const slots = await uploadApi.presignUploads<SeasonSlot>(id, "season", descriptors);

    return slots.map(slot => ({
      uploadUrl: slot.uploadUrl,
      finalUrl: slot.finalUrl,
      key: slot.key,
      mediaFileId:slot.mediaFileId
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
     entityId:id,
     mediaFileIds: slots.map(s => s.mediaFileId)
    };

    const res = await uploadApi.finalizeUploads(id, payload);
    
    if (!res || (res.ok === false)) {
      throw new Error("La finalisation de l'upload a échoué côté serveur.");
    }
  },

  deleteEntity: async (_id) => {
    throw new Error("La suppression d'une saison n'est pas encore implémentée." + _id); 
  },
};