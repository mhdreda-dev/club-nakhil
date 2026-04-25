import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import {
  getLeaderboardHealth,
  recomputeMemberLeaderboardRanks,
} from "@/features/leaderboard/leaderboard.service";
import { requireApiAuth } from "@/lib/route-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Admin-triggered leaderboard recompute.
 *
 * Same single-SQL implementation as the cron route — provided as a separate
 * route so admin tooling can rerun ranks on demand (e.g. after seeding new
 * members or fixing scoring bugs) without exposing the cron secret in the
 * browser.
 */
export async function POST() {
  const auth = await requireApiAuth(Role.ADMIN);
  if (auth.error) return auth.error;

  const result = await recomputeMemberLeaderboardRanks();

  return NextResponse.json(result, {
    status: result.status === "failed" ? 500 : 200,
  });
}

/**
 * Lightweight health probe for the admin UI:
 * how many active members are currently missing a rank snapshot?
 */
export async function GET() {
  const auth = await requireApiAuth(Role.ADMIN);
  if (auth.error) return auth.error;

  const health = await getLeaderboardHealth();
  return NextResponse.json(health);
}
