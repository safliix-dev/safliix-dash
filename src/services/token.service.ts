// services/token.service.ts
import { SessionService } from "./session.service";


interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Service centralisé pour la gestion des tokens
 */
export class TokenService {
  private static readonly REFRESH_BUFFER_SECONDS = 60; // 1 minute avant expiration

  /**
   * Vérifier si un token est expiré
   */
  static isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= (expiresAt - this.REFRESH_BUFFER_SECONDS) * 1000;
  }

  /**
   * Rafraîchir le token via Keycloak
   */
  static async refreshWithKeycloak(refreshToken: string): Promise<RefreshedTokens | null> {
    const issuer = process.env.KEYCLOAK_ISSUER!;
    const clientId = process.env.KEYCLOAK_CLIENT_ID!;
    const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET!;

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    try {
      const response = await fetch(`${issuer}/protocol/openid-connect/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params,
      });

      if (!response.ok) {
        console.error("❌ Keycloak refresh failed:", response.status);
        return null;
      }

      const data = await response.json();

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresIn: data.expires_in,
      };
    } catch (error) {
      console.error("❌ Refresh token error:", error);
      return null;
    }
  }

  /**
   * Récupérer un token valide (avec refresh automatique si nécessaire)
   */
  static async getValidToken(userId: string): Promise<string | null> {
    let session = await SessionService.getTokens(userId);

    if (!session?.accessToken) {
      console.log(`[TokenService] No session found for ${userId}`);
      return null;
    }

    // Vérifier si le token a expiré
    if (this.isTokenExpired(session.expiresAt) && session.refreshToken) {
      console.log(`🔄 [TokenService] Token expired for ${userId}, refreshing...`);

      const newTokens = await this.refreshWithKeycloak(session.refreshToken);

      if (newTokens) {
        await SessionService.updateTokens(userId, {
          accessToken: newTokens.accessToken,
          refreshToken: newTokens.refreshToken,
          expiresIn: newTokens.expiresIn,
        });

        session = await SessionService.getTokens(userId);
        console.log(`✅ [TokenService] Token refreshed for ${userId}`);
      } else {
        console.error(`❌ [TokenService] Refresh failed for ${userId}`);
        return null;
      }
    }

    return session?.accessToken || null;
  }

  /**
   * Sauvegarder les tokens après login
   */
  static async saveTokens(
    userId: string,
    tokens: { accessToken: string; refreshToken: string; expiresIn: number }
  ) {
    return await SessionService.saveTokens(userId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  }

  /**
   * Mettre à jour les tokens
   */
  static async updateTokens(
    userId: string,
    tokens: { accessToken: string; refreshToken: string; expiresIn: number }
  ) {
    return await SessionService.updateTokens(userId, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresIn: tokens.expiresIn,
    });
  }

  /**
   * Supprimer les tokens (logout)
   */
  static async deleteTokens(userId: string) {
    return await SessionService.deleteSession(userId);
  }

  
  
}