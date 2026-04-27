import { apiRequest } from "./client";
import { AdsMetadataPayload, type AdsListParams, type AdsListResponse } from "@/types/api/ads";

export const adsApi = {
  list: (params?: AdsListParams, signal?: AbortSignal) =>
    apiRequest<AdsListResponse>("/admin/ads", { params: params as Record<string, string | number | boolean | null | undefined> | undefined, signal }),

  create: (payload: AdsMetadataPayload, signal?: AbortSignal) =>
    apiRequest<{id:string}>("/admin/ads", { method: "POST", body: payload, signal }),

  update: (id: string, payload: AdsMetadataPayload, signal?: AbortSignal) =>
    apiRequest<{id:string}>(`/admin/ads/${id}`, { method: "PUT", body: payload, signal }),

  metaOptions: (signal?: AbortSignal) =>
    apiRequest<{ lines: string[] }>(`/admin/ads/meta/options`, { signal }),

};
