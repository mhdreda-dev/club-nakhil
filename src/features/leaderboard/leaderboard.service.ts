import { prisma } from "@/lib/prisma";
import {
  applyMemberRankSnapshots,
  countMembersMissingLeaderboardSnapshot,
  getPersistedMemberLeaderboardRow,
  listPersistedLeaderboardRows,
  listRankableMemberProfiles,
} from "@/features/leaderboard/leaderboard.repository";

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

function getRankTrend(rankChange: number): LeaderboardTrend {
  if (rankChange > 0) {
    return "up";
  }

  if (rankChange < 0) {
    return "down";
  }

  return "same";
}

function toLeaderboardEntry(row: Awaited<ReturnType<typeof listPersistedLeaderboardRows>>[number]): LeaderboardEntry {
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

export async function recomputeMemberLeaderboardRanks() {
  return prisma.$transaction(async (tx) => {
    const rankableMembers = await listRankableMemberProfiles(tx);
    const leaderboardUpdatedAt = new Date();

    const snapshots = rankableMembers.map((member, index) => {
      const currentRank = index + 1;
      const previousRank = member.currentRank ?? currentRank;
      const rankChange = previousRank - currentRank;

      return {
        userId: member.userId,
        currentRank,
        previousRank,
        rankChange,
      };
    });

    await applyMemberRankSnapshots(tx, snapshots, leaderboardUpdatedAt);

    return {
      updatedMembers: snapshots.length,
      leaderboardUpdatedAt: leaderboardUpdatedAt.toISOString(),
    };
  });
}

async function ensureLeaderboardSnapshot() {
  const missingSnapshotCount = await countMembersMissingLeaderboardSnapshot();

  if (missingSnapshotCount > 0) {
    await recomputeMemberLeaderboardRanks();
  }
}

export async function getMemberLeaderboardSnapshot(options?: {
  limit?: number;
  currentMemberId?: string;
}) {
  await ensureLeaderboardSnapshot();

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
  } satisfies LeaderboardSnapshot;
}
