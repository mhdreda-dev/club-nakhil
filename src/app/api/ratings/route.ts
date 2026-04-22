import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { syncMemberMetrics } from "@/features/profiles/profiles.service";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";
import { ratingSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  if (auth.session.user.role === Role.COACH) {
    const ratings = await prisma.rating.findMany({
      where: {
        coachId: auth.session.user.id,
      },
      include: {
        member: {
          select: {
            id: true,
            name: true,
          },
        },
        session: {
          select: {
            id: true,
            title: true,
            sessionDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const count = ratings.length;
    const averageRating =
      count === 0
        ? 0
        : ratings.reduce((accumulator, rating) => accumulator + rating.score, 0) / count;

    return NextResponse.json({
      ratings,
      stats: {
        averageRating,
        count,
      },
    });
  }

  if (auth.session.user.role !== Role.MEMBER) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const ratings = await prisma.rating.findMany({
    where: {
      memberId: auth.session.user.id,
    },
    include: {
      session: {
        select: {
          id: true,
          title: true,
          sessionDate: true,
        },
      },
      coach: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({ ratings });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(Role.MEMBER);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = ratingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid rating payload" }, { status: 400 });
    }

    const trainingSession = await prisma.trainingSession.findUnique({
      where: {
        id: parsed.data.sessionId,
      },
      select: {
        id: true,
        coachId: true,
        sessionDate: true,
      },
    });

    if (!trainingSession) {
      return NextResponse.json({ message: "Session not found" }, { status: 404 });
    }

    if (trainingSession.sessionDate > new Date()) {
      return NextResponse.json(
        {
          message: "You can only rate completed sessions",
        },
        { status: 400 },
      );
    }

    const attendance = await prisma.attendance.findUnique({
      where: {
        sessionId_memberId: {
          sessionId: parsed.data.sessionId,
          memberId: auth.session.user.id,
        },
      },
    });

    if (!attendance) {
      return NextResponse.json(
        {
          message: "You must attend a session before rating a coach",
        },
        { status: 400 },
      );
    }

    const rating = await prisma.rating.upsert({
      where: {
        sessionId_memberId: {
          sessionId: parsed.data.sessionId,
          memberId: auth.session.user.id,
        },
      },
      update: {
        score: parsed.data.score,
        comment: parsed.data.comment || null,
      },
      create: {
        sessionId: parsed.data.sessionId,
        memberId: auth.session.user.id,
        coachId: trainingSession.coachId,
        score: parsed.data.score,
        comment: parsed.data.comment || null,
      },
    });

    await syncMemberMetrics(auth.session.user.id).catch((syncError) => {
      console.error("Member metrics sync warning after rating update:", syncError);
    });

    return NextResponse.json({ rating }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to save rating" }, { status: 500 });
  }
}
