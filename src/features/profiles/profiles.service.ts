import { Role } from "@prisma/client";

import {
  createDefaultProfileForUser,
  getCoachStats,
  findUserWithProfile,
  getMemberProfileExtras,
  getMemberStats,
  updateCoachProfile,
  updateMemberProfileInput,
  updateMemberProfileStats,
  updateUserAccountDetails,
  updateUserName,
  updateUserProfileBase,
} from "@/features/profiles/profiles.repository";
import { recomputeMemberLeaderboardRanks } from "@/features/leaderboard/leaderboard.service";
import { calculateMemberOverallRating } from "@/features/profiles/member-rating";
import type { NormalizedProfileUpdate } from "@/features/profiles/profiles.schemas";

export type ProfileDTO = {
  userId: string;
  role: Role;
  email: string;
  fullName: string;
  displayName: string;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  city: string | null;
  address: string | null;
  bio: string | null;
  emergencyContact: string | null;
  avatarUrl: string | null;
  avatarPath: string | null;
  joinedAt: string;
  coachProfile: {
    specialization: string | null;
    yearsOfExperience: number | null;
    certifications: string[];
    coachingStyle: string | null;
    achievements: string | null;
  } | null;
  memberProfile: {
    trainingLevel: string;
    preferredTrainingType: string | null;
    attendanceCount: number;
    totalPoints: number;
    currentStreak: number;
    overallRating: number;
    currentRank: number | null;
    previousRank: number | null;
    rankChange: number;
  } | null;
};

export type ProfileSidebarSummary = {
  userId: string;
  role: Role;
  displayName: string;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  metrics: Array<{
    label: string;
    value: string;
  }>;
};

export type CoachProfilePageData = {
  profile: ProfileDTO;
  stats: {
    averageRating: number;
    totalReviews: number;
    totalSessionsCoached: number;
  };
};

export type MemberProfilePageData = {
  profile: ProfileDTO;
  badges: Array<{
    id: string;
    name: string;
    description: string;
    awardedAt: string;
  }>;
  progressSummary: {
    progressNotesCount: number;
    latestProgressNote: {
      note: string;
      createdAt: string;
      coachName: string;
    } | null;
    lastAttendanceAt: string | null;
  };
};

function toProfileDTO(user: Awaited<ReturnType<typeof findUserWithProfile>>): ProfileDTO {
  if (!user || !user.profile) {
    throw new Error("Profile unavailable");
  }

  return {
    userId: user.id,
    role: user.role,
    email: user.email,
    fullName: user.profile.fullName,
    displayName: user.profile.displayName,
    phone: user.profile.phone,
    dateOfBirth: user.profile.dateOfBirth ? user.profile.dateOfBirth.toISOString().slice(0, 10) : null,
    gender: user.profile.gender,
    city: user.profile.city,
    address: user.profile.address,
    bio: user.profile.bio,
    emergencyContact: user.profile.emergencyContact,
    avatarUrl: user.profile.avatarUrl,
    avatarPath: user.profile.avatarPath,
    joinedAt: user.profile.joinedAt.toISOString(),
    coachProfile: user.profile.coachProfile
      ? {
          specialization: user.profile.coachProfile.specialization,
          yearsOfExperience: user.profile.coachProfile.yearsOfExperience,
          certifications: user.profile.coachProfile.certifications,
          coachingStyle: user.profile.coachProfile.coachingStyle,
          achievements: user.profile.coachProfile.achievements,
        }
      : null,
    memberProfile: user.profile.memberProfile
      ? {
          trainingLevel: user.profile.memberProfile.trainingLevel,
          preferredTrainingType: user.profile.memberProfile.preferredTrainingType,
          attendanceCount: user.profile.memberProfile.attendanceCount,
          totalPoints: user.profile.memberProfile.totalPoints,
          currentStreak: user.profile.memberProfile.currentStreak,
          overallRating: user.profile.memberProfile.overallRating,
          currentRank: user.profile.memberProfile.currentRank,
          previousRank: user.profile.memberProfile.previousRank,
          rankChange: user.profile.memberProfile.rankChange,
        }
      : null,
  };
}

function calculateStreak(attendanceHistory: { checkedInAt: Date }[]) {
  if (!attendanceHistory.length) {
    return 0;
  }

  const uniqueDays = Array.from(
    new Set(
      attendanceHistory.map((entry) =>
        entry.checkedInAt.toISOString().slice(0, 10),
      ),
    ),
  ).sort((a, b) => b.localeCompare(a));

  let streak = 0;
  let previousDate: Date | null = null;

  for (const day of uniqueDays) {
    const currentDate = new Date(`${day}T00:00:00.000Z`);

    if (!previousDate) {
      streak += 1;
      previousDate = currentDate;
      continue;
    }

    const delta = (previousDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);

    if (delta <= 1) {
      streak += 1;
      previousDate = currentDate;
      continue;
    }

    break;
  }

  return streak;
}

export async function ensureProfile(userId: string) {
  const user = await findUserWithProfile(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.profile) {
    await createDefaultProfileForUser(user);
  }

  return findUserWithProfile(userId);
}

