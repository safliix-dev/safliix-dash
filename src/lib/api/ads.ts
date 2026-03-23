import { apiRequest } from "./client";
import { AdsMetadataPayload, type AdsListParams, type AdsListResponse } from "@/types/api/ads";

export const adsApi = {
  list: (params?: AdsListParams, accessToken?: string, signal?: AbortSignal) =>
    apiRequest<AdsListResponse>("/admin/ads", { params: params as Record<string, string | number | boolean | null | undefined> | undefined, accessToken, signal }),

  create: (payload: AdsMetadataPayload, accessToken?: string, signal?: AbortSignal) =>
    apiRequest<{id:string}>("/admin/ads", { method: "POST", body: payload, accessToken, signal }),

  update: (id: string, payload: AdsMetadataPayload, accessToken?: string, signal?: AbortSignal) =>
    apiRequest<{id:string}>(`/admin/ads/${id}`, { method: "PUT", body: payload, accessToken, signal }),

  metaOptions: (accessToken?: string, signal?: AbortSignal) =>
    apiRequest<{ lines: string[] }>(`/admin/ads/meta/options`, { accessToken, signal }),

};
