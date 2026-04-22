import { Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";
import { sessionFormSchema } from "@/lib/validation";

function hasValidTimeRange(startTime: string, endTime: string) {
  return startTime < endTime;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth(Role.COACH);
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const existing = await prisma.trainingSession.findUnique({
    where: { id },
    select: { id: true, coachId: true },
  });

  if (!existing || existing.coachId !== auth.session.user.id) {
    return NextResponse.json({ message: "Session not found" }, { status: 404 });
  }

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

    const session = await prisma.trainingSession.update({
      where: { id },
      data: {
        title: parsed.data.title,
        sessionDate: new Date(`${parsed.data.sessionDate}T00:00:00`),
        startTime: parsed.data.startTime,
        endTime: parsed.data.endTime,
        trainingType: parsed.data.trainingType,
        level: parsed.data.level,
        notes: parsed.data.notes || null,
      },
    });

    return NextResponse.json({ session });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Unable to update session" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const auth = await requireApiAuth(Role.COACH);
  if (auth.error) return auth.error;

  const { id } = await context.params;

  const existing = await prisma.trainingSession.findUnique({
    where: { id },
    select: { id: true, coachId: true },
  });

  if (!existing || existing.coachId !== auth.session.user.id) {
    return NextResponse.json({ message: "Session not found" }, { status: 404 });
  }

  await prisma.trainingSession.delete({
    where: { id },
  });

  return NextResponse.json({ ok: true });
}
