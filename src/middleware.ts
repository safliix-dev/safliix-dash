// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const roles = (token?.roles as string[]) || [];
    const isSuperAdmin = roles.includes("super_admin");
    const isAdmin = roles.includes("admin");
    const pathname = req.nextUrl.pathname;

    console.log(`🛡️ Middleware - Path: ${pathname}, Roles: ${roles.join(", ")}`);

    // 🔒 Protection route /users (admin ou super_admin uniquement)
    if (pathname.startsWith("/users") && !isAdmin && !isSuperAdmin) {
      console.log(`⛔ Accès refusé à ${pathname} - Rôles insuffisants`);
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // 🔒 Protection route /admin (super_admin uniquement)
    if (pathname.startsWith("/admin") && !isSuperAdmin) {
      console.log(`⛔ Accès refusé à ${pathname} - Super Admin requis`);
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // 🔒 Protection route /settings (admin ou super_admin uniquement - optionnel)
    if (pathname.startsWith("/settings") && !isAdmin && !isSuperAdmin) {
      console.log(`⛔ Accès refusé à ${pathname} - Admin requis`);
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }

    // ✅ Tout est ok, on laisse passer
    return NextResponse.next();
  },
  {
    callbacks: {
      // On autorise l'accès au middleware même sans token
      // La vérification se fait dans la fonction middleware ci-dessus
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        
        // Routes publiques toujours autorisées
        const publicRoutes = ["/", "/debug", "/test", "/auth/error"];
        if (publicRoutes.some(route => pathname.startsWith(route))) {
          return true;
        }
        
        // Pour les routes protégées, on vérifie le token
        const isProtectedRoute = 
          pathname.startsWith("/users") || 
          pathname.startsWith("/admin") || 
          pathname.startsWith("/settings");
        
        if (isProtectedRoute) {
          return !!token;
        }
        
        return true;
      },
    },
  }
);

// Configuration des routes à intercepter
export const config = {
  matcher: [
    // Routes protégées
    "/users/:path*",
    "/admin/:path*",
    "/settings/:path*",
    
    // Exclure les routes suivantes
    "/((?!_next/static|_next/image|favicon.ico|api/auth|debug|test).*)",
  ],
};