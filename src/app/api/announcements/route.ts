import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";
import { announcementSchema } from "@/lib/validation";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;

  const announcements = await prisma.announcement.findMany({
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

  return NextResponse.json({ announcements });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(Role.COACH);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = announcementSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid announcement payload" }, { status: 400 });
    }

    const announcement = await prisma.announcement.create({
      data: {
        title: parsed.data.title,
        content: parsed.data.content,
        coachId: auth.session.user.id,
      },
    });

    return NextResponse.json({ announcement }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to publish announcement" }, { status: 500 });
  }
}
