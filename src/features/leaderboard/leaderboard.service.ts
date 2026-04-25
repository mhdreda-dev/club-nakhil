import { Prisma } from "@prisma/client";

import {
  countMembersMissingLeaderboardSnapshot,
  getPersistedMemberLeaderboardRow,
  listPersistedLeaderboardRows,
} from "@/features/leaderboard/leaderboard.repository";
import { prisma } from "@/lib/prisma";

export type LeaderboardTrend = "up" | "down" | "same";

export type LeaderboardEntry = {
  memberId: string;
  name: string;
  avatarUrl: string | null;
  city: string | null;
  overallRating: number;
  totalPoints: number;
  attendanceCount: number;
  currentRank: number | null;
  previousRank: number | null;
  rankChange: number;
  trend: LeaderboardTrend;
};

export type LeaderboardSnapshot = {
  leaderboard: LeaderboardEntry[];
  topThree: LeaderboardEntry[];
  currentMember: LeaderboardEntry | null;
  leaderboardUpdatedAt: string | null;
};

export type LeaderboardRecomputeResult = {
  status: "ok" | "skipped" | "failed";
  updatedMembers: number;
  durationMs: number;
  leaderboardUpdatedAt: string | null;
  error?: string;
};

function getRankTrend(rankChange: number): LeaderboardTrend {
  if (rankChange > 0) return "up";
  if (rankChange < 0) return "down";
  return "same";
}

function toLeaderboardEntry(
  row: Awaited<ReturnType<typeof listPersistedLeaderboardRows>>[number],
): LeaderboardEntry {
  return {
    memberId: row.userId,
    name: row.userProfile.displayName || row.userProfile.fullName,
    avatarUrl: row.userProfile.avatarUrl,
    city: row.userProfile.city,
    overallRating: Math.round(row.overallRating),
    totalPoints: row.totalPoints,
    attendanceCount: row.attendanceCount,
    currentRank: row.currentRank,
    previousRank: row.previousRank,
    rankChange: row.rankChange,
    trend: getRankTrend(row.rankChange),
  };
}

/**
 * Recompute every active member's rank in a single atomic SQL statement.
 *
 * Why a single statement instead of `prisma.$transaction(async tx => …)`:
 *
 *   The production database is fronted by Supabase PgBouncer in transaction
 *   pooling mode (port 6543, `?pgbouncer=true`). PgBouncer in transaction
 *   mode does NOT support Prisma's interactive transactions — the engine
 *   waits for a session-scoped connection it cannot get and eventually
 *   fails with:
 *
 *     "Transaction API error: Unable to start a transaction in the given time."
 *
 *   That is exactly the Sentry signature that prompted this fix. A single
 *   `UPDATE … FROM (CTE)` is one statement, atomic at the engine level
 *   (Postgres holds row-level locks for the duration of the statement),
 *   and runs cleanly through PgBouncer.
 *
 * Operational notes:
 *   - The function is safe to call concurrently. The worst case is two
 *     overlapping recomputes wasting work — never inconsistent ranks.
 *   - It must NEVER be invoked during a page render. Callers are limited
 *     to: the cron route, the admin route, and ad-hoc maintenance scripts.
 *   - All errors are caught and returned as a structured result so the
 *     caller can surface them without crashing the request.
 */
