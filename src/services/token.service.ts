import { SessionService } from "./session.service";
import { redis } from "@/lib/redis";

interface RefreshedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export class TokenService {
  private static readonly REFRESH_BUFFER_SECONDS = 60;
  private static readonly LOCK_TTL_SECONDS = 10;
  private static readonly LOCK_WAIT_MS = 200;

  static isTokenExpired(expiresAt: number): boolean {
    return Date.now() >= (expiresAt - this.REFRESH_BUFFER_SECONDS) * 1000;
  }

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

  static async getValidToken(userId: string): Promise<string | null> {
    const session = await SessionService.getTokens(userId);

    if (!session?.accessToken) {
      console.log(`[TokenService] No session found for ${userId}`);
      return null;
    }

    if (!this.isTokenExpired(session.expiresAt)) {
      return session.accessToken;
    }

    if (!session.refreshToken) {
      return null;
    }

    console.log(`🔄 [TokenService] Token expired for ${userId}, refreshing...`);

    const lockKey = `lock:refresh:${userId}`;
    const lockAcquired = await redis.set(lockKey, "1", "EX", this.LOCK_TTL_SECONDS, "NX");

    if (lockAcquired === "OK") {
      try {
        const newTokens = await this.refreshWithKeycloak(session.refreshToken);
        if (!newTokens) {
          console.error(`❌ [TokenService] Refresh failed for ${userId}`);
          return null;
        }
        await SessionService.updateTokens(userId, newTokens);
        console.log(`✅ [TokenService] Token refreshed for ${userId}`);
        return newTokens.accessToken;
      } finally {
        await redis.del(lockKey);
      }
    }

    // Another instance is refreshing — wait and read the updated session
    await new Promise((resolve) => setTimeout(resolve, this.LOCK_WAIT_MS));
    const refreshed = await SessionService.getTokens(userId);
    return refreshed?.accessToken ?? null;
  }

  static async saveTokens(
    userId: string,
    tokens: { accessToken: string; refreshToken: string; expiresIn: number }
  ) {
    return await SessionService.saveTokens(userId, tokens);
  }

  static async updateTokens(
    userId: string,
    tokens: { accessToken: string; refreshToken: string; expiresIn: number }
  ) {
    return await SessionService.updateTokens(userId, tokens);
  }

  static async deleteTokens(userId: string) {
    return await SessionService.deleteSession(userId);
  }
}