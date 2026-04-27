import { apiRequest } from "./client";
import {
  type FilmActionPayload,
  type FilmActionResponse,
  type FilmCreateOrUpdateResponse,
  type FilmDetail,
  type FilmListParams,
  type FilmListResponse,
  type FilmMetadataPayload,
  type FilmMetaOptions,
} from "@/types/api/films";


export const filmsApi = {
  list: (params: FilmListParams, ) =>
    apiRequest<FilmListResponse>("/admin/movies", {
      params,
      ,
    }),

  detail: (id: string, ) =>
    apiRequest<FilmDetail>(`/admin/movies/${id}`, {  }),

  create: (payload: FilmMetadataPayload, ) =>
    apiRequest<FilmCreateOrUpdateResponse>("/admin/movies", {
      method: "POST",
      body: payload,
      ,
    }),

  update: (id: string, payload: FilmMetadataPayload, ) =>
    apiRequest<FilmCreateOrUpdateResponse>(`/admin/movies/${id}`, {
      method: "PUT",
      body: payload,
      ,
    }),

  performAction: (id: string, payload: FilmActionPayload, ) =>
    apiRequest<FilmActionResponse>(`/admin/movies/${id}/actions`, {
      method: "POST",
      body: payload,
      ,
    }),

  

  metaOptions: () =>
    apiRequest<FilmMetaOptions>("/admin/movies/meta/options", {  }),
};
