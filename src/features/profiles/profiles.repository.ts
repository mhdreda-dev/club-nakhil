import { AccountStatus, Prisma, Role, TrainingLevel } from "@prisma/client";
import { subDays } from "date-fns";

import { createMemberProfileCreateData } from "@/features/profiles/member-profile";
import { prisma } from "@/lib/prisma";
import type { NormalizedProfileUpdate } from "@/features/profiles/profiles.schemas";

const profileInclude = {
  profile: {
    include: {
      coachProfile: true,
      memberProfile: true,
    },
  },
} as const;

export type UserWithProfile = Prisma.UserGetPayload<{
  include: typeof profileInclude;
}>;

export async function findUserWithProfile(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: profileInclude,
  });
}

export async function createDefaultProfileForUser(user: {
  id: string;
  role: Role;
  name: string;
  createdAt: Date;
  sportLevel?: TrainingLevel | null;
}) {
  const profile = await prisma.userProfile.create({
    data: {
      userId: user.id,
      fullName: user.name,
      displayName: user.name,
      joinedAt: user.createdAt,
    },
  });

  if (user.role === Role.COACH) {
    await prisma.coachProfile.create({
      data: {
        userId: profile.userId,
      },
    });
  }

  if (user.role === Role.MEMBER) {
    await prisma.memberProfile.create({
      data: {
        userId: profile.userId,
        ...createMemberProfileCreateData(user.sportLevel ?? TrainingLevel.BEGINNER),
      },
    });
  }

  return profile;
}

export async function ensureCoachProfileRecord(userId: string) {
  return prisma.coachProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
    },
  });
}

export async function ensureMemberProfileRecord(
  userId: string,
  trainingLevel?: TrainingLevel,
) {
  return prisma.memberProfile.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      ...createMemberProfileCreateData(trainingLevel ?? TrainingLevel.BEGINNER),
    },
  });
}

export async function updateUserProfileBase(userId: string, input: NormalizedProfileUpdate) {
  return prisma.userProfile.update({
    where: { userId },
    data: {
      fullName: input.fullName,
      displayName: input.displayName,
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      city: input.city,
      address: input.address,
      bio: input.bio,
      emergencyContact: input.emergencyContact,
      avatarUrl: input.avatarUrl,
      avatarPath: input.avatarPath,
    },
  });
}

export async function getUserProfileAvatar(userId: string) {
  return prisma.userProfile.findUnique({
    where: { userId },
    select: {
      avatarUrl: true,
      avatarPath: true,
    },
  });
}

export async function updateUserProfileAvatar(
  userId: string,
  input: {
    avatarUrl: string | null;
    avatarPath: string | null;
  },
) {
  const [, updatedProfile] = await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        profileImage: input.avatarUrl,
      },
    }),
    prisma.userProfile.update({
      where: { userId },
      data: {
        avatarUrl: input.avatarUrl,
        avatarPath: input.avatarPath,
      },
      select: {
        avatarUrl: true,
        avatarPath: true,
      },
    }),
  ]);

  return updatedProfile;
}

export async function updateCoachProfile(userId: string, input: NonNullable<NormalizedProfileUpdate["coachProfile"]>) {
  return prisma.coachProfile.upsert({
    where: { userId },
    create: {
      userId,
      specialization: input.specialization,
      yearsOfExperience: input.yearsOfExperience,
      certifications: input.certifications ?? [],
      coachingStyle: input.coachingStyle,
      achievements: input.achievements,
    },
    update: {
      specialization: input.specialization,
      yearsOfExperience: input.yearsOfExperience,
      certifications: input.certifications,
      coachingStyle: input.coachingStyle,
      achievements: input.achievements,
    },
  });
}

export async function updateMemberProfileInput(userId: string, input: NonNullable<NormalizedProfileUpdate["memberProfile"]>) {
  return prisma.memberProfile.upsert({
    where: { userId },
    create: {
      userId,
      trainingLevel: input.trainingLevel,
      preferredTrainingType: input.preferredTrainingType,
    },
    update: {
      trainingLevel: input.trainingLevel,
      preferredTrainingType: input.preferredTrainingType,
    },
  });
}

export async function updateUserName(userId: string, fullName: string) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      name: fullName,
      fullName,
    },
  });
}

export async function updateUserAccountDetails(
  userId: string,
  input: {
    phone?: string | null;
    dateOfBirth?: Date | null;
    gender?: NormalizedProfileUpdate["gender"];
    address?: string | null;
    emergencyContact?: string | null;
    sportLevel?: NonNullable<NormalizedProfileUpdate["memberProfile"]>["trainingLevel"];
  },
) {
  return prisma.user.update({
    where: { id: userId },
    data: {
      phone: input.phone,
      dateOfBirth: input.dateOfBirth,
      gender: input.gender,
      address: input.address,
      emergencyContact: input.emergencyContact,
      sportLevel: input.sportLevel,
    },
  });
}

