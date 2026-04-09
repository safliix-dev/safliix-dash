import { DefaultSession } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";

/* =======================
   TYPES NEXT-AUTH
======================= */

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    idToken?: string;
    error?: string;
    user: {
      name?: string;
      email?: string;
      roles?: string[];
    } & DefaultSession["user"];
  }

  interface Profile {
    preferred_username?: string;
    realm_access?: { roles: string[] };
    resource_access?: { [key: string]: { roles: string[] } };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    idToken?: string;
    error?: string;
    roles?: string[]; // ✅ AJOUT IMPORTANT
    user?: {
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
   REFRESH TOKEN
======================= */

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(
      `${issuer}/protocol/openid-connect/token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: clientId,
          client_secret: clientSecret,
          grant_type: "refresh_token",
          refresh_token: token.refreshToken as string,
        }),
      }
    );

    if (!response.ok) throw new Error("Refresh failed");

    const refreshed = await response.json();

    return {
      ...token,
      accessToken: refreshed.access_token,
      accessTokenExpires:
        Date.now() + (refreshed.expires_in as number) * 1000,
      refreshToken: refreshed.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("❌ RefreshAccessTokenError", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

/* =======================
   NEXT AUTH CONFIG
======================= */

const authConfig: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId,
      clientSecret,
      issuer,
      authorization: {
        params: {
          scope: "openid profile email offline_access",
        },
      },
    }),
  ],

  session: {
    strategy: "jwt",
  },
  debug: true,

  callbacks: {
    async jwt({ token, account, profile }) {
      // 🔐 LOGIN INITIAL
      if (account && profile) {
        const expiresAtMs = account.expires_at
          ? account.expires_at * 1000
          : undefined;

        // ✅ Récupération robuste des rôles
        const realmRoles = profile.realm_access?.roles || [];
        const clientRoles =
          profile.resource_access?.[clientId]?.roles || [];

        token.roles = [...new Set([...realmRoles, ...clientRoles])];

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = expiresAtMs;
        token.idToken = account.id_token;

        token.user = {
          name:
            profile.name ??
            profile.preferred_username ??
            token.name ??
            undefined,
          email: profile.email ?? token.email ?? undefined,
        };

        return token;
      }

      // 🧠 Si pas d'expiration → on ne touche pas
      if (!token.accessTokenExpires) return token;

      // ✅ Token encore valide
      if (Date.now() < token.accessTokenExpires - 30_000) {
        return token;
      }

      // 🔄 Refresh
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.error = token.error;

      session.user.roles = token.roles || [];

      if (token.user) {
        session.user.name = token.user.name;
        session.user.email = token.user.email;
      }

      return session;
    },
  }
};

export default authConfig;