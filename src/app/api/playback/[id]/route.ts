import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/services/token.service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = await getToken({ req });
  if (!token?.sub) return NextResponse.json({ error: "session_expired" }, { status: 401 });

  let accessToken: string | null = null;
  try {
    accessToken = await TokenService.getValidToken(token.sub);
  } catch (err) {
    console.error("❌ TokenService error:", err);
    return NextResponse.json({ error: "Erreur session serveur" }, { status: 503 });
  }
  if (!accessToken) return NextResponse.json({ error: "session_expired" }, { status: 401 });

  const baseUrl = process.env.NEST_API_URL;
  if (!baseUrl) return NextResponse.json({ error: "Config serveur invalide" }, { status: 500 });

  const { id } = await params;
  const targetUrl = `${baseUrl.replace(/\/$/, "")}/admin/contents/${id}/playback${req.nextUrl.search}`;

  const headers = new Headers();
  headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(targetUrl, { headers });
  } catch (err) {
    console.error(`❌ Backend unreachable [GET ${targetUrl}]:`, err);
    return NextResponse.json({ error: "Backend inaccessible" }, { status: 503 });
  }

  const body = await response.json();
  const nextResponse = NextResponse.json(body, { status: response.status });

  // Forward CloudFront signed cookies to the browser
  for (const cookie of response.headers.getSetCookie()) {
    nextResponse.headers.append("set-cookie", cookie);
  }

  return nextResponse;
}
