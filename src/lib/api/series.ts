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
  list: (params: SeriesListParams, ) =>
    apiRequest<SeriesListResponse>("/series", { params,  }),

  detail: (id: string, ) => apiRequest<SeriesDetail>(`/series/${id}`, {  }),

  create: (payload: SeriesMetadataPayload, ) =>
    apiRequest<SeriesCreateOrUpdateResponse>("/series", { method: "POST", body: payload,  }),

  update: (id: string, payload: SeriesMetadataPayload, ) =>
    apiRequest<SeriesCreateOrUpdateResponse>(`/series/${id}`, { method: "PUT", body: payload,  }),

  
 
  metaOptions: () => apiRequest<SeriesMetaOptions>("/series/meta/options", {  }),

  // Seasons
  createSeason: (seriesId: string, payload: CreateSeasonPayload, ) =>
    apiRequest<{ seasonId: string }>(`/series/${seriesId}/seasons`, { method: "POST", body: payload,  }),

 
  
  
};
