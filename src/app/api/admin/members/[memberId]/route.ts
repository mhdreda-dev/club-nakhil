import { AccountStatus, Role } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { notifyMemberStatusChanged } from "@/lib/member-notifications";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";

const updateMemberStatusSchema = z.object({
  status: z.nativeEnum(AccountStatus),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  const auth = await requireApiAuth(Role.ADMIN);
  if (auth.error) return auth.error;

  const { memberId } = await context.params;

  try {
    const body = await request.json();
    const parsed = updateMemberStatusSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ message: "Invalid status update payload." }, { status: 400 });
    }

    const existingMember = await prisma.user.findUnique({
      where: {
        id: memberId,
      },
      select: {
        id: true,
        role: true,
      },
    });

    if (!existingMember || existingMember.role !== Role.MEMBER) {
      return NextResponse.json({ message: "Member not found." }, { status: 404 });
    }

    const member = await prisma.user.update({
      where: {
        id: memberId,
      },
      data: {
        status: parsed.data.status,
      },
      select: {
        id: true,
        fullName: true,
        name: true,
        email: true,
        status: true,
      },
    });

    notifyMemberStatusChanged({
      fullName: member.fullName ?? member.name,
      email: member.email,
      status: member.status,
    }).catch((notificationError) => {
      console.error("Member notification warning after status update:", notificationError);
    });

    return NextResponse.json({
      message: "Member status updated successfully.",
      member: {
        id: member.id,
        fullName: member.fullName ?? member.name,
        email: member.email,
        status: member.status,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to update member status.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ memberId: string }> },
) {
  const auth = await requireApiAuth(Role.ADMIN);
  if (auth.error) return auth.error;

  const { memberId } = await context.params;

  const existingMember = await prisma.user.findUnique({
    where: {
      id: memberId,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!existingMember || existingMember.role !== Role.MEMBER) {
    return NextResponse.json({ message: "Member not found." }, { status: 404 });
  }

  if (existingMember.status !== AccountStatus.PENDING) {
    return NextResponse.json(
      {
        message: "Only pending registrations can be deleted.",
      },
      { status: 400 },
    );
  }

  await prisma.user.delete({
    where: {
      id: memberId,
    },
  });

  return NextResponse.json({ message: "Pending registration deleted successfully." });
}
