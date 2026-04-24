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

    // The Edge runtime handles proxy.ts + edge routes — keep sampling light.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0,

    sendDefaultPii: false,
    debug: false,

    ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
  });
}
