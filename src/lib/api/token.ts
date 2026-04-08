// services/token.service.ts
import { apiRequest } from "./client";

interface TokenResponse {
  token: string;
  expiresIn: number; // en secondes
}

export const tokenApi = {
  /**
   * Récupère un token WebSocket depuis le backend
   * @param accessToken - Token d'authentification du dashboard user
   */
  getToken: async (accessToken?: string): Promise<TokenResponse | null> => {
    try {
      const response = await apiRequest<TokenResponse>("/secret/token", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
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
   * @param accessToken - Token d'authentification du dashboard user
   */
  refreshToken: async (accessToken: string): Promise<TokenResponse | null> => {
    try {
      const response = await apiRequest<TokenResponse>("/secret/refresh", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
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
   * @param accessToken - Token d'authentification du dashboard user
   */
  logout: async (accessToken: string): Promise<boolean> => {
    try {
      await apiRequest("/secret/logout", {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('🔓 Déconnexion du WebSocket');
      return true;
      
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      return false;
    }
  }
};