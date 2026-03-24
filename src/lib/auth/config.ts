import { DefaultSession } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";
import { NextAuthOptions } from "next-auth";
import { JWT } from "next-auth/jwt";


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
    // Tu peux ajouter d'autres champs Keycloak ici si besoin (ex: roles, groups)
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    idToken?: string;
    error?: string;
    user?: {
      name?: string;
      email?: string;
    };
  }
}




const issuer = process.env.KEYCLOAK_ISSUER;
const clientId = process.env.KEYCLOAK_CLIENT_ID;
const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const tokenEndpoint = `${issuer}/protocol/openid-connect/token`;
    const form = new URLSearchParams();
    form.set("client_id", clientId || "");
    form.set("client_secret", clientSecret || "");
    form.set("grant_type", "refresh_token");
    form.set("refresh_token", token.refreshToken as string);

    const response = await fetch(tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });

    if (!response.ok) throw new Error(`Refresh failed: ${response.status}`);
    const refreshedTokens = await response.json();

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      // On convertit expires_in (secondes) en timestamp (ms)
      accessTokenExpires: Date.now() + (refreshedTokens.expires_in as number) * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Erreur de refresh token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

const authConfig: NextAuthOptions = {
  providers: [
    KeycloakProvider({
      clientId: clientId || "",
      clientSecret: clientSecret || "",
      issuer: issuer || "",
      authorization: { params: { scope: "openid profile email offline_access" } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Connexion initiale : on stocke les tokens dans le JWT
      if (account && profile) {
        const expiresAtMs = account.expires_at 
          ? account.expires_at * 1000 
          : undefined;

        token.roles = profile.realm_access?.roles || [];

        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = expiresAtMs;
        token.idToken = account.id_token;
        token.user = {
          name: profile.name ?? profile.preferred_username ?? token.name ?? undefined,
          email: profile.email ?? token.email ?? undefined,
        };
        return token;
      }

      // Si le token est encore valide (avec une marge de 30s)
      if (token.accessTokenExpires && Date.now() < token.accessTokenExpires - 30_000) {
        return token;
      }

      // Sinon, on rafraîchit
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },

   async session({ session, token }) {
  // 1. Transférer les tokens techniques
    session.accessToken = token.accessToken;
    session.idToken = token.idToken;
    session.error = token.error;
    
    // 2. Transférer les rôles du JWT vers la Session
    // C'est cette ligne qui permet au middleware et à useSession() de voir les rôles
    session.user.roles = token.roles as string[] || [];

    // 3. Transférer les infos utilisateur
    if (token.user) {
      session.user.name = token.user.name;
      session.user.email = token.user.email;
    }
    
    return session;
  },
  },
  pages: {
    signIn: "/auth/login",
  },
};

export default authConfig;