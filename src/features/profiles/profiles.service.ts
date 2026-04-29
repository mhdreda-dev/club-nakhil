import { cache } from "react";

import { Role, type TrainingLevel, type TrainingType } from "@prisma/client";

// Concurrent renders on the same Lambda would collide on a static label and
// produce nonsense durations. Generate a tag per call site invocation.
const _PERF = process.env.PERF_TIMINGS === "1";
const _tag = () => Math.random().toString(16).slice(2, 8);
const _pt = (l: string, t: string) => { if (_PERF) console.time(`[profile] ${l}#${t}`); };
const _pe = (l: string, t: string) => { if (_PERF) console.timeEnd(`[profile] ${l}#${t}`); };

import { normalizeMemberProfile } from "@/features/profiles/member-profile";
import {
  createDefaultProfileForUser,
  ensureCoachProfileRecord,
  ensureMemberProfileRecord,
  getCoachStats,
  findUserWithProfile,
  findUserProfileSummary,
  getMemberProfileExtras,
  getMemberStats,
  updateCoachProfile,
  updateMemberProfileInput,
  updateMemberProfileStats,
  updateUserAccountDetails,
  updateUserName,
  updateUserProfileBase,
} from "@/features/profiles/profiles.repository";
import { calculateMemberOverallRating } from "@/features/profiles/member-rating";
import { CACHE_KEYS, CACHE_TTL, getOrSet, invalidate } from "@/lib/cache";
import { getTierInfo } from "@/lib/tier";
import type { NormalizedProfileUpdate } from "@/features/profiles/profiles.schemas";

