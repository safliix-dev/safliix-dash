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
  metaOptions: (accessToken?: string, seriesId?: string, seasonId?: string) =>
    apiRequest<EpisodeMetaOptions>(`/series/seasons/${seasonId}/episodes/meta`, { accessToken }),

  // Liste des épisodes d'une saison
  list: (seriesId: string, seasonId: string, params?: EpisodeListParams, accessToken?: string) =>
    apiRequest<EpisodeDetail[]>(`/series/${seriesId}/seasons/${seasonId}/episodes`, { params, accessToken }),

  // Récupérer un épisode par son ID
  get: (episodeId: string, accessToken?: string) => 
    apiRequest<EpisodeDetail>(`/episodes/${episodeId}`, { accessToken }),

  // Créer un épisode (nécessite seriesId et seasonId dans le payload)
  create: (payload: EpisodeMetadataPayload, accessToken?: string) =>
    apiRequest<EpisodeCreateOrUpdateResponse>(`/series/${payload.seriesId}/seasons/${payload.seasonId}/episodes`, {
      method: "POST",
      body: payload,
      accessToken,
    }),

  // Mettre à jour un épisode
  update: (episodeId: string, payload: EpisodeMetadataPayload, accessToken?: string) =>
    apiRequest<EpisodeCreateOrUpdateResponse>(`/episodes/${episodeId}`, { 
      method: "PUT", 
      body: payload, 
      accessToken 
    }),

  // Supprimer un épisode
  delete: (episodeId: string, accessToken?: string) =>
    apiRequest<void>(`/episodes/${episodeId}`, { 
      method: "DELETE", 
      accessToken 
    }),
};