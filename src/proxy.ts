import { NextResponse } from "next/server";
import { withAuth } from "next-auth/middleware";

import { isLocale, localeCookieName } from "@/lib/i18n";

export default withAuth(
  function proxy(req) {
    const pathname = req.nextUrl.pathname;
    const [maybeLocale] = pathname.split("/").filter(Boolean);
    const requestHeaders = new Headers(req.headers);

    if (maybeLocale && isLocale(maybeLocale)) {
      requestHeaders.set("x-cn-locale", maybeLocale);

      const response = NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });

      response.cookies.set(localeCookieName, maybeLocale, {
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
        sameSite: "lax",
      });

      return response;
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/login",
    },
    callbacks: {
      authorized: ({ req, token }) => {
        const pathname = req.nextUrl.pathname;
        const isProtectedRoute =
          pathname.startsWith("/admin") ||
          pathname.startsWith("/coach") ||
          pathname.startsWith("/member") ||
          pathname === "/dashboard";

        if (!isProtectedRoute) {
          return true;
        }

        if (!token || token.status !== "ACTIVE") {
          return false;
        }

        if (pathname.startsWith("/admin")) {
          return token.role === "ADMIN";
        }

        if (pathname.startsWith("/coach")) {
          return token.role === "COACH";
        }

        if (pathname.startsWith("/member")) {
          return token.role === "MEMBER";
        }

        return true;
      },
    },
  },
);

export const config = {
  matcher: ["/admin/:path*", "/coach/:path*", "/member/:path*", "/dashboard", "/:locale(en|fr|ar)", "/:locale(en|fr|ar)/:path*"],
};
