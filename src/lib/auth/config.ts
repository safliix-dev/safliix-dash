import { DefaultSession, NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { SessionService } from "@/services/session.service"; // Importe ton service

/* =======================
    TYPES NEXT-AUTH
======================= */
declare module "next-auth" {
  interface Session {
    error?: string;
    user: {
      id?: string;
      roles?: string[];
    } & DefaultSession["user"];
  }

  interface Profile {
    sub?: string;
    preferred_username?: string;
    realm_access?: { roles: string[] };
    resource_access?: { [key: string]: { roles: string[] } };
    realm_roles?: string[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    roles?: string[];
    error?: string;
    accessTokenExpires?: number;
    refreshTokenExpires?: number;
  }
}

/* =======================
    ENV
======================= */
const issuer = process.env.KEYCLOAK_ISSUER!;
const clientId = process.env.KEYCLOAK_CLIENT_ID!;
const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET!;

/* =======================
    NEXT AUTH CONFIG
======================= */
export const authConfig: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId,
      clientSecret,
      issuer,
      authorization: { params: { scope: "openid profile email roles" } },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username ?? null,
          email: profile.email ?? null,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, account, profile }) {
      // 1. SIGN-IN INITIAL
      if (account && profile) {
        // expires_in peut être absent selon la config Keycloak — fallback sur expires_at
        const expires_in =
          (account.expires_in as number) ??
          (account.expires_at ? Math.max(account.expires_at - Math.floor(Date.now() / 1000), 60) : 300);
        const refresh_expires_in = (account.refresh_expires_in as number) ?? 28800;

        // Les rôles sont dans l'access token (realm_access), pas dans l'ID token (profile)
        let allRoles: string[] = [];
        try {
          const accessPayload = JSON.parse(
            Buffer.from(account.access_token!.split('.')[1], 'base64').toString()
          );
          // Supporte realm_access.roles (standard) et realm_roles (claim name custom)
          const realmRoles: string[] = accessPayload.realm_access?.roles ?? accessPayload.realm_roles ?? [];
          const clientRoles: string[] = accessPayload.resource_access?.[clientId]?.roles ?? [];
          allRoles = [...new Set([...realmRoles, ...clientRoles])];
        } catch {
          const realmRoles = profile.realm_roles ?? profile.realm_access?.roles ?? [];
          const clientRoles = profile.resource_access?.[clientId]?.roles ?? [];
          allRoles = [...new Set([...realmRoles, ...clientRoles])];
        }

        try {
          await SessionService.saveTokens(profile.sub!, {
            accessToken: account.access_token!,
            refreshToken: account.refresh_token!,
            expiresIn: expires_in,
            refreshExpiresIn: refresh_expires_in,
            idToken: account.id_token ?? undefined,
          });
        } catch (error) {
          console.error("❌ Redis saveTokens error:", error);
        }

        return {
          sub: profile.sub,
          roles: allRoles,
          accessTokenExpires: Date.now() + expires_in * 1000,
          refreshTokenExpires: Date.now() + refresh_expires_in * 1000,
        };
      }

      // Le refresh token expiré = session définitivement morte
      if (Date.now() > (token.refreshTokenExpires as number)) {
        return { ...token, error: "RefreshTokenExpired" };
      }

      return token;
    },

    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.roles = token.roles || [];
      session.error = token.error;
      return session;
    },
  },
  events: {
    async signOut({ token }) {
      if (token.sub) {
        try {
          await SessionService.deleteSession(token.sub);
        } catch (error) {
          console.error("❌ Redis deleteSession error:", error);
        }
      }
    },
  },
};

export default authConfig;