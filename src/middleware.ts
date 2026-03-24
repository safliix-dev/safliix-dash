// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isSuperAdmin = (token?.roles as string[])?.includes("super_admin");
    
    // Si l'utilisateur essaie d'accéder à /admin mais n'est pas super_admin
    if (req.nextUrl.pathname.startsWith("/users") && !isSuperAdmin) {
      return NextResponse.rewrite(new URL("/unauthorized", req.url));
    }
  },
  {
    callbacks: {
      // Le middleware ne s'exécute que si l'utilisateur est authentifié
      authorized: ({ token }) => !!token,
    },
  }
);

// On définit sur quelles routes le middleware doit s'appliquer
export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*"],
};