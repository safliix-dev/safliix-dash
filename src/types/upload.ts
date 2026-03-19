export type UploadStep = "idle" | "presign" | "upload" | "finalize" | "error" | "partial_success";
export type UploadProgress = Record<string, number>;

export type UploadFileDescriptor<TSlot extends string> = {
  key: TSlot;
  file: File;
};

export type PresignedSlot<TSlot extends string> = {
  key: TSlot;
  uploadUrl: string;
  finalUrl: string;
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
}

export interface UploadError<TSlot extends string> {
  key: TSlot;
  error: Error;
}
