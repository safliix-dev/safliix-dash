import KeycloakProvider from "next-auth/providers/keycloak";
import { type NextAuthConfig } from "next-auth";

const issuer = process.env.KEYCLOAK_ISSUER;
const clientId = process.env.KEYCLOAK_CLIENT_ID;
const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

if (!issuer || !clientId || !clientSecret) {
  console.warn("[auth] KEYCLOAK_ISSUER/CLIENT_ID/CLIENT_SECRET manquants. Configure .env.local.");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function refreshAccessToken(token: any) {
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
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Erreur de refresh token", error);
    return { ...token, error: "RefreshAccessTokenError" as const };
  }
}

const authConfig: NextAuthConfig = {
  providers: [
    KeycloakProvider({
      clientId: clientId || "",
      clientSecret: clientSecret || "",
      issuer,
      authorization: { params: { scope: "openid profile email offline_access" } },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      // Initial sign-in
      if (account) {
        const expiresAtMs =
          account.expires_at
            ? account.expires_at * 1000
            : account.expires_in
              ? Date.now() + account.expires_in * 1000
              : undefined;
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = expiresAtMs;
        token.idToken = account.id_token;
        token.user = {
          name: profile?.name || profile?.preferred_username || token.name,
          email: profile?.email || token.email,
        };
      }

      // If the token is still valid, return it
      if (token.accessToken && token.accessTokenExpires && Date.now() < token.accessTokenExpires - 30_000) {
        return token;
      }

      // Refresh it
      if (token.refreshToken) {
        return refreshAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.idToken = token.idToken as string | undefined;
      session.error = token.error as string | undefined;
      session.user = {
        ...session.user,
        name: (token.user as { name?: string })?.name ?? session.user?.name ?? "",
        email: (token.user as { email?: string })?.email ?? session.user?.email ?? "",
      };
      return session;
    },
  },
  pages: {
    signIn: "/auth/login",
  },
};

export default authConfig;
