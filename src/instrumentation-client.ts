/**
 * Client-side instrumentation for the browser runtime.
 *
 * Runs after the HTML is loaded but before React hydration, which makes it
 * the right place to initialize Sentry so early errors are captured.
 *
 * Session Replay is deliberately NOT enabled (per project decision).
 */
import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    environment:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ??
      process.env.NEXT_PUBLIC_VERCEL_ENV ??
      process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,

    // Disable event ingestion on Vercel Preview deployments.
    // NEXT_PUBLIC_VERCEL_ENV is automatically inlined by Vercel at build.
    enabled: process.env.NEXT_PUBLIC_VERCEL_ENV !== "preview",

    // Route-based sampling on the client keeps performance traces cheap
    // while still catching user-visible slowness on auth + admin pages.
    tracesSampler: (ctx) => {
      if (typeof ctx.parentSampled === "boolean") return ctx.parentSampled;

      const attrs = ctx.attributes ?? {};
      const path =
        (attrs["url.path"] as string | undefined) ??
        (typeof window !== "undefined" ? window.location.pathname : "") ??
        "";

      if (process.env.NODE_ENV !== "production") return 1.0;

      if (
        path.startsWith("/admin") ||
        path.startsWith("/register") ||
        path.startsWith("/login")
      ) {
        return 0.25;
      }

      return 0.05;
    },

    // Session Replay intentionally disabled — re-enable here if/when needed.
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,

    sendDefaultPii: false,
    debug: false,

    // Filter out common browser-extension / network noise.
    ignoreErrors: [
      // Browser extensions
      "top.GLOBALS",
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications.",
      "Non-Error promise rejection captured",
      // NextAuth / App Router redirects caught by error boundaries
      "NEXT_REDIRECT",
      "NEXT_NOT_FOUND",
      // Network hiccups that aren't actionable
      "Failed to fetch",
      "Load failed",
      "NetworkError when attempting to fetch resource",
      "AbortError",
    ],

    denyUrls: [
      // Chrome/Safari extensions
      /extensions\//i,
      /^chrome:\/\//i,
      /^chrome-extension:\/\//i,
      /^safari-extension:\/\//i,
    ],
  });
}

/**
 * Next.js App Router client navigation hook — lets Sentry tie page
 * transitions to performance traces.
 */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
