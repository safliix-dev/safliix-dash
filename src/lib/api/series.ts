import { apiRequest } from "./client";
import {
  type CreateSeasonPayload,
  type SeriesCreateOrUpdateResponse,
  type SeriesDetail,
  type SeriesListParams,
  type SeriesListResponse,
  type SeriesMetaOptions,
  type SeriesMetadataPayload,
  
} from "@/types/api/series";


export const seriesApi = {
  list: (params: SeriesListParams, accessToken?: string) =>
    apiRequest<SeriesListResponse>("/series", { params, accessToken }),

  detail: (id: string, accessToken?: string) => apiRequest<SeriesDetail>(`/series/${id}`, { accessToken }),

  create: (payload: SeriesMetadataPayload, accessToken?: string) =>
    apiRequest<SeriesCreateOrUpdateResponse>("/series", { method: "POST", body: payload, accessToken }),

  update: (id: string, payload: SeriesMetadataPayload, accessToken?: string) =>
    apiRequest<SeriesCreateOrUpdateResponse>(`/series/${id}`, { method: "PUT", body: payload, accessToken }),

  
 
  metaOptions: (accessToken?: string) => apiRequest<SeriesMetaOptions>("/series/meta/options", { accessToken }),

  // Seasons
  createSeason: (seriesId: string, payload: CreateSeasonPayload, accessToken?: string) =>
    apiRequest<{ seasonId: string }>(`/series/${seriesId}/seasons`, { method: "POST", body: payload, accessToken }),

 
  
  
};
