/* // middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const roles = (token?.roles as string[]) || [];
    const isSuperAdmin = roles.includes("super_admin");

    // 🔒 Protection users (ex: admin ou super_admin)
    if (req.nextUrl.pathname.startsWith("/users") && !roles.includes("admin") && !isSuperAdmin) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // Pour le dashboard (/), plus besoin de rediriger car layout gère déjà la session
  },
  {
    callbacks: {
      // On ne bloque jamais l'accès au middleware, redirection gérée côté layout
      authorized: () => true,
    },
  }
);

export const config = {
  matcher: [
    "/users/:path*",
    // "/" n'a pas besoin d'être dans le matcher maintenant
  ],
}; */

// middleware.ts - Version temporaire qui laisse tout passer
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Log toutes les requêtes pour debug
  console.log("🔵 Middleware - Path:", request.nextUrl.pathname);
  
  // Laisse tout passer - PAS DE REDIRECTION
  return NextResponse.next();
}

// Ne matcher aucune route spécifique
export const config = {
  matcher: [], // Matcher vide = désactivé
};