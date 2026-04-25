/**
 * Sentry configuration for the Node.js (server) runtime.
 *
 * Loaded by `src/instrumentation.ts` when `process.env.NEXT_RUNTIME === "nodejs"`.
 * DO NOT import this file directly from application code.
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.SENTRY_DSN ?? process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT ?? process.env.VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.SENTRY_RELEASE ?? process.env.VERCEL_GIT_COMMIT_SHA,

    // Disable event ingestion on Vercel Preview deployments — keeps
    // quota for production and real staging, still captures runtime errors
    // locally (VERCEL_ENV unset) and in Production.
    enabled: process.env.VERCEL_ENV !== "preview",

    // Smart route-based sampling. Cheap routes (static, health, tunnel) are
    // dropped entirely; auth / admin / registration are sampled higher because
    // they're the paths that actually move money + members.
    tracesSampler: (ctx) => {
      // Honor upstream parent decisions so distributed traces stay coherent.
      if (typeof ctx.parentSampled === "boolean") return ctx.parentSampled;

      const attrs = ctx.attributes ?? {};
      const target =
        (attrs["http.target"] as string | undefined) ??
        (attrs["http.route"] as string | undefined) ??
        (attrs["url.path"] as string | undefined) ??
        ctx.name ??
        "";

      // Never trace the Sentry tunnel itself (infinite loop risk + noise).
      if (target.startsWith("/monitoring")) return 0;

      // Static chunks, images, favicons — no signal, huge volume.
      if (
        target.startsWith("/_next/") ||
        target.startsWith("/static/") ||
        target === "/favicon.ico" ||
        target === "/robots.txt"
      ) {
        return 0;
      }

      // Full fidelity in dev so we can see everything locally.
      if (process.env.NODE_ENV !== "production") return 1.0;

      // High-value routes: auth, admin actions, QR/registration flows.
      if (
        target.startsWith("/api/auth") ||
        target.startsWith("/api/admin") ||
        target.startsWith("/api/registration") ||
        target.startsWith("/api/attendance") ||
        target.startsWith("/api/payments")
      ) {
        return 0.3;
      }

      // Everything else: light background sampling.
      return 0.05;
    },

    // Server-side integrations — Prisma gives query spans + error code tagging,
    // httpIntegration keeps outgoing HTTP as breadcrumbs with URL + status.
    integrations: [
      Sentry.prismaIntegration(),
      Sentry.httpIntegration({ breadcrumbs: true }),
    ],

    // Only send PII when an explicit opt-in flag is set.
    sendDefaultPii: false,

    // Silence Sentry in the terminal during local dev unless explicitly enabled.
    debug: false,

    // Filter out noisy / expected errors before they leave the server.
    ignoreErrors: [
      // NextAuth benign redirects
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
      // Connection resets triggered by client cancel
      "ECONNRESET",
      "ERR_STREAM_PREMATURE_CLOSE",
    ],

    beforeSend(
      event: Sentry.ErrorEvent,
      hint: Sentry.EventHint,
    ): Sentry.ErrorEvent | null {
      const error = hint?.originalException;

      // Drop expected NextAuth/navigation control-flow errors.
      if (error instanceof Error) {
        if (error.message === "NEXT_REDIRECT" || error.message === "NEXT_NOT_FOUND") {
          return null;
        }
      }

      return event;
    },
  });
}
