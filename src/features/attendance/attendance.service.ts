import {
  createAttendanceRewardTransaction,
  findSessionByQrToken,
  getMemberRewardSnapshot,
  isUniqueViolation,
} from "@/features/attendance/attendance.repository";
import { awardBadges } from "@/lib/gamification";
import { ATTENDANCE_POINTS } from "@/lib/domain";
import { syncMemberMetrics } from "@/features/profiles/profiles.service";

export class AttendanceSessionNotFoundError extends Error {}
export class AttendanceAlreadyMarkedError extends Error {}

function rankTrendFromChange(rankChange: number) {
  if (rankChange > 0) {
    return "up" as const;
  }

  if (rankChange < 0) {
    return "down" as const;
  }

  return "same" as const;
}

export type AttendanceScanRewardResult = {
  sessionId: string;
  sessionTitle: string;
  pointsAwarded: number;
  checkedInAt: string;
  metrics: {
    totalPoints: number;
    attendanceCount: number;
    currentStreak: number;
    currentRank: number | null;
    previousRank: number | null;
    rankChange: number;
    trend: "up" | "down" | "same";
  };
};

export async function scanAttendanceAndReward(
  memberId: string,
  qrToken: string,
): Promise<AttendanceScanRewardResult> {
  const trainingSession = await findSessionByQrToken(qrToken);

  if (!trainingSession) {
    throw new AttendanceSessionNotFoundError("QR code not recognized");
  }

  try {
    const txResult = await createAttendanceRewardTransaction({
      memberId,
      sessionId: trainingSession.id,
      sessionTitle: trainingSession.title,
      points: ATTENDANCE_POINTS,
    });

    if (txResult.status === "duplicate") {
      throw new AttendanceAlreadyMarkedError("Attendance already marked for this session");
    }

    await awardBadges(memberId);
    await syncMemberMetrics(memberId);

    const snapshot = await getMemberRewardSnapshot(memberId);

    return {
      sessionId: trainingSession.id,
      sessionTitle: trainingSession.title,
      pointsAwarded: ATTENDANCE_POINTS,
      checkedInAt: txResult.checkedInAt.toISOString(),
      metrics: {
        totalPoints: snapshot.totalPoints,
        attendanceCount: snapshot.attendanceCount,
        currentStreak: snapshot.currentStreak,
        currentRank: snapshot.currentRank,
        previousRank: snapshot.previousRank,
        rankChange: snapshot.rankChange,
        trend: rankTrendFromChange(snapshot.rankChange),
      },
    };
  } catch (error) {
    if (error instanceof AttendanceAlreadyMarkedError) {
      throw error;
    }

    if (isUniqueViolation(error)) {
      throw new AttendanceAlreadyMarkedError("Attendance already marked for this session");
    }

    throw error;
  }
}
