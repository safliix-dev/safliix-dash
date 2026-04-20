import { DefaultSession, NextAuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
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
    realm_roles?: string[]; // Ajouté pour correspondre à tes logs Keycloak
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    idToken?: string;
    error?: string;
    roles?: string[];
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
      accessTokenExpires: Date.now() + (refreshed.expires_in as number) * 1000,
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

export const authConfig: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId,
      clientSecret,
      issuer,
      authorization: {
        params: {
          scope: "openid profile email roles", // Ajout de "roles" pour être sûr
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

        // ✅ RÉCUPÉRATION DES RÔLES (Adaptée à tes logs)
        // On check realm_roles (vu dans tes logs) OU realm_access.roles
        const realmRoles = profile.realm_roles || profile.realm_access?.roles || [];
        const clientRoles = profile.resource_access?.[clientId]?.roles || [];

        token.roles = [...new Set([...realmRoles, ...clientRoles])];

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = expiresAtMs;
        token.idToken = account.id_token;

        // ✅ SÉCURISATION USER (Évite le undefined / crash 502)
        token.user = {
          name:
            profile.name ??
            profile.preferred_username ??
            (profile as { given_name?: string }).given_name ??
            "Utilisateur SaFliix",
          email: profile.email ?? token.email ?? undefined,
        };

        return token;
      }

      // 🧠 GESTION EXPIRATION
      if (!token.accessTokenExpires) return token;

      // Token encore valide (marge de 30s)
      if (Date.now() < token.accessTokenExpires - 30_000) {
        return token;
      }

      // 🔄 REFRESH
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },

    async session({ session, token }) {
      // Transfert des données du JWT vers la Session
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.error = token.error;
      
      if (token.user) {
        session.user.name = token.user.name;
        session.user.email = token.user.email;
      }

      // On s'assure que roles est toujours un tableau
      session.user.roles = token.roles || [];

      return session;
    },
  },

  // Optionnel : tu peux ajouter une page de login personnalisée si besoin
  // pages: {
  //   signIn: '/auth/signin',
  // }
};

export default authConfig;