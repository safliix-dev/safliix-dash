import { filmsApi } from "@/lib/api/films";
import { uploadToPresignedUrl } from "@/lib/api/uploads";
import { FilmFormData,FilmUploadFinalizePayload, FilmMetadataPayload, FilmPresignedSlot,FilmUploadFileDescriptor,FilmUploadKey } from "@/types/api/films"; 
import { MediaFormEngineConfig } from "@/lib/hooks/form/useMediaFormEngine";

const attachmentTypeMap: Record<FilmUploadKey, FilmUploadFileDescriptor["attachmentType"]> = {
  main: "POSTER",      // L'image principale est un poster
  secondary: "THUMBNAIL", 
  trailer: "TRAILER",
  movie: "MAIN",       // Le fichier film est le "MAIN"
};

export const filmAdapter: MediaFormEngineConfig<
  FilmFormData,
  FilmMetadataPayload,
  string, // TSlot
  FilmPresignedSlot
> = {
  // 1. On transforme les données du formulaire pour l'API
  buildMetadata: (form) => {
    return {
      title: form.title,
      description: form.description,
      type: form.type,
      // Logique métier : prix nul si abonnement
      rentalPrice: form.type === "abonnement" ? undefined : (form.price ?? undefined),
      format: form.format,
      category: form.category,
      gender: form.genre, // Mapping genre -> gender
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
      blockCountries: form.blockCountries,
    };
  },

  // 2. On définit quels fichiers doivent être uploadés
  collectFiles: (form) => {
    const slots = [
      { key: "mainImage", file: form.mainImage },
      { key: "movieFile", file: form.movieFile },
      { key: "trailerFile", file: form.trailerFile },
    ];
    // On ne garde que les slots qui ont réellement un fichier
    return slots.filter((s): s is { key: string; file: File } => s.file instanceof File);
  },

  // 3. Sauvegarde (Create ou Update)
  submitMetadata: async (payload, id) => {
  try {
    console.log("Payload envoyé:", payload);
    console.log("ID envoyé:", id);

    const res = id 
      ? await filmsApi.update(id, payload) 
      : await filmsApi.create(payload);

    console.log("Réponse API:", res);
    return res.id;
  } catch (e) {
    console.error("Erreur API complète:", e);
    throw e;
  }
},


  // 4. Récupération des URLs S3
  presignUploads: async (id, files) => {
    const descriptors: FilmUploadFileDescriptor[] = files.map(f => ({
      key: f.key as FilmUploadKey,
      name: f.file.name,
      type: f.file.type || "application/octet-stream",
      attachmentType: attachmentTypeMap[f.key as FilmUploadKey]
    }));

    return filmsApi.presignUploads(id, descriptors);
  },

  // 5. Upload physique vers S3
  uploadFile: async (url, file) => {
    await uploadToPresignedUrl(url, file);
  },

  // 6. Finalisation
  // Dans ton filmAdapter
finalizeUploads: async (id, slots) => {
  // On prépare le payload selon l'interface FilmUploadFinalizePayload
  const payload: FilmUploadFinalizePayload = {
    uploads: slots.map((s) => ({
      key: s.key as FilmUploadKey,
      finalUrl: s.finalUrl,
    })),
  };

  // Appel à la méthode de ton API
  const res = await filmsApi.finalizeUploads(id, payload);
  
  if (!res.ok) {
    throw new Error("La finalisation de l'upload a échoué côté serveur.");
  }
}
};