import { apiRequest } from "./client";
import { type UploadFileDescriptor,
  type UploadFinalizePayload,
  type UploadSlot } from "@/types/attachmentType";  


export const uploadApi = {
  
  // 👈 Ajouter le générique TKey
  presignUploads: <TKey extends string = string>(
    entityId: string, 
    entityType: string, 
    files: UploadFileDescriptor<TKey>[],  // 👈 Utiliser le générique
    accessToken?: string
  ) =>
    apiRequest<UploadSlot<TKey>[]>(`/uploads/presign-uploads`, {  // 👈 Retour avec le générique
      method: "POST",
      body: { 
        files,
        entityId,
        entityType 
      },
      accessToken,
    }),

  // 👈 Ajouter le générique TKey aussi pour finalizeUploads
  finalizeUploads: <TKey extends string = string>(
    id: string, 
    payload: UploadFinalizePayload<TKey>,  // 👈 Utiliser le générique
    accessToken?: string
  ) =>
    apiRequest<{ ok: boolean }>(`/admin/movies/${id}/uploads/finalize`, {
      method: "POST",
      body: payload,
      accessToken,
    }),
};