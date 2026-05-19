import { redis } from "@/lib/redis";

interface SessionData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  idToken?: string;
}

const key = (userId: string) => `session:${userId}`;

export const SessionService = {
  async saveTokens(userId: string, data: { accessToken: string; refreshToken: string; expiresIn: number; idToken?: string }) {
    const expiresAt = Math.floor(Date.now() / 1000) + data.expiresIn;
    const payload: SessionData = {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      expiresAt,
      idToken: data.idToken,
    };
    await redis.set(key(userId), JSON.stringify(payload), "EX", data.expiresIn + 3600);
  },

  async updateTokens(userId: string, tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {
    const expiresAt = Math.floor(Date.now() / 1000) + tokens.expiresIn;
    const payload: SessionData = {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      expiresAt,
    };
    await redis.set(key(userId), JSON.stringify(payload), "EX", tokens.expiresIn + 3600);
  },

  async getTokens(userId: string): Promise<SessionData | null> {
    const raw = await redis.get(key(userId));
    if (!raw) return null;
    return JSON.parse(raw) as SessionData;
  },

  async deleteSession(userId: string) {
    await redis.del(key(userId));
  },
};
