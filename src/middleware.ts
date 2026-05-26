import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;

    if (token?.error) {
      const url = new URL("/api/auth/signout", req.url);
      url.searchParams.set("callbackUrl", "/");
      return NextResponse.redirect(url);
    }

    const pathname = req.nextUrl.pathname;

    console.log(`🛡️ Middleware - Path: ${pathname}, Roles: ${roles.join(", ")}`);

    // // /admins et /users : super_admin ou owner uniquement
    // const isPrivilegedPath = pathname.startsWith("/admins") || pathname.startsWith("/users");
    // if (isPrivilegedPath && !isSuperAdmin && !isOwner) {
    //   return NextResponse.rewrite(new URL("/unauthorized", req.url));
    // }

    // // /settings : admin, super_admin ou owner
    // if (pathname.startsWith("/settings") && !isAdmin && !isSuperAdmin && !isOwner) {
    //   return NextResponse.rewrite(new URL("/unauthorized", req.url));
    // }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        if (pathname.startsWith("/api/auth")) return true;

        const publicRoutes = ["/", "/unauthorized", "/debug", "/test"];
        if (publicRoutes.includes(pathname)) return true;

        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/admins/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/dashboard/:path*",
  ],
};