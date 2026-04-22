import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { getMemberLeaderboardSnapshot } from "@/features/leaderboard/leaderboard.service";
import { requireApiAuth } from "@/lib/route-auth";

function normalizeLimit(rawValue: string | null) {
  if (!rawValue) {
    return 25;
  }

  const parsed = Number(rawValue);

  if (!Number.isInteger(parsed) || parsed < 1) {
    return 25;
  }

  return Math.min(parsed, 100);
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  const limit = normalizeLimit(request.nextUrl.searchParams.get("limit"));
  const snapshot = await getMemberLeaderboardSnapshot({
    limit,
    currentMemberId: auth.session.user.role === Role.MEMBER ? auth.session.user.id : undefined,
  });

  return NextResponse.json(snapshot);
}
