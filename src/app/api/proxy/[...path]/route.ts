import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/services/token.service";

async function proxyHandler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  // ⭐ Attendre que params soit résolu
  const { path } = await params;
  
  const token = await getToken({ req });
  
  if (!token?.sub) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const accessToken = await TokenService.getValidToken(token.sub);
  
  if (!accessToken) {
    return NextResponse.json({ error: "Session invalide ou expirée" }, { status: 401 });
  }

  const targetUrl = `${process.env.NEST_API_URL}/${path.join("/")}${req.nextUrl.search}`;

  const headers = new Headers();
  req.headers.forEach((value, key) => {
    if (!["host", "connection", "content-length", "transfer-encoding"].includes(key.toLowerCase())) {
      headers.set(key, value);
    }
  });
  
  headers.set("Authorization", `Bearer ${accessToken}`);

  let body: BodyInit | null = null;
  if (!["GET", "HEAD"].includes(req.method)) {
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      body = await req.formData();
      headers.delete("content-length");
    } else {
      body = await req.text();
    }
  }

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
    });

    const responseHeaders = new Headers();
    response.headers.forEach((value, key) => {
      if (!["content-encoding", "transfer-encoding"].includes(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });

    const responseBody = await response.text();

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("❌ Proxy error:", error);
    return NextResponse.json(
      { error: "Erreur de connexion au backend" },
      { status: 502 }
    );
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;