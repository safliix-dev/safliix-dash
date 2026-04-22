export type UploadStep = "idle" | "presign" | "upload" | "finalize" | "error" | "partial_success" | "done";
export type UploadProgress = Record<string, number>;

export type UploadFileDescriptor<TSlot extends string> = {
  key: TSlot;
  file: File;
};

export type PresignedSlot<TSlot extends string> = {
  key: TSlot;
  uploadUrl: string;
  finalUrl: string;
  mediaFileId:string;
};

export type UploadTimeouts = {
  presign?: number;     // timeout en ms pour l'étape presign
  upload?: number;      // timeout en ms pour chaque upload
  finalize?: number;    // timeout en ms pour la finalisation
};

export type RetryConfig = {
  maxRetries?: number;              // Nombre maximum de tentatives
  retryDelay?: number;              // Délai entre les tentatives (ms)
  retryCondition?: (error: Error, key: string) => boolean; // Condition pour réessayer
};

export type UploadWorkflowConfig<TSlot extends string> = {
  presign: (files: UploadFileDescriptor<TSlot>[]) => Promise<PresignedSlot<TSlot>[]>;
  uploadToUrl: (url: string, file: File, onProgress: (p: number) => void, signal: AbortSignal) => Promise<void>;
  finalize: (uploads: { key: TSlot; finalUrl: string }[]) => Promise<void>;
  timeouts?: UploadTimeouts;
};

export type UploadResult<TSlot extends string> = {
  successful: { key: TSlot; finalUrl: string }[];
  failed: { key: TSlot; error: Error }[];
  cancelled: boolean;
  stats: UploadStats;
  failedKeys: TSlot[];     
  successfulKeys: TSlot[];
};
export type UploadStats = {
  totalFiles: number;
  totalBytes: number;
  uploadedBytes: number;
  speed: number; // bytes/sec
  timeRemaining: number; // secondes
  startTime: number;
  endTime?: number;
};

export interface UploadState<TSlot extends string> {
  step: UploadStep;
  detail: string | null;
  progress: UploadProgress;
  globalProgress: number;
  errors: UploadError<TSlot>[];
  stats: UploadStats;
  failedKeys: TSlot[];                                      // ✅ Ajouté
  successfulKeys: TSlot[];                                  // ✅ Ajouté
  failedAtStage: Map<TSlot, 'presign' | 'upload'>;         // ✅ Ajouté
}

export interface UploadError<TSlot extends string> {
  key: TSlot;
  error: Error;
}

export type AttachmentType = 
  | "MAIN" | "TRAILER" | "BONUS" | "MAKING_OF" | "CLIP" 
  | "PREVIEW" | "ADVERTISEMENT" | "THUMBNAIL" | "POSTER" | "BANNER" | "VIDEO";


export interface UploadSlot<TKey extends string = string> {
  key: TKey;
  uploadUrl: string;
  finalUrl: string;
  mediaFileId: string;
}

export interface UploadFinalizePayload {
  entityId: string;  
  mediaFileIds: string[]; // La liste des IDs S3/DB
}

export const attachmentTypeMap: Record<string, AttachmentType> = {
 mainImage: "POSTER",
  movieFile: "MAIN",        // Corrigé : "VIDEO" n'existe pas dans ton enum Prisma
  trailerFile: "TRAILER",
  secondaryImage: "THUMBNAIL",
  episodeFile: "MAIN",
} as const;
