import { seriesApi } from "@/lib/api/series";
import { uploadToPresignedUrl } from "@/lib/api/uploads";
import { SeriesMetadataPayload,SeriesFormData } from "@/types/api/series";
import { MediaFormEngineConfig } from "@/lib/hooks/form/useMediaFormEngine";
import { 
  attachmentTypeMap, 
  UploadFileDescriptor, 
  UploadFinalizePayload, 
  AttachmentType,  
  UploadSlot 
} from "@/types/attachmentType";

export const seriesAdapter: MediaFormEngineConfig<
  SeriesFormData,
  SeriesMetadataPayload,
  string, // TSlotKey
  UploadSlot    // TSlot (Remplace par ton type de slot série si disponible)
> = {
  // 1. Transformation des données pour l'API
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

  // 2. Collecte des fichiers spécifiques aux séries
  collectFiles: (form) => {
    const slots = [
      { key: "posterFile", file: form.mainImage },
      { key: "heroFile", file: form.secondaryImage },
      { key: "trailerFile", file: form.trailerFile },
    ];
    return slots.filter((s): s is { key: string; file: File } => s.file instanceof File);
  },

  // 3. Persistance
  submitMetadata: async (payload, id) => {
    const res = id 
      ? await seriesApi.update(id, payload) 
      : await seriesApi.create(payload);
    return res.id;
  },

  // 4. S3 Presign
  presignUploads: async (id, files) => {
    const descriptors: UploadFileDescriptor[] = files.map(f => ({
      key: f.key,
      name: f.file.name,
      type: f.file.type || "application/octet-stream",
      attachmentType: attachmentTypeMap[f.key as keyof typeof attachmentTypeMap] as AttachmentType
    }));

    return seriesApi.presignUploads(id, descriptors);
  },

  // 5. Upload physique
  uploadFile: async (url, file) => {
    await uploadToPresignedUrl(url, file);
  },

  // 6. Finalisation
  finalizeUploads: async (id, slots) => {
    const payload: UploadFinalizePayload = {
      uploads: slots.map((s) => ({
        key: s.key,
        finalUrl: s.finalUrl,
      })),
    };
    const res = await seriesApi.finalizeUploads(id, payload);
    if (!res.ok) throw new Error("La finalisation de l'upload série a échoué.");
  }
};