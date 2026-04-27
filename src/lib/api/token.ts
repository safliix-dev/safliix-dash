// services/token.service.ts
import { apiRequest } from "./client";

interface TokenResponse {
  token: string;
  expiresIn: number; // en secondes
}

export const tokenApi = {
  /**
   * Récupère un token WebSocket depuis le backend
   * @param  - Token d'authentification du dashboard user
   */
  getToken: async (): Promise<TokenResponse | null> => {
    try {
      const response = await apiRequest<TokenResponse>("/secret/token", {
        method: 'POST'
      });
      
      console.log('✅ Token WebSocket récupéré avec succès');
      return response;
      
    } catch (error) {
      console.error('❌ Erreur lors de la récupération du token:', error);
      return null;
    }
  },

  /**
   * Rafraîchit le token
   * @param  - Token d'authentification du dashboard user
   */
  refreshToken: async (): Promise<TokenResponse | null> => {
    try {
      const response = await apiRequest<TokenResponse>("/secret/refresh", {
        method: 'POST',

      });
      
      console.log('🔄 Token WebSocket rafraîchi');
      return response;
      
    } catch (error) {
      console.error('❌ Erreur lors du refresh du token:', error);
      return null;
    }
  },

  /**
   * Déconnecte et invalide le token
   * @param  - Token d'authentification du dashboard user
   */
  logout: async (): Promise<boolean> => {
    try {
      await apiRequest("/secret/logout", {
        method: 'POST',
      });
      
      console.log('🔓 Déconnexion du WebSocket');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      return false;
    }
  }
};