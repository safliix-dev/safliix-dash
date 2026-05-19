import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/lib/auth/config";
import { SessionService } from "@/services/session.service";

export async function GET() {
  const session = await getServerSession(authConfig);
  const userId = session?.user?.id;

  const issuer = process.env.KEYCLOAK_ISSUER!;
  const clientId = process.env.KEYCLOAK_CLIENT_ID!;
  const postLogoutUri = encodeURIComponent(process.env.NEXTAUTH_URL!);

  let idToken: string | undefined;

  if (userId) {
    const tokens = await SessionService.getTokens(userId);
    idToken = tokens?.idToken;
    await SessionService.deleteSession(userId);
  }

  let kcLogoutUrl =
    `${issuer}/protocol/openid-connect/logout` +
    `?post_logout_redirect_uri=${postLogoutUri}` +
    `&client_id=${clientId}`;

  if (idToken) {
    kcLogoutUrl += `&id_token_hint=${idToken}`;
  }

  const response = NextResponse.redirect(kcLogoutUrl);

  // Clear NextAuth session cookies (dev + prod cookie names)
  const expires = "Expires=Thu, 01 Jan 1970 00:00:00 GMT";
  response.headers.append("Set-Cookie", `next-auth.session-token=; Path=/; ${expires}; HttpOnly; SameSite=Lax`);
  response.headers.append("Set-Cookie", `__Secure-next-auth.session-token=; Path=/; ${expires}; HttpOnly; SameSite=Lax; Secure`);

  return response;
}
