/**
 * Logout complet : detruit la session NextAuth + la session Keycloak (SSO).
 * Voir SPEC-007 — Securite : un logout partiel (NextAuth seul) laisse
 * la session KC active, permettant une reconnexion sans mot de passe.
 */
import { signOut } from "next-auth/react";

export async function keycloakLogout(idToken?: string) {
  const issuer = process.env.KEYCLOAK_ISSUER || process.env.NEXT_PUBLIC_KEYCLOAK_URL
    ? `${process.env.NEXT_PUBLIC_KEYCLOAK_URL}/realms/${process.env.NEXT_PUBLIC_KEYCLOAK_REALM}`
    : "";
  const clientId = process.env.KEYCLOAK_CLIENT_ID || process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID || "";
  const postLogoutUri = encodeURIComponent(process.env.NEXTAUTH_URL || window.location.origin);

  // 1. Detruire la session NextAuth (cookie local)
  await signOut({ redirect: false });

  // 2. Construire l'URL de logout KC (RP-Initiated Logout — OIDC standard)
  let kcLogoutUrl = `${issuer}/protocol/openid-connect/logout`
    + `?post_logout_redirect_uri=${postLogoutUri}`
    + `&client_id=${clientId}`;

  // id_token_hint evite la page de confirmation KC
  if (idToken) {
    kcLogoutUrl += `&id_token_hint=${idToken}`;
  }

  // 3. Rediriger vers KC pour tuer la session SSO
  window.location.href = kcLogoutUrl;
}
