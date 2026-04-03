// services/websocket-auth.service.ts
import { tokenApi } from '@/lib/api/token';

class WebSocketAuthService {
  private currentAccessToken: string | null = null;
  private wsToken: string | null = null;
  private wsTokenExpiry: Date | null = null;

  setAccessToken(token: string | null) {
    this.currentAccessToken = token;
    if (!token) this.invalidateToken();
  }

  async getValidToken(): Promise<string | null> {
    if (this.wsToken && this.wsTokenExpiry && new Date() < this.wsTokenExpiry) {
      return this.wsToken;
    }
    return await this.fetchNewToken();
  }

  private async fetchNewToken(): Promise<string | null> {
    if (!this.currentAccessToken) return null;
    
    const response = await tokenApi.getToken(this.currentAccessToken);
    if (response) {
      this.wsToken = response.token;
      this.wsTokenExpiry = new Date(Date.now() + response.expiresIn * 1000);
      return this.wsToken;
    }
    return null;
  }

  invalidateToken() {
    this.wsToken = null;
    this.wsTokenExpiry = null;
  }
}

export const websocketAuth = new WebSocketAuthService();