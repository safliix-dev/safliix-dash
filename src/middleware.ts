import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    // On sécurise l'accès aux rôles avec un fallback vide
    const roles = (token?.roles as string[]) || [];
    const isSuperAdmin = roles.includes("super_admin");
    const isAdmin = roles.includes("admin");
    const pathname = req.nextUrl.pathname;

    console.log(`🛡️ Middleware - Path: ${pathname}, Roles: ${roles.join(", ")}`);

    // 1. Protection /admin (Super Admin uniquement)
    if (pathname.startsWith("/admin") && !isSuperAdmin) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    
    const isRestrictedPath = pathname.startsWith("/users") || pathname.startsWith("/settings");
    if (isRestrictedPath && !isAdmin && !isSuperAdmin) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // ✅ IMPORTANT : Laisser passer TOUTES les routes d'API Auth
        if (pathname.startsWith("/api/auth")) return true;

        // ✅ Autoriser les routes publiques
        const publicRoutes = ["/", "/unauthorized", "/debug", "/test"];
        if (publicRoutes.includes(pathname)) return true;

        // 🔒 Pour tout le reste (ce qui est dans le matcher), il faut un token
        return !!token;
      },
    },
  }
);

export const config = {
  /*
   * Matcher optimisé : 
   * 1. On cible les dossiers sensibles
   * 2. On exclut les fichiers statiques et les routes d'API
   */
  matcher: [
    "/admin/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/dashboard/:path*", // Ajoute ton dossier principal si besoin
  ],
};