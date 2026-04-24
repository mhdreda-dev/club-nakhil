/**
 * Sentry helpers tailored for Club Nakhil.
 *
 * These wrappers do two things:
 *   1. Attach the current user's id + role as Sentry context/tags so we can
 *      filter/triage errors by role (ADMIN / COACH / MEMBER).
 *   2. Give API route handlers a single place to capture + rethrow errors
 *      with consistent tags (route, method) and extra Prisma metadata.
 *
 * Everything is a no-op when Sentry isn't configured (missing DSN), so it's
 * safe to call from anywhere.
 */
import * as Sentry from "@sentry/nextjs";
import type { Session } from "next-auth";

import { getAuthSession } from "@/lib/auth";

type SessionUser = Session["user"] | undefined;

/**
 * Attach the currently authenticated user to the Sentry scope.
 * Safe to call from server components, route handlers, and server actions.
 *
 * We intentionally do NOT send email/name unless `sendDefaultPii` is enabled
 * in the Sentry config — only the opaque user id is sent by default.
 */
export function setSentryUser(user: SessionUser) {
  if (!user) {
    Sentry.setUser(null);
    return;
  }

  Sentry.setUser({
    id: user.id,
    // `role` is exposed as a first-class tag so it shows up in issue lists.
  });

  if (user.role) {
    Sentry.setTag("user.role", user.role);
  }
  if (user.status) {
    Sentry.setTag("user.status", user.status);
  }
}

/**
 * Convenience: pull the NextAuth session and set the Sentry user in one call.
 * Returns the session for further use.
 */
export async function setSentryUserFromAuth() {
  const session = await getAuthSession();
  setSentryUser(session?.user);
  return session;
}

/**
 * Capture an exception thrown inside a route handler with useful tags.
 * Re-throws so Next.js' default 500 handling still runs.
 *
 * Example:
 *   export async function POST(req: Request) {
 *     try {
 *       // ...work...
 *     } catch (err) {
 *       captureRouteError(err, { route: "/api/attendance", method: "POST" });
 *       throw err;
 *     }
 *   }
 */
export function captureRouteError(
  error: unknown,
  context: { route: string; method?: string; extra?: Record<string, unknown> } = {
    route: "unknown",
  },
) {
  Sentry.withScope((scope: Sentry.Scope) => {
    scope.setTag("route", context.route);
    if (context.method) {
      scope.setTag("http.method", context.method);
    }

    // Prisma's known error codes are very useful for triage.
    const maybePrismaCode = (error as { code?: string } | null)?.code;
    if (typeof maybePrismaCode === "string" && maybePrismaCode.startsWith("P")) {
      scope.setTag("prisma.code", maybePrismaCode);
    }

    if (context.extra) {
      scope.setExtras(context.extra);
    }

    Sentry.captureException(error);
  });
}

/**
 * Thin wrapper: run a server action / route handler and report any thrown
 * error to Sentry with route context. Useful when you don't want try/catch
 * boilerplate at every call site.
 */
export async function withSentryRoute<T>(
  context: { route: string; method?: string },
  handler: () => Promise<T>,
): Promise<T> {
  try {
    return await handler();
  } catch (error) {
    captureRouteError(error, context);
    throw error;
  }
}
