import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/services/token.service";

// TODO: retirer quand Redis est prêt
const BYPASS_AUTH = true;
const MOCK_TOKEN = "REMPLACER_PAR_UN_VRAI_TOKEN_KEYCLOAK";

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  let accessToken: string | null = null;

  if (BYPASS_AUTH) {
    accessToken = MOCK_TOKEN;
  } else {
    const token = await getToken({ req });

    if (!token?.sub) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    try {
      accessToken = await TokenService.getValidToken(token.sub);
    } catch (err) {
      console.error("❌ TokenService error:", err);
      return NextResponse.json({ error: "Erreur session serveur" }, { status: 503 });
    }

    if (!accessToken) {
      return NextResponse.json({ error: "Session invalide" }, { status: 401 });
    }
  }

  const baseUrl = process.env.NEST_API_URL;

  if (!baseUrl) {
    console.error("❌ NEST_API_URL manquant");
    return NextResponse.json({ error: "Config serveur invalide" }, { status: 500 });
  }

  const { path } = await params;
  const targetUrl =
    `${baseUrl.replace(/\/$/, "")}/${path.join("/")}${req.nextUrl.search}`;

  console.log(`🚀 ${req.method} -> ${targetUrl}`);

  const headers = new Headers();

  const allowedHeaders = ["content-type", "accept"];

  req.headers.forEach((value, key) => {
    if (allowedHeaders.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.set("Authorization", `Bearer ${accessToken}`);

  let response: Response;
  try {
    response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
    });
  } catch (err) {
    console.error(`❌ Backend unreachable [${req.method} ${targetUrl}]:`, err);
    return NextResponse.json({ error: "Backend inaccessible" }, { status: 503 });
  }

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  return NextResponse.json(body, {
    status: response.status,
  });
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;