// lib/api/tokens.ts
import { apiRequest } from "./client";
import type { TokensSaveResponse, TokensGetResponse, TokensRefreshResponse } from "@/types/api/kcToken";

export const tokensApi = {
  /**
   * Sauvegarder les tokens après login Keycloak
   * Utilisé par NextAuth dans le callback jwt
   */
  save: (data: {
    userId: string;
    accessToken: string;
    refreshToken: string;
    idToken: string;
    expiresIn: number;
  }) =>
    apiRequest<TokensSaveResponse>("/auth/tokens/save", {
      method: "POST",
      body: data,
    }),

  /**
   * Récupérer les tokens d'un utilisateur
   */
  get: (userId: string) =>
    apiRequest<TokensGetResponse>(`/auth/tokens/${userId}`, {
      method: "GET",
    }),

  /**
   * Rafraîchir les tokens
   */
  refresh: (userId: string) =>
    apiRequest<TokensRefreshResponse>(`/auth/tokens/refresh/${userId}`, {
      method: "POST",
    }),

  /**
   * Déconnexion (supprimer les tokens)
   */
  delete: (userId: string, refreshToken?: string) =>
    apiRequest<void>(`/auth/tokens/${userId}`, {
      method: "DELETE",
      body: refreshToken ? { refreshToken } : undefined,
    }),

  /**
   * Vérifier si le token est valide
   */
  validate: (userId: string) =>
    apiRequest<{ valid: boolean }>(`/auth/tokens/${userId}/validate`, {
      method: "GET",
    }),
};