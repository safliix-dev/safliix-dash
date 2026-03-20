import axios from "axios";
import { seriesApi } from "@/lib/api/series";
import { uploadApi } from "@/lib/api/uploads";
import { SeriesMetadataPayload, SeriesFormData } from "@/types/api/series";
import { MediaFormEngineConfig } from "@/lib/hooks/form/useMediaFormEngine";
import { 
  attachmentTypeMap, 
  UploadFinalizePayload
} from "@/types/attachmentType";

/**
 * 1. Typage STRICT des slots (comme FilmSlot)
 */
export type SeriesSlot = "POSTER" | "TRAILER" | "THUMBNAIL";

export interface SeriesPresignedSlot {
  key: SeriesSlot;
  uploadUrl: string;
  finalUrl: string;
}

export const seriesAdapter: MediaFormEngineConfig<
  SeriesFormData,
  SeriesMetadataPayload,
  SeriesSlot,
  SeriesPresignedSlot
> = {

  /**
   * 2. Metadata
   */
  buildMetadata: (data) => ({
    title: data.title,
    description: data.description,
    productionHouse: data.productionHouse,
    productionCountry: data.country,
    releaseDate: data.releaseDate,
    plateformDate: data.publishDate,
    seasonCount: data.seasonCount,
    category: data.category,
    entertainmentMode: "SERIE",
    gender: data.genre,
    director: data.director,
    actors: data.actors.map((name: string) => ({ name })),
    isSafliixProd: data.isSafliixProd,
    haveSubtitles: data.haveSubtitles,
    subtitleLanguages: data.subtitleLanguages,
    mainLanguage: data.language,
    ageRating: data.ageRating || undefined,
    rightHolderId: data.rightHolderId || undefined,
    blockedCountries: data.blockCountries,
  }),

  /**
   * 3. Collecte fichiers (typé strict)
   */
  collectFiles: (form) => {
    const slots = [
      { key: attachmentTypeMap.posterFile as SeriesSlot, file: form.secondaryImage },
      { key: attachmentTypeMap.thumbnailFile as SeriesSlot, file: form.mainImage },
      { key: attachmentTypeMap.trailerFile as SeriesSlot, file: form.trailerFile },
    ];

    return slots.filter(
      (s): s is { key: SeriesSlot; file: File } => s.file instanceof File
    );
  },

  /**
   * 4. Submit metadata (avec logs comme filmAdapter)
   */
  submitMetadata: async (payload, id) => {
    console.log("1. Début appel API série...");
    try {
      const res = id
        ? await seriesApi.update(id, payload)
        : await seriesApi.create(payload);

      console.log("2. Réponse serveur série:", res);

      if (!res?.id) {
        console.error("ERREUR: ID manquant côté serveur !");
        throw new Error("Format de réponse invalide");
      }

      return res.id;
    } catch (err) {
      console.error("3. Erreur dans seriesAdapter:", err);
      throw err;
    }
  },

  /**
   * 5. Presign (AVEC transformation comme filmAdapter)
   */
  presignUploads: async (id, files): Promise<SeriesPresignedSlot[]> => {
    if (files.length === 0) return [];

    const descriptors = files.map(f => ({
      key: f.key,
      name: f.file.name,
      type: f.file.type || "application/octet-stream",
      attachmentType: f.key
    }));

    const slots = await uploadApi.presignUploads(id, "series", descriptors);

    return slots.map(slot => ({
      uploadUrl: slot.uploadUrl,
      finalUrl: slot.finalUrl,
      key: slot.key as SeriesSlot
    }));
  },

  /**
   * 6. Upload (aligné avec filmAdapter : progress + cancel)
   */
  uploadFile: async (url, file, onProgress, signal) => {
    await axios.put(url, file, {
      signal,
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      onUploadProgress: (progressEvent) => {
        const total = progressEvent.total ?? 1;
        const percent = Math.round((progressEvent.loaded * 100) / total);
        onProgress?.(percent);
      },
    });
  },

  /**
   * 7. Finalisation (via uploadApi comme filmAdapter)
   */
  finalizeUploads: async (id, slots) => {
    const payload: UploadFinalizePayload = {
      uploads: slots.map((s) => ({
        key: s.key,
        finalUrl: s.finalUrl,
      })),
    };

    const res = await uploadApi.finalizeUploads(id, payload);

    if (!res || res.ok === false) {
      throw new Error("La finalisation des uploads série a échoué.");
    }
  },

  /**
   * 8. Rollback optionnel
   */
  deleteEntity: async (id) => {
    // await seriesApi.delete(id);
  }
};