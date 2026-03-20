import axios from "axios";
import { uploadApi } from "@/lib/api/uploads";
import { filmsApi } from "@/lib/api/films";
import { FilmFormData, FilmMetadataPayload } from "@/types/api/films"; 
import { MediaFormEngineConfig } from "@/lib/hooks/form/useMediaFormEngine";
import { 
  attachmentTypeMap, 
  UploadFinalizePayload, 
} from "@/types/attachmentType";

// On définit les clés autorisées pour ce formulaire précis
export type FilmSlot = "POSTER" | "MAIN" | "TRAILER" | "THUMBNAIL";
export interface FilmPresignedSlot {
  key: FilmSlot;      // Doit être "movieFile" | "trailerFile" | etc.
  uploadUrl: string;
  finalUrl: string;
}

export const filmAdapter: MediaFormEngineConfig<
  FilmFormData,
  FilmMetadataPayload,
  FilmSlot,           
  FilmPresignedSlot
> = {
  // 1. Transformation des données pour l'API
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

  // 2. Collecte des fichiers (Strictement typé)
  collectFiles: (form): { key: FilmSlot; file: File }[] => {
    const slots = [
      { key: attachmentTypeMap.mainImage as FilmSlot, file: form.mainImage },
      { key: attachmentTypeMap.movieFile as FilmSlot, file: form.movieFile },
      { key: attachmentTypeMap.trailerFile as FilmSlot, file: form.trailerFile },
    ];
    
    // On filtre pour ne garder que les vrais fichiers
    return slots.filter((s): s is { key: FilmSlot; file: File } => s.file instanceof File);
  },

  // 3. Sauvegarde Metadata
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

  // 4. Récupération des URLs S3
 presignUploads: async (id, files): Promise<FilmPresignedSlot[]> => {
  if (files.length === 0) return [];

  const descriptors = files.map(f => ({
    key: f.key,
    name: f.file.name,
    type: f.file.type || "application/octet-stream",
    attachmentType: f.key
  }));

  // 1. On récupère les slots de l'API (qui sont en UploadSlot<string>)
  const slots = await uploadApi.presignUploads(id, "movie", descriptors);

  // 2. On les transforme pour correspondre EXACTEMENT à FilmPresignedSlot
  return slots.map(slot => ({
    uploadUrl: slot.uploadUrl,
    finalUrl: slot.finalUrl,
    // On force le type ici car on sait que l'API renvoie les clés qu'on lui a données
    key: slot.key as FilmSlot 
  }));
},

  // 5. Upload S3 (Avec gestion du Signal et Progress)
  uploadFile: async (url, file, onProgress, signal) => {
    await axios.put(url, file, {
      signal, // Permet l'annulation de la requête HTTP
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

  // 6. Finalisation
  finalizeUploads: async (id, slots) => {
    const payload: UploadFinalizePayload = {
      uploads: slots.map((s) => ({
        key: s.key,
        finalUrl: s.finalUrl,
      })),
    };

    const res = await uploadApi.finalizeUploads(id, payload);
    
    // On vérifie que la réponse est valide (selon ta structure filmsApi)
    if (!res || (res.ok === false)) {
      throw new Error("La finalisation de l'upload a échoué côté serveur.");
    }
  },

  // 7. Rollback (Suppression si annulation)
  deleteEntity: async (_id) => {
    //await filmsApi.delete(id);
  }
};