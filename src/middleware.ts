// middleware.ts
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
};