// The shape returned by findUserProfileSummary. Pulled out so the Redis
// payload type is explicit — we only ship plain primitives + small nested
// objects, no Date / Decimal / Prisma classes that would break JSON.
type ProfileSummaryPayload = Awaited<ReturnType<typeof findUserProfileSummary>>;

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
    trainingLevel: TrainingLevel;
    preferredTrainingType: TrainingType | null;
    attendanceCount: number;
    totalPoints: number;
    currentStreak: number;
    overallRating: number;
    currentRank: number | null;
    previousRank: number | null;
    rankChange: number;
    badgeCount: number;
    progress: number;
    wins: number;
    losses: number;
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

  const memberProfile =
    user.role === Role.MEMBER
      ? normalizeMemberProfile(user.profile.memberProfile, user.sportLevel ?? undefined)
      : null;

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
    memberProfile: memberProfile
      ? {
          trainingLevel: memberProfile.trainingLevel,
          preferredTrainingType: memberProfile.preferredTrainingType,
          attendanceCount: memberProfile.attendanceCount,
          totalPoints: memberProfile.totalPoints,
          currentStreak: memberProfile.currentStreak,
          overallRating: memberProfile.overallRating,
          currentRank: memberProfile.currentRank,
          previousRank: memberProfile.previousRank,
          rankChange: memberProfile.rankChange,
          badgeCount: memberProfile.badgeCount,
          progress: getTierInfo(memberProfile.overallRating).progress,
          wins: memberProfile.wins,
          losses: memberProfile.losses,
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

// Per-request memoized. Layout calls getProfileHeader() AND
// getProfileSidebarSummary() — without dedupe each one re-runs the heavy
// User+Profile+CoachProfile+MemberProfile join.
export const ensureProfile = cache(async (userId: string) => {
  const t = _tag();
  _pt("ensureProfile", t);
  const user = await findUserWithProfile(userId);
  _pe("ensureProfile", t);

  if (!user) {
    throw new Error("User not found");
  }

  if (!user.profile) {
    await createDefaultProfileForUser(user);
    return findUserWithProfile(userId);
  }

  if (user.role === Role.COACH && !user.profile.coachProfile) {
    await ensureCoachProfileRecord(userId);
    return findUserWithProfile(userId);
  }

  if (user.role === Role.MEMBER && !user.profile.memberProfile) {
    await ensureMemberProfileRecord(userId, user.sportLevel ?? undefined);
    return findUserWithProfile(userId);
  }

  return user;
});

// Narrow per-request memoized fetch — only the fields needed by layout/sidebar.
// ~3-4× cheaper than ensureProfile (no coachProfile join, no full memberProfile row).
//
// Two-tier cache:
//   1. React cache() — per-request dedupe so layout's getProfileHeader and
//      getProfileSidebarSummary share one fetch.
//   2. Redis (60s TTL) — cross-request dedupe so a hot member route hits the
//      DB at most once per minute per user instead of on every render
//      (~600ms findUserProfileSummary latency on cold path).
//
// Invalidation is explicit: updateOwnProfile and updateUserProfileAvatar both
// call invalidateProfileSummary(userId) after the write. A 60s TTL on top
// keeps the worst-case staleness bounded if an invalidation path is missed.
export const ensureProfileSummary = cache(async (userId: string) => {
  const t = _tag();
  _pt("ensureProfileSummary", t);
  const result = await getOrSet<ProfileSummaryPayload>(
    CACHE_KEYS.profileSummary(userId),
    CACHE_TTL.PROFILE_SUMMARY,
    () => findUserProfileSummary(userId),
  );
  _pe("ensureProfileSummary", t);
  return result;
});

/**
 * Drop the cached profile summary for a user. Call after any write that can
 * change displayName, avatar, city, bio, or the cached member metrics.
 */
export async function invalidateProfileSummary(userId: string): Promise<void> {
  await invalidate(CACHE_KEYS.profileSummary(userId));
}

/**
 * Sync a single member's stored metrics (attendance count, total points,
 * streak, overall rating) against the source-of-truth tables.
 *
 * IMPORTANT: This function is intentionally scoped to a SINGLE user and never
 * touches the global leaderboard. The global rank recompute is owned by:
 *   - the Vercel Cron job at POST /api/cron/recompute-leaderboard
 *   - the admin trigger at POST /api/admin/leaderboard/recompute
 *
 * Why: the previous implementation called `recomputeMemberLeaderboardRanks()`
 * inline, which opened a Prisma interactive transaction. The production DB is
 * fronted by PgBouncer in transaction pooling mode, which cannot service
 * interactive transactions and surfaces "Transaction API error: Unable to
 * start a transaction in the given time." in Sentry. All the per-user work
 * here (reads + a single upsert) is safe through PgBouncer.
 */
export async function syncMemberMetrics(userId: string) {
  // Use the narrow select instead of ensureProfile's full 5-table JOIN.
  // syncMemberMetrics only needs the role — no reason to fetch coachProfile,
  // the full memberProfile row, or every UserProfile column.
  // In after() the React cache() scope is reset, so ensureProfile would re-run
  // findUserWithProfile (~770ms) on every invocation. findUserProfileSummary
  // does a single-table lookup with a tiny projection (~50ms).
  const user = await findUserProfileSummary(userId);

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
  const t = _tag();
  _pt("getProfileHeader", t);
  const user = await ensureProfileSummary(userId);
  _pe("getProfileHeader", t);

  if (!user?.profile) {
    return null;
  }

  return {
    displayName: user.profile.displayName,
    avatarUrl: user.profile.avatarUrl,
  };
}

export async function getProfileSidebarSummary(userId: string): Promise<ProfileSidebarSummary | null> {
  const t = _tag();
  _pt("getProfileSidebarSummary", t);
  const user = await ensureProfileSummary(userId);
  _pe("getProfileSidebarSummary", t);

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

  const memberProfile = normalizeMemberProfile(
    user.profile.memberProfile,
    user.sportLevel ?? undefined,
  );

  return {
    userId,
    role: user.role,
    displayName: user.profile.displayName,
    city: user.profile.city,
    bio: user.profile.bio,
    avatarUrl: user.profile.avatarUrl,
    metrics: [
      { label: "Points", value: String(memberProfile.totalPoints) },
      { label: "Rating", value: String(Math.round(memberProfile.overallRating)) },
      {
        label: "Rank",
        value: memberProfile.overallRating > 0 && memberProfile.currentRank ? `#${memberProfile.currentRank}` : "-",
      },
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

  // Drop the layout/sidebar cache so the next render reflects the edits
  // immediately instead of waiting up to 60s for the TTL.
  await invalidateProfileSummary(userId);

  return getOwnProfile(userId);
}
