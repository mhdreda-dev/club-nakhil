/**
 * Next.js server instrumentation entrypoint.
 *
 * Called once per process start. We conditionally load the Sentry config for
 * the current runtime so that each bundle only pulls in what it needs.
 *
 * Docs: node_modules/next/dist/docs/01-app/02-guides/instrumentation.md
 */
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("../sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("../sentry.edge.config");
  }
}

/**
 * Next.js 15+ / App Router hook: catches unhandled errors thrown inside
 * server components, server actions, route handlers, and middleware/proxy.
 * Sentry ships a helper that wires all the needed context automatically.
 */
export const onRequestError = Sentry.captureRequestError;
