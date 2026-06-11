import { apiRequest } from "./client";
import { type UploadFileDescriptor,
  type UploadFinalizePayload,
  type UploadSlot } from "@/types/upload";


export const uploadApi = {

  presignUploads: <TKey extends string = string>(
    entityId: string,
    entityType: string,
    files: UploadFileDescriptor<TKey>[],
  ) =>
    apiRequest<UploadSlot<TKey>[]>(`/admin/contents/${entityType}/${entityId}/attachments`, {
      method: "POST",
      body: { files },
    }),

  finalizeUploads: (
    entityType: string,
    entityId: string,
    payload: UploadFinalizePayload,
  ) =>
    apiRequest<{ ok: boolean }>(`/admin/contents/${entityType}/${entityId}/attachments`, {
      method: "PATCH",
      body: { mediaFileIds: payload.mediaFileIds },
    }),

  changeStatus: (id: string, type: string, status: string) =>
    apiRequest<{ ok: boolean }>(`/uploads/update/status`, {
      method: "POST",
      body: { id, type, status },
    }),
};
