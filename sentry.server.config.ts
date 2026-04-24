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

    // Keep performance overhead minimal: 10% in production, 100% locally.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,

    // Record console.error / console.warn as breadcrumbs, but do not spam.
    integrations: [],

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