export async function syncMemberMetrics(userId: string) {
  const user = await ensureProfile(userId);

  if (!user || user.role !== Role.MEMBER) {
    return;
  }

  const stats = await getMemberStats(userId);
  const currentStreak = calculateStreak(stats.attendanceHistory);
  const overallRating = calculateMemberOverallRating({
    attendanceCount: stats.attendanceCount,
    totalPoints: stats.totalPoints,
    currentStreak,
    badgeCount: stats.badgeCount,
    progressNotesCount: stats.progressNotesCount,
    recentAttendanceCount: stats.recentAttendanceCount,
    recentSessionCount: stats.recentSessionCount,
    ratingsGivenCount: stats.ratingsGivenCount,
  });

  await updateMemberProfileStats(userId, {
    attendanceCount: stats.attendanceCount,
    totalPoints: stats.totalPoints,
    currentStreak,
    overallRating,
  });

  await recomputeMemberLeaderboardRanks();
}

export async function getOwnProfile(userId: string) {
  let user = await ensureProfile(userId);

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === Role.MEMBER) {
    await syncMemberMetrics(userId);
    user = await ensureProfile(userId);
  }

  return toProfileDTO(user);
}

export async function getProfileHeader(userId: string) {
  const user = await ensureProfile(userId);

  if (!user?.profile) {
    return null;
  }

  return {
    displayName: user.profile.displayName,
    avatarUrl: user.profile.avatarUrl,
  };
}

export async function getProfileSidebarSummary(userId: string): Promise<ProfileSidebarSummary | null> {
  const user = await ensureProfile(userId);

  if (!user?.profile) {
    return null;
  }

  if (user.role === Role.COACH) {
    const coachStats = await getCoachStats(userId);

    return {
      userId,
      role: user.role,
      displayName: user.profile.displayName,
      city: user.profile.city,
      bio: user.profile.bio,
      avatarUrl: user.profile.avatarUrl,
      metrics: [
        { label: "Rating", value: coachStats.averageRating.toFixed(2) },
        { label: "Sessions", value: String(coachStats.totalSessionsCoached) },
        { label: "Reviews", value: String(coachStats.totalReviews) },
      ],
    };
  }

  const memberProfile = user.profile.memberProfile;

  return {
    userId,
    role: user.role,
    displayName: user.profile.displayName,
    city: user.profile.city,
    bio: user.profile.bio,
    avatarUrl: user.profile.avatarUrl,
    metrics: [
      { label: "Points", value: String(memberProfile?.totalPoints ?? 0) },
      { label: "Rating", value: String(Math.round(memberProfile?.overallRating ?? 0)) },
      { label: "Rank", value: memberProfile?.currentRank ? `#${memberProfile.currentRank}` : "-" },
    ],
  };
}

export async function getCoachProfilePageData(userId: string): Promise<CoachProfilePageData> {
  const [profile, stats] = await Promise.all([getOwnProfile(userId), getCoachStats(userId)]);

  return {
    profile,
    stats: {
      averageRating: Number(stats.averageRating.toFixed(2)),
      totalReviews: stats.totalReviews,
      totalSessionsCoached: stats.totalSessionsCoached,
    },
  };
}

export async function getMemberProfilePageData(userId: string): Promise<MemberProfilePageData> {
  const profile = await getOwnProfile(userId);
  const extras = await getMemberProfileExtras(userId);

  return {
    profile,
    badges: extras.badges.map((memberBadge) => ({
      id: memberBadge.id,
      name: memberBadge.badge.name,
      description: memberBadge.badge.description,
      awardedAt: memberBadge.awardedAt.toISOString(),
    })),
    progressSummary: {
      progressNotesCount: extras.progressNotesCount,
      latestProgressNote: extras.latestProgressNote
        ? {
            note: extras.latestProgressNote.note,
            createdAt: extras.latestProgressNote.createdAt.toISOString(),
            coachName: extras.latestProgressNote.coach.name,
          }
        : null,
      lastAttendanceAt: extras.latestAttendance?.checkedInAt.toISOString() ?? null,
    },
  };
}

export async function updateOwnProfile(userId: string, role: Role, input: NormalizedProfileUpdate) {
  await ensureProfile(userId);

  await updateUserProfileBase(userId, input);

  if (input.fullName) {
    await updateUserName(userId, input.fullName);
  }

  await updateUserAccountDetails(userId, {
    phone: input.phone,
    dateOfBirth: input.dateOfBirth,
    gender: input.gender,
    address: input.address,
    emergencyContact: input.emergencyContact,
    sportLevel: input.memberProfile?.trainingLevel,
  });

  if (role === Role.COACH && input.coachProfile) {
    await updateCoachProfile(userId, input.coachProfile);
  }

  if (role === Role.MEMBER && input.memberProfile) {
    await updateMemberProfileInput(userId, input.memberProfile);
  }

  if (role === Role.MEMBER) {
    await syncMemberMetrics(userId);
  }

  return getOwnProfile(userId);
}
