// auth.config.ts
import { DefaultSession, NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { tokensApi } from "@/lib/api/kcToken";

/* =======================
   TYPES NEXT-AUTH
======================= */

declare module "next-auth" {
  interface Session {
    error?: string;
    user: {
      id?: string;
      name?: string;
      email?: string;
      roles?: string[];
    } & DefaultSession["user"];
  }

  interface Profile {
    sub?: string;
    preferred_username?: string;
    realm_access?: { roles: string[] };
    resource_access?: { [key: string]: { roles: string[] } };
    realm_roles?: string[];
    email?: string;
    name?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub?: string;
    accessTokenExpires?: number;
    error?: string;
    roles?: string[];
    user?: {
      id?: string;
      name?: string;
      email?: string;
    };
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
      authorization: {
        params: {
          scope: "openid profile email roles",
        },
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username ?? null,
          email: profile.email ?? null,
          realm_roles: profile.realm_roles || [],
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },

  debug: true,

  callbacks: {
    async jwt({ token, account, profile }) {
      // 🔐 LOGIN INITIAL - Sauvegarde dans le backend Nest.js
      if (account && profile) {
        // Vérification que les tokens existent
        if (!account.access_token || !account.refresh_token || !account.id_token) {
          console.error("❌ Tokens manquants dans le compte Keycloak");
          return token;
        }

        // Récupération des rôles
        const realmRoles = profile.realm_roles || profile.realm_access?.roles || [];
        const clientRoles = profile.resource_access?.[clientId]?.roles || [];

        token.sub = profile.sub;
        token.roles = [...new Set([...realmRoles, ...clientRoles])];
        token.user = {
          id: profile.sub,
          name: profile.name ?? profile.preferred_username ?? profile.email ?? "Utilisateur",
          email: profile.email ?? undefined,
        };

        // ⭐ SAUVEGARDE DES TOKENS VIA TON API
        const expiresIn = typeof account.expires_in === 'number' 
        ? account.expires_in 
        : 300;
        try {
          await tokensApi.save({
            userId: profile.sub!,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            idToken: account.id_token,
            expiresIn: expiresIn,
          });
          
          console.log(`✅ Tokens sauvegardés pour ${profile.sub}`);
        } catch (error) {
          console.error("❌ Erreur sauvegarde tokens:", error);
        }

        return token;
      }

      // 🧠 GESTION EXPIRATION
      if (token.sub && (!token.accessTokenExpires || Date.now() >= token.accessTokenExpires - 30000)) {
        try {
          // ⭐ RAFRAÎCHIR VIA TON API
          const response = await tokensApi.refresh(token.sub);
          
          if (response.success && response.expiresIn) {
            token.accessTokenExpires = Date.now() + response.expiresIn * 1000;
            console.log(`✅ Tokens rafraîchis pour ${token.sub}`);
          }
        } catch (error) {
          console.error("❌ Refresh error:", error);
          token.error = "RefreshAccessTokenError";
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Session LÉGÈRE - uniquement les infos nécessaires
      session.user.id = token.sub;
      session.user.name = token.user?.name;
      session.user.email = token.user?.email;
      session.user.roles = token.roles || [];
      session.error = token.error;

      return session;
    },
  },

  events: {
    async signOut({ token }) {
      // ⭐ DÉCONNEXION VIA TON API
      if (token.sub) {
        try {
          await tokensApi.delete(token.sub);
          console.log(`✅ Logout backend pour ${token.sub}`);
        } catch (error) {
          console.error("❌ Logout error:", error);
        }
      }
    },
  },
};

export default authConfig;