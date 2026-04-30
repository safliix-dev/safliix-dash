import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { TokenService } from "@/services/token.service";

async function proxyHandler(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const token = await getToken({ req });

  if (!token?.sub) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const accessToken = await TokenService.getValidToken(token.sub);
  if (!accessToken) return NextResponse.json({ error: "Session invalide" }, { status: 401 });

  const targetUrl = `${process.env.NEST_API_URL}/${path.join("/")}${req.nextUrl.search}`;

  // --- LOGS DE DÉBUT ---
  console.log(`\n🚀 [PROXY START] ${req.method} ${req.nextUrl.pathname}`);
  console.log(`🔗 Target: ${targetUrl}`);

  const headers = new Headers();
  req.headers.forEach((v, k) => {
    if (!["host", "connection", "content-length"].includes(k.toLowerCase())) headers.set(k, v);
  });
  headers.set("Authorization", `Bearer ${accessToken}`);

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: ["GET", "HEAD"].includes(req.method) ? null : await req.text(),
      // 🚩 BLOQUE LES REDIRECTIONS AUTOMATIQUES
      redirect: 'manual', 
    });

    // --- LOGS DE RÉPONSE ---
    console.log(`📡 [BACKEND RESPONSE] Status: ${response.status}`);

    // Si c'est une redirection (301, 302, 307, 308)
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      console.error(`🚨 REDIRECTION DÉTECTÉE ! Le backend veut aller ici : ${location}`);
      
      return NextResponse.json({
        error: "Le backend a tenté une redirection interdite",
        interceptedUrl: location
      }, { status: 502 });
    }

    const responseBody = await response.text();
    
    // Log en cas d'erreur backend pour voir le message réel
    if (!response.ok) {
      console.error(`❌ [BACKEND ERROR] Body: ${responseBody.substring(0, 200)}`);
    }

    const responseHeaders = new Headers();
    response.headers.forEach((v, k) => {
      if (!["content-encoding", "transfer-encoding"].includes(k.toLowerCase())) {
        responseHeaders.set(k, v);
      }
    });

    return new NextResponse(responseBody, {
      status: response.status,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error("🔥 [PROXY CRITICAL ERROR]:", error);
    return NextResponse.json({ error: "Connexion backend échouée" }, { status: 502 });
  }
}

export const GET = proxyHandler;
export const POST = proxyHandler;
export const PUT = proxyHandler;
export const DELETE = proxyHandler;
export const PATCH = proxyHandler;