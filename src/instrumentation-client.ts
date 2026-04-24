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

    // Low default sampling to keep the site fast and stay inside the free tier.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

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
