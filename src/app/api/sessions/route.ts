import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";
import { sessionFormSchema } from "@/lib/validation";

function hasValidTimeRange(startTime: string, endTime: string) {
  return startTime < endTime;
}

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  const role = auth.session.user.role;

  if (role === Role.COACH) {
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
        },
        ratings: {
          select: {
            id: true,
            score: true,
            comment: true,
            createdAt: true,
            member: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [{ sessionDate: "desc" }, { startTime: "desc" }],
    });

    return NextResponse.json({ sessions });
  }

  if (role !== Role.MEMBER) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const sessions = await prisma.trainingSession.findMany({
    include: {
      coach: {
        select: {
          id: true,
          name: true,
        },
      },
      attendances: {
        where: {
          memberId: auth.session.user.id,
        },
        select: {
          id: true,
          checkedInAt: true,
        },
      },
      ratings: {
        where: {
          memberId: auth.session.user.id,
        },
        select: {
          id: true,
          score: true,
          createdAt: true,
        },
      },
    },
    orderBy: [{ sessionDate: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(Role.COACH);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = sessionFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Invalid session payload",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    if (!hasValidTimeRange(parsed.data.startTime, parsed.data.endTime)) {
      return NextResponse.json(
        {
          message: "End time must be after start time",
        },
        { status: 400 },
      );
    }

    const session = await prisma.trainingSession.create({
      data: {
        title: parsed.data.title,
        sessionDate: new Date(`${parsed.data.sessionDate}T00:00:00`),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        trainingType: parsed.data.trainingType,
        level: parsed.data.level,
        notes: parsed.data.notes || null,
        coachId: auth.session.user.id,
        qrToken: crypto.randomUUID(),
      },
    });

    return NextResponse.json({ session }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to create session" }, { status: 500 });
  }
}
