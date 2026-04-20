// app/episodes/episodeAdapter.ts

import axios from "axios";
import { uploadApi } from "@/lib/api/uploads";
import { episodeApi } from "@/lib/api/episode";
import { EpisodeFormData, EpisodeMetadataPayload, EpisodeSlot } from "@/types/api/episode";
import { MediaFormEngineConfig } from "@/lib/hooks/form/useMediaFormEngine";
import {  
  UploadFinalizePayload, 
  UploadFileDescriptor,
   
} from "@/types/upload";

export interface EpisodePresignedSlot {
  key: EpisodeSlot;
  uploadUrl: string;
  finalUrl: string;
  mediaFileId:string;
}

export const episodeAdapter: MediaFormEngineConfig<
  EpisodeFormData,
  EpisodeMetadataPayload,
  EpisodeSlot,
  EpisodePresignedSlot
> = {
  buildMetadata: (form): EpisodeMetadataPayload => {
    return {
      title: form.title,
      description: form.description,
      isCustomProduction: form.isCustomProduction,
      status: form.status,
      duration: form.duration ?? 0,
      releaseDate: form.releaseDate,
      plateformDate: form.publishDate,
      director: form.director,
      episodeNumber: form.episodeNumber ?? 0,
      actors: form.actors.join(","),
      seriesId: form.seriesId,
      seasonId: form.seasonId,
    };
  },

  collectFiles: (form): { key: EpisodeSlot; file: File }[] => {
    const slots: { key: EpisodeSlot; file: File | null | undefined }[] = [
      { key: 'POSTER', file: form.mainImage },
      { key: 'MOVIE', file: form.movieFile },
      { key: 'TRAILER', file: form.trailerFile },
    ];
    
    return slots.filter((s): s is { key: EpisodeSlot; file: File } => s.file instanceof File);
  },

  submitMetadata: async (payload, id) => {
    const res = id 
      ? await episodeApi.update(id, payload) 
      : await episodeApi.create(payload);
    
    if (!res?.id) {
      throw new Error("Format de réponse invalide");
    }
    
    return res.id;
  },

  presignUploads: async (id, files): Promise<EpisodePresignedSlot[]> => {
    if (files.length === 0) return [];

    const descriptors: UploadFileDescriptor<EpisodeSlot>[] = files.map(f => ({
      key: f.key,
      name: f.file.name,
      type: f.file.type || "application/octet-stream",
      attachmentType: f.key,
      file:f.file

    }));

    const slots = await uploadApi.presignUploads<EpisodeSlot>(id, "episode", descriptors);

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
      mediaFileIds:slots.map(s => s.mediaFileId)
    };

    const res = await uploadApi.finalizeUploads(id, payload);
    
    if (!res || (res.ok === false)) {
      throw new Error("La finalisation de l'upload a échoué côté serveur.");
    }
  },

  deleteEntity: async (_id) => {
    throw new Error("La suppression d'un épisode n'est pas encore implémentée."+ _id); 
  },
};