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

/**
 * Create an attendance row plus its corresponding points-log entry atomically,
 * without using an interactive Prisma transaction.
 *
 * The previous implementation used `prisma.$transaction(async (tx) => …)`,
 * which fails through Supabase PgBouncer in transaction-pooling mode (port
 * 6543, `?pgbouncer=true`) because PgBouncer cannot pin a session-scoped
 * connection for the duration of an interactive callback. The symptom is the
 * "Transaction API error: Unable to start a transaction in the given time"
 * Sentry alert.
 *
 * The PgBouncer-safe approach used here:
 *
 * 1. Try a fast-path read for an existing attendance row. If present, return
 *    the duplicate result without touching writes.
 * 2. Otherwise, issue both writes in a single ARRAY-form `$transaction(...)`.
 *    Array transactions are translated by Prisma into one BEGIN/COMMIT block
 *    on a single connection — no callback, no idle waits, fully supported by
 *    PgBouncer transaction mode.
 * 3. Treat the unique-constraint race (P2002 on the attendance row) as a
 *    duplicate and recover gracefully.
 */
export async function createAttendanceRewardTransaction(
  input: AttendanceRewardTxInput,
): Promise<AttendanceRewardTxResult> {
  const existingAttendance = await prisma.attendance.findUnique({
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

  try {
    const [attendance] = await prisma.$transaction([
      prisma.attendance.create({
        data: {
          sessionId: input.sessionId,
          memberId: input.memberId,
        },
        select: {
          checkedInAt: true,
        },
      }),
      prisma.pointsLog.create({
        data: {
          memberId: input.memberId,
          sessionId: input.sessionId,
          points: input.points,
          reason: `ATTENDANCE_REWARD: ${input.sessionTitle}`,
        },
      }),
    ]);

    return {
      status: "created",
      checkedInAt: attendance.checkedInAt,
    };
  } catch (error) {
    // Race against a concurrent scan: another request inserted the same
    // sessionId/memberId between our fast-path read and the create. Treat as
    // duplicate and fall through to the existing-row read path.
    if (isUniqueViolation(error)) {
      const winningRow = await prisma.attendance.findUnique({
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

      if (winningRow) {
        return {
          status: "duplicate",
          checkedInAt: winningRow.checkedInAt,
        };
      }
    }

    throw error;
  }
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
