// lib/api/seasons.ts

import { apiRequest } from "./client";
import { SeasonMetadataPayload,SeasonSummary } from "@/types/api/season";

export const seasonsApi = {
  // Créer une saison
  create: (payload: SeasonMetadataPayload, ) =>
    apiRequest<{ id: string }>(`/seasons`, {
      method: "POST",
      body: payload,
    
    }),

  // Mettre à jour une saison
  update: (id: string, payload: SeasonMetadataPayload, ) =>
    apiRequest<{ id: string }>(`/seasons/${id}`, {
      method: "PUT",
      body: payload,
      
    }),

  // Récupérer une saison
  get: (id: string, ) =>
    apiRequest<SeasonSummary>(`/seasons/${id}`, {  }),

  // Supprimer une saison
  delete: (id: string, ) =>
    apiRequest<void>(`/seasons/${id}`, {
      method: "DELETE",
      
    }),
};