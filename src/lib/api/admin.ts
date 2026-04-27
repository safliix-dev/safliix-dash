
import { apiRequest } from "./client";
import { type AdminListParams, type AdminListResponse, type AdminProfile, type AdminUpdatePayload, type AdminFormState } from "@/types/api/admin";

export const adminsApi = {

  create: (payload: AdminFormState) => apiRequest<void>("/adminUser",{method:"POST",body:payload,}),

  list: (params: AdminListParams, ) =>
    apiRequest<AdminListResponse>("/adminUser", { params,  }),

  detail: (id: string, ) =>
    apiRequest<AdminProfile>(`/adminUser/${id}`, {  }),

  getById: (id:string) => apiRequest<AdminFormState>(`/adminUser/${id}`,{  }),

  update: (id: string, payload: AdminUpdatePayload, ) =>
    apiRequest<AdminProfile>(`/adminUser/${id}`, { method: "PUT", body: payload,  }),

  delete: (id:string) => apiRequest<void>(`/adminUser/${id}`, {})
};
