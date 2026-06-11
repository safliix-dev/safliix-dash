// app/films/filmAdapter.ts

import axios from "axios";
import { uploadApi } from "@/lib/api/uploads";
import { filmsApi } from "@/lib/api/films";
import { FilmFormData, FilmMetadataPayload, FilmSlot } from "@/types/api/films"; 
import { MediaFormEngineConfig } from "@/lib/hooks/form/useMediaFormEngine";
import { 
  UploadFinalizePayload, 
  UploadFileDescriptor,
} from "@/types/upload";

export interface FilmPresignedSlot {
  key: FilmSlot;
  uploadUrl: string;
  finalUrl: string;
  mediaFileId: string;
}

export const filmAdapter: MediaFormEngineConfig<
  FilmFormData,
  FilmMetadataPayload,
  FilmSlot,           
  FilmPresignedSlot
> = {
  buildMetadata: (form): FilmMetadataPayload => {
    return {
      title: form.title,
      description: form.description,
      type: form.type,
      rentalPrice: form.type === "abonnement" ? undefined : (form.price ?? undefined),
      format: form.format,
      category: form.category,
      gender: form.genre,
      duration: form.duration,
      productionCountry: form.country,
      productionHouse: form.productionHouse,
      plateformDate: form.publishDate,
      releaseDate: form.releaseDate,
      entertainmentMode: form.entertainmentMode,
      director: form.director,
      actors: form.actors,
      isSafliixProd: form.isSafliixProd,
      haveSubtitles: form.haveSubtitles,
      mainLanguage: form.subtitleLanguages?.at(0) ?? "fr",
      ageRating: form.ageRating,
      rightHolderId: form.rightHolderId,
      blockedCountries: form.blockCountries,
    };
  },

  collectFiles: (form): { key: FilmSlot; file: File }[] => {
    // CORRECTION : On utilise directement les valeurs attendues par le workflow (l'Enum)
    // Cela permet au hook de faire le lien entre le retour du serveur et le fichier local
    const slots: { key: FilmSlot; file: File | null | undefined }[] = [
      { key: 'POSTER', file: form.mainImage },
      { key: 'THUMBNAIL', file: form.secondaryImage },
      { key: 'MAIN', file: form.movieFile },
      { key: 'TRAILER', file: form.trailerFile },
    ];
    
    return slots.filter((s): s is { key: FilmSlot; file: File } => s.file instanceof File);
  },

  submitMetadata: async (payload, id) => {
    console.log("1. Début de l'appel API...");
    try {
      const res = id 
        ? await filmsApi.update(id, payload) 
        : await filmsApi.create(payload);
      
      console.log("2. Réponse reçue du serveur:", res);
      
      if (!res?.id) {
        console.error("ERREUR: Le serveur n'a pas renvoyé d'ID !");
        throw new Error("Format de réponse invalide");
      }
      
      return res.id;
    } catch (err) {
      console.error("3. Erreur attrapée dans l'adapter:", err);
      throw err;
    }
  },

  presignUploads: async (id, files): Promise<FilmPresignedSlot[]> => {
    if (files.length === 0) return [];

    // Créer les descripteurs pour l'API
    const descriptors: UploadFileDescriptor<FilmSlot>[] = files.map(f => ({
      key: f.key,
      name: f.file.name,
      type: f.file.type || "application/octet-stream",
      attachmentType: f.key,
      file:f.file
    }))

    // Appeler l'API avec le bon type
    const slots = await uploadApi.presignUploads(id, "movie", descriptors);

    // Retourner les slots avec le bon type
    return slots.map(slot => ({
      uploadUrl: slot.uploadUrl,
      finalUrl: slot.finalUrl,
      key: slot.key as FilmSlot,
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

  finalizeUploads: async (id, slots:FilmPresignedSlot[]) => {
    const payload: UploadFinalizePayload = {
      entityId: id,
      mediaFileIds: slots.map((s) => s.mediaFileId),
    };
    const res = await uploadApi.finalizeUploads("movie", id, payload);
    
    if (!res || (res.ok === false)) {
      throw new Error("La finalisation de l'upload a échoué côté serveur.");
    }
  },

  deleteEntity: async (_id) => {
    throw new Error("La suppression de film n'est pas encore implémentée."+ _id);
  }
};