import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/services/token.service";

async function proxyHandler(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const token = await getToken({ req });

  if (!token?.sub) {
    return NextResponse.json({ error: "session_expired" }, { status: 401 });
  }

  let accessToken: string | null = null;

  try {
    accessToken = await TokenService.getValidToken(token.sub);
  } catch (err) {
    console.error("❌ TokenService error:", err);
    return NextResponse.json({ error: "Erreur session serveur" }, { status: 503 });
  }

  if (!accessToken) {
    return NextResponse.json({ error: "session_expired" }, { status: 401 });
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