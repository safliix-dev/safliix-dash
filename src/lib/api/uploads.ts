import { apiRequest } from "./client";
import { type UploadFileDescriptor,
  type UploadFinalizePayload,
  type UploadSlot } from "@/types/upload";  


export const uploadApi = {
  
  
  presignUploads: <TKey extends string = string>(
    entityId: string, 
    entityType: string, 
    files: UploadFileDescriptor<TKey>[],  // 👈 Utiliser le générique
    
  ) =>
    apiRequest<UploadSlot<TKey>[]>(`/uploads/presign-uploads`, {  // 👈 Retour avec le générique
      method: "POST",
      body: { 
        files,
        entityId,
        entityType 
      },
    }),

  // 👈 Ajouter le générique TKey aussi pour finalizeUploads
  finalizeUploads:(
    id: string, 
    payload: UploadFinalizePayload,
    
  ) =>
    apiRequest<{ ok: boolean }>(`/uploads/confirm-upload`, {
      method: "POST",
      body: payload,
    }),

  changeStatus: (id: string,type:string, status: string) =>
    apiRequest<{ ok: boolean }>(`/uploads/update/status`, {
      method: "POST",
      body: { id, type,status },
    }),
};