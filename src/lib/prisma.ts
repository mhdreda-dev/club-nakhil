import { Prisma, PrismaClient } from "@prisma/client";

/**
 * Centralized Prisma client.
 *
 * The production DATABASE_URL points at Supabase PgBouncer in TRANSACTION
 * pooling mode (port 6543, `?pgbouncer=true`). That setup has two practical
 * consequences for the client:
 *
 *   1. Interactive transactions (`prisma.$transaction(async (tx) => …)`) are
 *      NOT supported. They surface as
 *      "Transaction API error: Unable to start a transaction in the given
 *      time." in Sentry. Every callable transaction in this codebase has been
 *      converted to either a single SQL statement, an array-form
 *      `$transaction([...])`, a Prisma nested write, or a sequence of
 *      independent statements with explicit reconciliation.
 *
 *   2. Long-running statements still consume a pool slot. We attach a `query`
 *      log listener that warns whenever a query exceeds SLOW_QUERY_MS so they
 *      surface in Vercel logs without flipping on full query logging.
 *
 * DIRECT_URL (port 5432) is reserved for `prisma migrate` and other
 * out-of-band tooling that requires a session-pinned connection. Application
 * code does not import a separate direct client.
 */

const SLOW_QUERY_MS = Number(process.env.PRISMA_SLOW_QUERY_MS ?? 750);

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Always emit warn / error / query as events. Listeners decide what to do
  // with them — the cost of an unhandled event is negligible.
  const client = new PrismaClient({
    log: [
      { level: "warn", emit: "event" },
      { level: "error", emit: "event" },
      { level: "query", emit: "event" },
    ],
  });

  client.$on("warn", (event) => {
    console.warn("[prisma:warn]", event.message);
  });

  client.$on("error", (event) => {
    // Adds breadcrumbs to Sentry via the global handler installed in
    // sentry.server.config.* — keep payload small and serializable.
    console.error("[prisma:error]", {
      target: event.target,
      message: event.message,
    });
  });

  // Slow-query warning is always on (cheap), but suppressed in tests.
  if (process.env.NODE_ENV !== "test") {
    client.$on("query", (event: Prisma.QueryEvent) => {
      if (event.duration >= SLOW_QUERY_MS) {
        console.warn("[prisma:slow-query]", {
          durationMs: event.duration,
          // Trim to avoid leaking PII into logs while still keeping enough
          // signal to recognise which call site fired.
          query: event.query.length > 240 ? `${event.query.slice(0, 240)}…` : event.query,
        });
      }
    });
  }

  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
