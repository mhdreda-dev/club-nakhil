import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  if (auth.session.user.role === Role.COACH) {
    const sessions = await prisma.trainingSession.findMany({
      where: {
        coachId: auth.session.user.id,
      },
      include: {
        attendances: {
          include: {
            member: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            checkedInAt: "desc",
          },
        },
      },
      orderBy: [{ sessionDate: "desc" }, { startTime: "desc" }],
    });

    return NextResponse.json({ sessions });
  }

  if (auth.session.user.role !== Role.MEMBER) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const attendance = await prisma.attendance.findMany({
    where: {
      memberId: auth.session.user.id,
    },
    include: {
      session: {
        include: {
          coach: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      checkedInAt: "desc",
    },
  });

  return NextResponse.json({ attendance });
}
