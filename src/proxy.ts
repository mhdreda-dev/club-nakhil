import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized: ({ req, token }) => {
      const pathname = req.nextUrl.pathname;

      if (!token) {
        return false;
      }

      if (token.status !== "ACTIVE") {
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
});

export const config = {
  matcher: ["/admin/:path*", "/coach/:path*", "/member/:path*", "/dashboard"],
};
