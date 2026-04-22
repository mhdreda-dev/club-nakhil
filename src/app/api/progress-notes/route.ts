import { AccountStatus, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { syncMemberMetrics } from "@/features/profiles/profiles.service";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";
import { progressNoteSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  const memberIdParam = request.nextUrl.searchParams.get("memberId") ?? undefined;

  if (auth.session.user.role === Role.MEMBER) {
    const notes = await prisma.progressNote.findMany({
      where: {
        memberId: auth.session.user.id,
      },
      include: {
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

    return NextResponse.json({ notes });
  }

  if (auth.session.user.role !== Role.COACH) {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const where = memberIdParam
    ? {
        coachId: auth.session.user.id,
        memberId: memberIdParam,
      }
    : {
        coachId: auth.session.user.id,
      };

  const notes = await prisma.progressNote.findMany({
    where,
    include: {
      member: {
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

  return NextResponse.json({ notes });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(Role.COACH);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = progressNoteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid progress note payload" }, { status: 400 });
    }

    const member = await prisma.user.findUnique({
      where: {
        id: parsed.data.memberId,
        role: Role.MEMBER,
        status: AccountStatus.ACTIVE,
      },
      select: {
        id: true,
      },
    });

    if (!member) {
      return NextResponse.json({ message: "Member not found" }, { status: 404 });
    }

    const note = await prisma.progressNote.create({
      data: {
        memberId: parsed.data.memberId,
        coachId: auth.session.user.id,
        note: parsed.data.note,
      },
    });

    await syncMemberMetrics(parsed.data.memberId).catch((syncError) => {
      console.error("Member metrics sync warning after progress note:", syncError);
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to save progress note" }, { status: 500 });
  }
}
