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
    // On ne garde QUE l'expiration pour savoir quand le Proxy doit refresh
    accessTokenExpires?: number; 
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
        const realmRoles = profile.realm_roles || profile.realm_access?.roles || [];
        const clientRoles = profile.resource_access?.[clientId]?.roles || [];
        const allRoles = [...new Set([...realmRoles, ...clientRoles])];
        const expires_in = (account.expires_in as number) ?? 300;

        await SessionService.saveTokens(profile.sub!, {
          accessToken: account.access_token!,
          refreshToken: account.refresh_token!,
          expiresIn: expires_in,
        });

        // On retourne un JWT NextAuth ultra léger
        return {
          sub: profile.sub,
          roles: allRoles,
          accessTokenExpires: Date.now() + expires_in * 1000,
        };
      }

      // 2. CHECK EXPIRATION (Optionnel ici, le Proxy pourra aussi le faire)
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Si expiré, on peut marquer le token pour que le Proxy sache qu'il faut refresh
      return { ...token, error: "AccessTokenExpired" };
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
          console.error("❌ SQLite Logout error:", error);
        }
      }
    },
  },
};

export default authConfig;