export async function recomputeMemberLeaderboardRanks(): Promise<LeaderboardRecomputeResult> {
  const startedAt = Date.now();
  const updatedAt = new Date();

  try {
    const rowsAffected = await prisma.$executeRaw(Prisma.sql`
      WITH ranked AS (
        SELECT mp."userId" AS user_id,
               ROW_NUMBER() OVER (
                 ORDER BY mp."overallRating" DESC,
                          mp."totalPoints" DESC,
                          mp."attendanceCount" DESC,
                          mp."updatedAt" DESC,
                          mp."userId" ASC
               ) AS new_rank
        FROM "MemberProfile" mp
        INNER JOIN "UserProfile" up ON up."userId" = mp."userId"
        INNER JOIN "User" u ON u."id" = up."userId"
        WHERE u."role" = 'MEMBER'::"Role"
          AND u."status" = 'ACTIVE'::"AccountStatus"
      )
      UPDATE "MemberProfile" mp
      SET
        "previousRank" = COALESCE(mp."currentRank", ranked.new_rank::int),
        "rankChange" = COALESCE(mp."currentRank", ranked.new_rank::int) - ranked.new_rank::int,
        "currentRank" = ranked.new_rank::int,
        "leaderboardUpdatedAt" = ${updatedAt}
      FROM ranked
      WHERE mp."userId" = ranked.user_id
    `);

    const durationMs = Date.now() - startedAt;

    if (durationMs > 1500) {
      console.warn("[leaderboard] slow recompute", {
        durationMs,
        rowsAffected,
      });
    } else {
      console.info("[leaderboard] recompute ok", {
        durationMs,
        rowsAffected,
      });
    }

    return {
      status: "ok",
      updatedMembers: typeof rowsAffected === "number" ? rowsAffected : 0,
      durationMs,
      leaderboardUpdatedAt: updatedAt.toISOString(),
    };
  } catch (error) {
    const durationMs = Date.now() - startedAt;
    const message = error instanceof Error ? error.message : String(error);

    console.error("[leaderboard] recompute failed", {
      durationMs,
      error: message,
      code: error instanceof Prisma.PrismaClientKnownRequestError ? error.code : undefined,
    });

    return {
      status: "failed",
      updatedMembers: 0,
      durationMs,
      leaderboardUpdatedAt: null,
      error: message,
    };
  }
}

/**
 * Health probe — reports how many active members are missing a rank snapshot.
 * Useful from the cron route and admin tooling. Never triggers a recompute.
 */
export async function getLeaderboardHealth() {
  const missingSnapshotCount = await countMembersMissingLeaderboardSnapshot();
  return { missingSnapshotCount };
}

export async function getMemberLeaderboardSnapshot(options?: {
  limit?: number;
  currentMemberId?: string;
}): Promise<LeaderboardSnapshot> {
  // Note: previously this awaited `ensureLeaderboardSnapshot()`, which would
  // synchronously run a full recompute (and its broken interactive transaction)
  // if any active member was missing a rank. The cron job is now the source of
  // truth; pages just read whatever has been persisted. New members appear
  // after the next cron tick (default ≤ 5 minutes).
  const limit = options?.limit ?? 25;
  const rows = await listPersistedLeaderboardRows(limit);
  const leaderboard = rows.map(toLeaderboardEntry);
  const topThree = leaderboard.slice(0, 3);

  let currentMember: LeaderboardEntry | null = null;

  if (options?.currentMemberId) {
    const currentMemberRow = await getPersistedMemberLeaderboardRow(options.currentMemberId);

    if (currentMemberRow?.currentRank) {
      currentMember = {
        memberId: currentMemberRow.userId,
        name: currentMemberRow.userProfile.displayName || currentMemberRow.userProfile.fullName,
        avatarUrl: currentMemberRow.userProfile.avatarUrl,
        city: currentMemberRow.userProfile.city,
        overallRating: Math.round(currentMemberRow.overallRating),
        totalPoints: currentMemberRow.totalPoints,
        attendanceCount: currentMemberRow.attendanceCount,
        currentRank: currentMemberRow.currentRank,
        previousRank: currentMemberRow.previousRank,
        rankChange: currentMemberRow.rankChange,
        trend: getRankTrend(currentMemberRow.rankChange),
      };
    }
  }

  return {
    leaderboard,
    topThree,
    currentMember,
    leaderboardUpdatedAt: rows[0]?.leaderboardUpdatedAt?.toISOString() ?? null,
  };
}
