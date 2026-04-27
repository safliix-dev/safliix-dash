import { prisma } from "@/lib/prisma";

export const SessionService = {
  /**
   * Sauvegarde ou met à jour les tokens après un login ou un refresh
   */
  async saveTokens(userId: string, data: { accessToken: string; refreshToken: string; expiresIn: number }) {
    const expiresAt = Math.floor(Date.now() / 1000) + data.expiresIn;

    return await prisma.sessionStore.upsert({
      where: { userId },
      update: {
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: expiresAt,
      },
      create: {
        userId,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresAt: expiresAt,
      },
    });
  },

  async updateTokens(userId: string, tokens: { accessToken: string; refreshToken: string; expiresIn: number }) {
    const session = await prisma.sessionStore.update({
      where: { userId },
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Math.floor(Date.now() / 1000) + tokens.expiresIn,
        updatedAt: new Date(),
      },
    });
    
    return session;
  },

  /**
   * Récupère les tokens pour le Proxy
   */
  async getTokens(userId: string) {
    return await prisma.sessionStore.findUnique({
      where: { userId },
    });
  },

  /**
   * Supprime la session (utile au sign-out)
   */
  async deleteSession(userId: string) {
    return await prisma.sessionStore.deleteMany({
      where: { userId },
    });
  }
};