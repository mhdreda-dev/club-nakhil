import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  // Sentry uses `onRequestError` from instrumentation; nothing extra needed.
};

/**
 * Sentry wrapper — only active in production builds on Vercel where the
 * SENTRY_AUTH_TOKEN is set (so local `next dev` stays fast and source maps
 * are not uploaded from developer machines).
 */
export default withSentryConfig(nextConfig, {
  // Project scoping — read from env, never committed.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Keep CI logs clean unless we're actively debugging the plugin.
  silent: !process.env.CI,

  // Upload browser source maps AND widen to capture vendor chunks for
  // better stack traces; files are deleted from the build output afterwards
  // so they're never served publicly.
  widenClientFileUpload: true,
  sourcemaps: {
    deleteSourcemapsAfterUpload: true,
  },

  // Tunnel Sentry events through a Next.js route to bypass ad-blockers.
  // Keep this path generic so it isn't an obvious Sentry endpoint.
  tunnelRoute: "/monitoring",

  // Tree-shake Sentry logger statements out of the client bundle in prod.
  disableLogger: true,

  // Automatic instrumentation of Vercel Cron Monitors.
  automaticVercelMonitors: true,

  // NOTE: the Sentry plugin automatically skips source-map upload and
  // release creation when SENTRY_AUTH_TOKEN is missing (it logs a warning
  // and moves on). So local builds and previews-without-secret stay fast
  // without any extra config — runtime error capture still works.
});
