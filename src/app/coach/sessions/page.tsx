import { Role } from "@prisma/client";
import QRCode from "qrcode";

import { CoachSessionManager } from "@/components/forms/coach-session-manager";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CoachSessionsPage() {
  const session = await requirePageAuth(Role.COACH);

  const sessions = await prisma.trainingSession.findMany({
    where: {
      coachId: session.user.id,
    },
    include: {
      _count: {
        select: {
          attendances: true,
        },
      },
    },
    orderBy: [{ sessionDate: "desc" }, { startTime: "desc" }],
  });

  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  const serializableSessions = await Promise.all(
    sessions.map(async (item) => {
      const checkInUrl = `${baseUrl}/member/attendance?token=${encodeURIComponent(item.qrToken)}`;
      const qrDataUrl = await QRCode.toDataURL(checkInUrl, {
        margin: 1,
        width: 220,
      });

      return {
        id: item.id,
        title: item.title,
        sessionDate: item.sessionDate.toISOString().slice(0, 10),
        startTime: item.startTime,
        endTime: item.endTime,
        trainingType: item.trainingType,
        level: item.level,
        notes: item.notes,
        qrToken: item.qrToken,
        qrDataUrl,
        attendanceCount: item._count.attendances,
      };
    }),
  );

  return <CoachSessionManager sessions={serializableSessions} />;
}
