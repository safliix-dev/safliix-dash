import { apiRequest } from "./client";
import {
  EpisodeCreateOrUpdateResponse,
  type EpisodeDetail,
  type EpisodeListParams,
  type EpisodeMetadataPayload,
  type EpisodeMetaOptions,
} from "@/types/api/episode";

export const episodeApi = {
  // Options (métadonnées pour les sélecteurs)
  metaOptions: (, seriesId?: string, seasonId?: string) =>
    apiRequest<EpisodeMetaOptions>(`/series/seasons/${seasonId}/episodes/meta`, {  }),

  // Liste des épisodes d'une saison
  list: (seriesId: string, seasonId: string, params?: EpisodeListParams, ) =>
    apiRequest<EpisodeDetail[]>(`/series/${seriesId}/seasons/${seasonId}/episodes`, { params,  }),

  // Récupérer un épisode par son ID
  get: (episodeId: string, ) => 
    apiRequest<EpisodeDetail>(`/episodes/${episodeId}`, {  }),

  // Créer un épisode (nécessite seriesId et seasonId dans le payload)
  create: (payload: EpisodeMetadataPayload, ) =>
    apiRequest<EpisodeCreateOrUpdateResponse>(`/series/${payload.seriesId}/seasons/${payload.seasonId}/episodes`, {
      method: "POST",
      body: payload,
      ,
    }),

  // Mettre à jour un épisode
  update: (episodeId: string, payload: EpisodeMetadataPayload, ) =>
    apiRequest<EpisodeCreateOrUpdateResponse>(`/episodes/${episodeId}`, { 
      method: "PUT", 
      body: payload, 
       
    }),

  // Supprimer un épisode
  delete: (episodeId: string, ) =>
    apiRequest<void>(`/episodes/${episodeId}`, { 
      method: "DELETE", 
       
    }),
};