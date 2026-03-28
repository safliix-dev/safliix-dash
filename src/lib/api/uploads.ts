import { apiRequest } from "./client";
import { type UploadFileDescriptor,
  type UploadFinalizePayload,
  type UploadSlot } from "@/types/upload";  


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
  finalizeUploads:(
    id: string, 
    payload: UploadFinalizePayload,
    accessToken?: string
  ) =>
    apiRequest<{ ok: boolean }>(`/uploads/confirm-upload`, {
      method: "POST",
      body: payload,
      accessToken,
    }),
};