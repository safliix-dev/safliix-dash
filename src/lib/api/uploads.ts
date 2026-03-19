import { apiRequest } from "./client";
import { type UploadFileDescriptor,
  type UploadFinalizePayload,
  type UploadSlot } from "@/types/attachmentType";  

export const uploadApi = {
  
  presignUploads: (entityId: string, entityType: string, files: UploadFileDescriptor[], accessToken?: string) =>
    apiRequest<UploadSlot[]>(`/uploads/presign-uploads`, {
      method: "POST",
      body: { 
        files,
        entityId,
        entityType },
      accessToken,
    }),

  finalizeUploads: (id: string, payload: UploadFinalizePayload, accessToken?: string) =>
    apiRequest<{ ok: boolean }>(`/admin/movies/${id}/uploads/finalize`, {
      method: "POST",
      body: payload,
      accessToken,
    }),

  
};
