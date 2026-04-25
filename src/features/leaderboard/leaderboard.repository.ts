import { AccountStatus, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

// Used only by the leaderboard read path. The recompute uses a single SQL
// statement (see leaderboard.service.ts) so the previous tx-aware helpers
// (`listRankableMemberProfiles`, `applyMemberRankSnapshots`) were removed —
// they relied on the interactive `$transaction(async tx => …)` form that
// PgBouncer in transaction-pooling mode cannot service.
const rankingOrderBy: Prisma.MemberProfileOrderByWithRelationInput[] = [
  { overallRating: "desc" },
  { totalPoints: "desc" },
  { attendanceCount: "desc" },
  { updatedAt: "desc" },
  { userId: "asc" },
];

export async function countMembersMissingLeaderboardSnapshot() {
  return prisma.memberProfile.count({
    where: {
      userProfile: {
        user: {
          role: Role.MEMBER,
          status: AccountStatus.ACTIVE,
        },
      },
      OR: [{ currentRank: null }, { leaderboardUpdatedAt: null }],
    },
  });
}

export async function listPersistedLeaderboardRows(limit = 100) {
  return prisma.memberProfile.findMany({
    where: {
      userProfile: {
        user: {
          role: Role.MEMBER,
          status: AccountStatus.ACTIVE,
        },
      },
    },
    select: {
      userId: true,
      currentRank: true,
      previousRank: true,
      rankChange: true,
      overallRating: true,
      totalPoints: true,
      attendanceCount: true,
      leaderboardUpdatedAt: true,
      userProfile: {
        select: {
          displayName: true,
          fullName: true,
          city: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: [{ currentRank: "asc" }, ...rankingOrderBy],
    take: limit,
  });
}

export async function getPersistedMemberLeaderboardRow(memberId: string) {
  return prisma.memberProfile.findUnique({
    where: {
      userId: memberId,
    },
    select: {
      userId: true,
      currentRank: true,
      previousRank: true,
      rankChange: true,
      overallRating: true,
      totalPoints: true,
      attendanceCount: true,
      leaderboardUpdatedAt: true,
      userProfile: {
        select: {
          displayName: true,
          fullName: true,
          city: true,
          avatarUrl: true,
        },
      },
    },
  });
}
