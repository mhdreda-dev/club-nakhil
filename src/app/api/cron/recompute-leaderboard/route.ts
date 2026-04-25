import { NextRequest, NextResponse } from "next/server";

import { recomputeMemberLeaderboardRanks } from "@/features/leaderboard/leaderboard.service";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Cron-triggered global leaderboard recompute.
 *
 * Authentication:
 *   - Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}` automatically
 *     when a `crons` entry runs against this route. We verify that header.
 *   - Local / manual triggers can also pass `Authorization: Bearer ${CRON_SECRET}`.
 *
 * Behavior:
 *   - Calls `recomputeMemberLeaderboardRanks()`, which executes a single SQL
 *     UPDATE … FROM (CTE) statement. No interactive Prisma transaction, so it
 *     is safe through Supabase PgBouncer transaction-pooling on port 6543.
 *   - Always returns 200 with a structured payload — failures are reported in
 *     the body so a paused dashboard never sees a 5xx tied to this work.
 */
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await recomputeMemberLeaderboardRanks();

  return NextResponse.json(result, {
    status: result.status === "failed" ? 500 : 200,
  });
}

// Vercel Cron also issues GET requests in some configurations; accept both
// verbs so the same secret-protected endpoint covers cron + curl + admin
// "rerun" buttons without bespoke routing.
export async function GET(request: NextRequest) {
  return POST(request);
}

function isAuthorized(request: NextRequest) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    // Fail closed in production: refuse to run if no shared secret is set.
    // Surfacing this as 401 makes misconfiguration loud in Vercel logs rather
    // than silently allowing public recomputes.
    console.warn("[cron:recompute-leaderboard] CRON_SECRET is not configured");
    return false;
  }

  const header = request.headers.get("authorization");
  return header === `Bearer ${expected}`;
}
