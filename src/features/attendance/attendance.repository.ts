import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";

type AttendanceRewardTxInput = {
  memberId: string;
  sessionId: string;
  sessionTitle: string;
  points: number;
};

type AttendanceRewardTxResult =
  | {
      status: "created";
      checkedInAt: Date;
    }
  | {
      status: "duplicate";
      checkedInAt: Date;
    };

export async function findSessionByQrToken(qrToken: string) {
  return prisma.trainingSession.findUnique({
    where: {
      qrToken,
    },
    select: {
      id: true,
      title: true,
      sessionDate: true,
      startTime: true,
      endTime: true,
    },
  });
}

export async function createAttendanceRewardTransaction(
  input: AttendanceRewardTxInput,
): Promise<AttendanceRewardTxResult> {
  return prisma.$transaction(async (tx) => {
    const existingAttendance = await tx.attendance.findUnique({
      where: {
        sessionId_memberId: {
          sessionId: input.sessionId,
          memberId: input.memberId,
        },
      },
      select: {
        checkedInAt: true,
      },
    });

    if (existingAttendance) {
      return {
        status: "duplicate",
        checkedInAt: existingAttendance.checkedInAt,
      };
    }

    const attendance = await tx.attendance.create({
      data: {
        sessionId: input.sessionId,
        memberId: input.memberId,
      },
      select: {
        checkedInAt: true,
      },
    });

    await tx.pointsLog.create({
      data: {
        memberId: input.memberId,
        sessionId: input.sessionId,
        points: input.points,
        reason: `ATTENDANCE_REWARD: ${input.sessionTitle}`,
      },
    });

    return {
      status: "created",
      checkedInAt: attendance.checkedInAt,
    };
  });
}

export async function getMemberRewardSnapshot(memberId: string) {
  const [memberProfile, pointsAggregate, attendanceCount] = await Promise.all([
    prisma.memberProfile.findUnique({
      where: {
        userId: memberId,
      },
      select: {
        attendanceCount: true,
        totalPoints: true,
        currentStreak: true,
        currentRank: true,
        previousRank: true,
        rankChange: true,
      },
    }),
    prisma.pointsLog.aggregate({
      where: {
        memberId,
      },
      _sum: {
        points: true,
      },
    }),
    prisma.attendance.count({
      where: {
        memberId,
      },
    }),
  ]);

  return {
    totalPoints: memberProfile?.totalPoints ?? pointsAggregate._sum.points ?? 0,
    attendanceCount: memberProfile?.attendanceCount ?? attendanceCount,
    currentStreak: memberProfile?.currentStreak ?? 0,
    currentRank: memberProfile?.currentRank ?? null,
    previousRank: memberProfile?.previousRank ?? null,
    rankChange: memberProfile?.rankChange ?? 0,
  };
}

export function isUniqueViolation(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}
