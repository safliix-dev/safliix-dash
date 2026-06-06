import { apiRequest } from "./client";
import {
  type CreateRightsHolderPayload,
  type ImageRightsHolder,
  type ImageRightsHolderDetail,
  type ImageRightsFormStateUpdate,
  type RightsHolderContentResponse,
  type RightsHolderListParams,
  type RightsHolderContentType,
} from "@/types/api/imageRights";

/**
 * API pour gérer les ayants droit
 */
export const imageRightsApi = {
  /** Liste des ayants droit */
  list: (params: RightsHolderListParams, signal?: AbortSignal) =>
    apiRequest<ImageRightsHolder[]>("/rights-holders", { params, signal }),

  /** Détail d’un ayant droit */
  detail: (id: string, signal?: AbortSignal) =>
    apiRequest<ImageRightsHolderDetail>(`/rights-holders/${id}`, { signal }),

  getById: (id:string, signal?:AbortSignal) => 
    apiRequest<ImageRightsHolder>(`/rights-holders/${id}`, {signal}),

  /** Création */
  create: (payload: CreateRightsHolderPayload, signal?: AbortSignal) =>
    apiRequest<ImageRightsHolderDetail>("/rights-holders", {
      method: "POST",
      body: payload,
      
      signal,
    }),
  
  update: (id:string,payload: ImageRightsFormStateUpdate,  signal?: AbortSignal) =>
    apiRequest<ImageRightsHolderDetail>(`/rights-holders/${id}`, {
      method: "PUT",
      body: payload,
      signal,
    }),
  
  delete: (id:string, signal?:AbortSignal) => apiRequest<void>(`/rights-holders/${id}`,{
      method: "DELETE",
      
      signal,
    }),  
  
  /** Récupérer les contenus d’un ayant droit */
  contents: (id: string, type: RightsHolderContentType, signal?: AbortSignal) =>
    apiRequest<RightsHolderContentResponse>(`/api/rights-holders/${id}/contents`, {
      params: { type },
      
      signal,
    }),

  /** Liste globale de contenus filtrés par type et période */
  contentsList: (
    type: RightsHolderContentType,
    accessTokenOrOptions?: string | { signal?: AbortSignal; from?: string; to?: string },
    signal?: AbortSignal,
  ) => {
    const options =
      typeof accessTokenOrOptions === "string"
        ? { accessTokenOrOptions, signal }
        : accessTokenOrOptions || {};
    const { signal: finalSignal } = options;

    return apiRequest<RightsHolderContentResponse[]>(
      "/rights-holders/contents",
      { params: { type }, signal: finalSignal },
    );
  },

  
};

