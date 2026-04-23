type MemberRatingInput = {
  attendanceCount: number;
  totalPoints: number;
  currentStreak: number;
  badgeCount: number;
  progressNotesCount: number;
  recentAttendanceCount: number;
  recentSessionCount: number;
  ratingsGivenCount: number;
};

const RATING_BASE = 40;

const RATING_RULES = {
  attendance: { weight: 20, cap: 40 },
  points: { weight: 15, cap: 120 },
  consistency: { weight: 10 },
  streak: { weight: 7, cap: 7 },
  badges: { weight: 5, cap: 4 },
  progressNotes: { weight: 3, cap: 6 },
  coachFeedback: { weight: 5, cap: 5 },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function normalizedWithCap(value: number, cap: number) {
  if (cap <= 0) {
    return 0;
  }

  return clamp(value / cap, 0, 1);
}

export function calculateMemberOverallRating(input: MemberRatingInput) {
  const hasTrackedProgress =
    input.attendanceCount > 0 ||
    input.totalPoints > 0 ||
    input.currentStreak > 0 ||
    input.badgeCount > 0 ||
    input.progressNotesCount > 0 ||
    input.recentAttendanceCount > 0 ||
    input.ratingsGivenCount > 0;

  if (!hasTrackedProgress) {
    return 0;
  }

  const consistencyRatio =
    input.recentSessionCount > 0
      ? clamp(input.recentAttendanceCount / input.recentSessionCount, 0, 1)
      : 0;

  const rawScore =
    RATING_BASE +
    normalizedWithCap(input.attendanceCount, RATING_RULES.attendance.cap) *
      RATING_RULES.attendance.weight +
    normalizedWithCap(input.totalPoints, RATING_RULES.points.cap) * RATING_RULES.points.weight +
    consistencyRatio * RATING_RULES.consistency.weight +
    normalizedWithCap(input.currentStreak, RATING_RULES.streak.cap) * RATING_RULES.streak.weight +
    normalizedWithCap(input.badgeCount, RATING_RULES.badges.cap) * RATING_RULES.badges.weight +
    normalizedWithCap(input.progressNotesCount, RATING_RULES.progressNotes.cap) *
      RATING_RULES.progressNotes.weight +
    normalizedWithCap(input.ratingsGivenCount, RATING_RULES.coachFeedback.cap) *
      RATING_RULES.coachFeedback.weight;

  return Math.round(clamp(rawScore, 40, 99));
}
