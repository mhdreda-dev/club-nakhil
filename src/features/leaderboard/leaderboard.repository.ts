import { AccountStatus, Prisma, Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";

const rankingOrderBy: Prisma.MemberProfileOrderByWithRelationInput[] = [
  { overallRating: "desc" },
  { totalPoints: "desc" },
  { attendanceCount: "desc" },
  { updatedAt: "desc" },
  { userId: "asc" },
];

export type MemberRankSnapshot = {
  userId: string;
  currentRank: number;
  previousRank: number | null;
  rankChange: number;
};

export async function listRankableMemberProfiles(tx: Prisma.TransactionClient) {
  return tx.memberProfile.findMany({
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
      overallRating: true,
      totalPoints: true,
      attendanceCount: true,
      updatedAt: true,
    },
    orderBy: rankingOrderBy,
  });
}

export async function applyMemberRankSnapshots(
  tx: Prisma.TransactionClient,
  snapshots: MemberRankSnapshot[],
  leaderboardUpdatedAt: Date,
) {
  await Promise.all(
    snapshots.map((snapshot) =>
      tx.memberProfile.update({
        where: {
          userId: snapshot.userId,
        },
        data: {
          currentRank: snapshot.currentRank,
          previousRank: snapshot.previousRank,
          rankChange: snapshot.rankChange,
          leaderboardUpdatedAt,
        },
      }),
    ),
  );
}

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
