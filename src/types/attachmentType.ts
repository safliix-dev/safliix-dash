export type AttachmentType = 
  | "MAIN" | "TRAILER" | "BONUS" | "MAKING_OF" | "CLIP" 
  | "PREVIEW" | "ADVERTISEMENT" | "THUMBNAIL" | "POSTER" | "BANNER" | "VIDEO";

// Le "TKey" est générique : il sera "mainImage", "video", etc. selon le formulaire
export interface UploadFileDescriptor<TKey extends string = string> {
  key: TKey;
  name: string;
  type: string;
  attachmentType: AttachmentType;
}

export interface UploadSlot<TKey extends string = string> {
  key: TKey;
  uploadUrl: string;
  finalUrl: string;
}

export interface UploadFinalizePayload<TKey extends string = string> {
  uploads: Array<{
    key: TKey;
    finalUrl: string;
  }>;
}

export const attachmentTypeMap: Record<string, AttachmentType> = {
 mainImage: "POSTER",
  movieFile: "MAIN",        // Corrigé : "VIDEO" n'existe pas dans ton enum Prisma
  trailerFile: "TRAILER",
  secondaryImage: "THUMBNAIL",
  episodeFile: "MAIN",
} as const;