import { apiRequest } from "./client";
import { UserPayload, type UserListParams, type UserListResponse, type UserProfile, type UserUpdatePayload } from "@/types/api/users";

export const usersApi = {
  list: (params: UserListParams) =>
    apiRequest<UserListResponse>("/users", { params}),

  create: (payload:UserPayload,signal?:AbortSignal) =>
    apiRequest<void>("/users", {method:"POST", body:payload , signal }),

  delete: (id:string, signal?:AbortSignal) =>
    apiRequest<void>(`/users/${id}`,{ method:"DELETE",signal}),

  detail: (id: string, ) =>
    apiRequest<UserProfile>(`/users/${id}`, {  }),

  update: (id: string, payload: UserUpdatePayload) =>
    apiRequest<UserProfile>(`/users/${id}`, { method: "PATCH", body: payload,  })
};
