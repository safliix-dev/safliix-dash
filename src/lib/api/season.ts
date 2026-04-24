// lib/api/seasons.ts

import { apiRequest } from "./client";
import { SeasonMetadataPayload,SeasonSummary } from "@/types/api/season";

export const seasonsApi = {
  // Créer une saison
  create: (payload: SeasonMetadataPayload, accessToken?: string) =>
    apiRequest<{ id: string }>(`/seasons`, {
      method: "POST",
      body: payload,
      accessToken,
    }),

  // Mettre à jour une saison
  update: (id: string, payload: SeasonMetadataPayload, accessToken?: string) =>
    apiRequest<{ id: string }>(`/seasons/${id}`, {
      method: "PUT",
      body: payload,
      accessToken,
    }),

  // Récupérer une saison
  get: (id: string, accessToken?: string) =>
    apiRequest<SeasonSummary>(`/seasons/${id}`, { accessToken }),

  // Supprimer une saison
  delete: (id: string, accessToken?: string) =>
    apiRequest<void>(`/seasons/${id}`, {
      method: "DELETE",
      accessToken,
    }),
};