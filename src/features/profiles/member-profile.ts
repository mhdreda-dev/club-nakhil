import { TrainingLevel, type TrainingType } from "@prisma/client";

export type MemberProfileSnapshot = {
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
};

type MemberProfileLike = Partial<MemberProfileSnapshot> | null | undefined;

export function createEmptyMemberProfile(
  trainingLevel: TrainingLevel = TrainingLevel.BEGINNER,
): MemberProfileSnapshot {
  return {
    trainingLevel,
    preferredTrainingType: null,
    attendanceCount: 0,
    totalPoints: 0,
    currentStreak: 0,
    overallRating: 0,
    currentRank: null,
    previousRank: null,
    rankChange: 0,
    badgeCount: 0,
    progress: 0,
    wins: 0,
    losses: 0,
  };
}

export function createMemberProfileCreateData(
  trainingLevel: TrainingLevel = TrainingLevel.BEGINNER,
) {
  return {
    trainingLevel,
    preferredTrainingType: null,
    attendanceCount: 0,
    totalPoints: 0,
    currentStreak: 0,
    overallRating: 0,
    currentRank: null,
    previousRank: null,
    rankChange: 0,
  };
}

export function normalizeMemberProfile(
  memberProfile: MemberProfileLike,
  trainingLevelFallback?: TrainingLevel,
): MemberProfileSnapshot {
  return {
    ...createEmptyMemberProfile(trainingLevelFallback ?? TrainingLevel.BEGINNER),
    ...(memberProfile ?? {}),
  };
}
