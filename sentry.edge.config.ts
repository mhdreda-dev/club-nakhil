/**
 * Sentry configuration for the Edge runtime (proxy.ts / edge API routes).
 *
 * Loaded by `src/instrumentation.ts` when `process.env.NEXT_RUNTIME === "edge"`.
 * Keep this file small — the Edge runtime bundle is size-sensitive.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,

    // Disable ingestion on Vercel Preview deployments.
    enabled: process.env.VERCEL_ENV !== "preview",

    // Edge runs proxy.ts on every request; route-based sampling keeps the
    // volume manageable while still capturing auth/admin hot paths.
    tracesSampler: (ctx) => {
      if (typeof ctx.parentSampled === "boolean") return ctx.parentSampled;

      const attrs = ctx.attributes ?? {};
      const target =
        (attrs["http.target"] as string | undefined) ??
        (attrs["http.route"] as string | undefined) ??
        (attrs["url.path"] as string | undefined) ??
        ctx.name ??
        "";

      if (target.startsWith("/monitoring")) return 0;
      if (
        target.startsWith("/_next/") ||
        target.startsWith("/static/") ||
        target === "/favicon.ico" ||
        target === "/robots.txt"
      ) {
        return 0;
      }

      if (process.env.NODE_ENV !== "production") return 1.0;

      if (target.startsWith("/api/auth") || target.startsWith("/api/admin")) {
        return 0.2;
      }

      return 0.02;
    },

    sendDefaultPii: false,
    debug: false,

    ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
  });
}
