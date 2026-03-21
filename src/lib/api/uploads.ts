import { apiRequest } from "./client";
import { type UploadFileDescriptor,
  type UploadFinalizePayload,
  type UploadSlot } from "@/types/attachmentType";  

export async function uploadToPresignedUrl(url: string, file: File): Promise<void> {
  const res = await fetch(url, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type || "application/octet-stream" },
  });
  if (!res.ok) throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
}

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
