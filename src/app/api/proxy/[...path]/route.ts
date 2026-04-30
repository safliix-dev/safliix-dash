import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/services/token.service";
async function proxyHandler(req: NextRequest, { params }: { params: { path: string[] } }) {
  const token = await getToken({ req });

  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const accessToken = await TokenService.getValidToken(token.sub);

  if (!accessToken) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 });
  }

  const baseUrl = process.env.NEST_API_URL;

  if (!baseUrl) {
    console.error("❌ NEST_API_URL manquant");
    return NextResponse.json({ error: "Config serveur invalide" }, { status: 500 });
  }

  const targetUrl =
    `${baseUrl.replace(/\/$/, "")}/${params.path.join("/")}${req.nextUrl.search}`;

  console.log(`🚀 ${req.method} -> ${targetUrl}`);

  const headers = new Headers();

  // 🔒 whitelist headers uniquement
  const allowedHeaders = [
    "content-type",
    "accept"
  ];

  req.headers.forEach((value, key) => {
    if (allowedHeaders.includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });

  headers.set("Authorization", `Bearer ${accessToken}`);

  const response = await fetch(targetUrl, {
    method: req.method,
    headers,
    body: ["GET", "HEAD"].includes(req.method) ? undefined : await req.text(),
  });

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