export async function getMemberStats(userId: string) {
  const thirtyDaysAgo = subDays(new Date(), 30);

  const [
    attendanceCount,
    pointsAggregate,
    attendanceHistory,
    badgeCount,
    progressNotesCount,
    ratingsGivenCount,
    recentAttendanceCount,
    recentSessionCount,
  ] = await Promise.all([
    prisma.attendance.count({
      where: {
        memberId: userId,
      },
    }),
    prisma.pointsLog.aggregate({
      where: {
        memberId: userId,
      },
      _sum: {
        points: true,
      },
    }),
    prisma.attendance.findMany({
      where: {
        memberId: userId,
      },
      select: {
        checkedInAt: true,
      },
      orderBy: {
        checkedInAt: "desc",
      },
    }),
    prisma.memberBadge.count({
      where: {
        memberId: userId,
      },
    }),
    prisma.progressNote.count({
      where: {
        memberId: userId,
      },
    }),
    prisma.rating.count({
      where: {
        memberId: userId,
      },
    }),
    prisma.attendance.count({
      where: {
        memberId: userId,
        checkedInAt: {
          gte: thirtyDaysAgo,
        },
      },
    }),
    prisma.trainingSession.count({
      where: {
        sessionDate: {
          gte: thirtyDaysAgo,
          lte: new Date(),
        },
      },
    }),
  ]);

  return {
    attendanceCount,
    totalPoints: pointsAggregate._sum.points ?? 0,
    badgeCount,
    progressNotesCount,
    ratingsGivenCount,
    recentAttendanceCount,
    recentSessionCount,
    attendanceHistory,
  };
}

export async function getLeaderboardByPoints() {
  return prisma.pointsLog.groupBy({
    by: ["memberId"],
    _sum: {
      points: true,
    },
    orderBy: {
      _sum: {
        points: "desc",
      },
    },
  });
}

export async function getAllMemberProfiles() {
  return prisma.memberProfile.findMany({
    select: {
      userId: true,
      currentRank: true,
    },
  });
}

export async function getAllMemberUserIds() {
  const members = await prisma.user.findMany({
    where: {
      role: Role.MEMBER,
      status: AccountStatus.ACTIVE,
    },
    select: {
      id: true,
    },
  });

  return members.map((member) => member.id);
}

export async function getCoachStats(userId: string) {
  const [totalSessionsCoached, ratingsAggregate] = await Promise.all([
    prisma.trainingSession.count({
      where: {
        coachId: userId,
      },
    }),
    prisma.rating.aggregate({
      where: {
        coachId: userId,
      },
      _avg: {
        score: true,
      },
      _count: {
        score: true,
      },
    }),
  ]);

  return {
    totalSessionsCoached,
    averageRating: ratingsAggregate._avg.score ?? 0,
    totalReviews: ratingsAggregate._count.score,
  };
}

export async function getMemberProfileExtras(userId: string) {
  const [badges, progressNotesCount, latestProgressNote, latestAttendance] = await Promise.all([
    prisma.memberBadge.findMany({
      where: {
        memberId: userId,
      },
      include: {
        badge: true,
      },
      orderBy: {
        awardedAt: "desc",
      },
    }),
    prisma.progressNote.count({
      where: {
        memberId: userId,
      },
    }),
    prisma.progressNote.findFirst({
      where: {
        memberId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        note: true,
        createdAt: true,
        coach: {
          select: {
            name: true,
          },
        },
      },
    }),
    prisma.attendance.findFirst({
      where: {
        memberId: userId,
      },
      orderBy: {
        checkedInAt: "desc",
      },
      select: {
        checkedInAt: true,
      },
    }),
  ]);

  return {
    badges,
    progressNotesCount,
    latestProgressNote,
    latestAttendance,
  };
}

export async function updateMemberProfileStats(userId: string, data: {
  attendanceCount?: number;
  totalPoints?: number;
  currentStreak?: number;
  overallRating?: number;
  currentRank?: number | null;
  previousRank?: number | null;
  rankChange?: number;
  leaderboardUpdatedAt?: Date | null;
}) {
  return prisma.memberProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...createMemberProfileCreateData(),
      attendanceCount: data.attendanceCount ?? 0,
      totalPoints: data.totalPoints ?? 0,
      currentStreak: data.currentStreak ?? 0,
      overallRating: data.overallRating ?? 0,
      currentRank: data.currentRank ?? null,
      previousRank: data.previousRank ?? null,
      rankChange: data.rankChange ?? 0,
      leaderboardUpdatedAt: data.leaderboardUpdatedAt ?? null,
    },
    update: {
      attendanceCount: data.attendanceCount,
      totalPoints: data.totalPoints,
      currentStreak: data.currentStreak,
      overallRating: data.overallRating,
      currentRank: data.currentRank,
      previousRank: data.previousRank,
      rankChange: data.rankChange,
      leaderboardUpdatedAt: data.leaderboardUpdatedAt,
    },
  });
}
