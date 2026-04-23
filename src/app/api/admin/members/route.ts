import { AccountStatus, Role } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createMemberProfileCreateData } from "@/features/profiles/member-profile";
import { requireApiAuth } from "@/lib/route-auth";
import {
  manualMemberCreateSchema,
  memberStatusFilterSchema,
} from "@/lib/validation";

function mapIssuesToFieldErrors(
  issues: Array<{
    path: PropertyKey[];
    message: string;
  }>,
) {
  const fieldErrors: Record<string, string> = {};

  for (const issue of issues) {
    const key = String(issue.path[0] ?? "form");

    if (!(key in fieldErrors)) {
      fieldErrors[key] = issue.message;
    }
  }

  return fieldErrors;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAuth(Role.ADMIN);
  if (auth.error) return auth.error;

  const statusParam = request.nextUrl.searchParams.get("status");
  const searchQuery = request.nextUrl.searchParams.get("search")?.trim() ?? "";
  const parsedStatus = memberStatusFilterSchema.safeParse(statusParam ?? undefined);

  if (!parsedStatus.success) {
    return NextResponse.json({ message: "Invalid status filter." }, { status: 400 });
  }

  const where = {
    role: Role.MEMBER,
    ...(parsedStatus.data ? { status: parsedStatus.data } : {}),
    ...(searchQuery.length
      ? {
          OR: [
            { name: { contains: searchQuery, mode: "insensitive" as const } },
            { fullName: { contains: searchQuery, mode: "insensitive" as const } },
            { email: { contains: searchQuery, mode: "insensitive" as const } },
            { phone: { contains: searchQuery, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [members, totalCount, pendingCount, activeCount, blockedCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        fullName: true,
        email: true,
        status: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
        address: true,
        emergencyContact: true,
        sportLevel: true,
        membershipType: true,
        profileImage: true,
        createdAt: true,
        updatedAt: true,
        profile: {
          select: {
            displayName: true,
            avatarUrl: true,
            memberProfile: {
              select: {
                trainingLevel: true,
                overallRating: true,
                currentRank: true,
              },
            },
          },
        },
      },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.user.count({
      where: {
        role: Role.MEMBER,
      },
    }),
    prisma.user.count({
      where: {
        role: Role.MEMBER,
        status: AccountStatus.PENDING,
      },
    }),
    prisma.user.count({
      where: {
        role: Role.MEMBER,
        status: AccountStatus.ACTIVE,
      },
    }),
    prisma.user.count({
      where: {
        role: Role.MEMBER,
        status: AccountStatus.BLOCKED,
      },
    }),
  ]);

  return NextResponse.json({
    members: members.map((member) => ({
      id: member.id,
      fullName: member.fullName ?? member.name,
      displayName: member.profile?.displayName ?? member.fullName ?? member.name,
      email: member.email,
      status: member.status,
      phone: member.phone,
      dateOfBirth: member.dateOfBirth,
      gender: member.gender,
      address: member.address,
      emergencyContact: member.emergencyContact,
      sportLevel: member.sportLevel ?? member.profile?.memberProfile?.trainingLevel ?? null,
      membershipType: member.membershipType,
      profileImage: member.profile?.avatarUrl ?? member.profileImage,
      overallRating: Math.round(member.profile?.memberProfile?.overallRating ?? 0),
      currentRank: member.profile?.memberProfile?.currentRank ?? null,
      createdAt: member.createdAt,
      updatedAt: member.updatedAt,
    })),
    stats: {
      total: totalCount,
      pending: pendingCount,
      active: activeCount,
      blocked: blockedCount,
    },
  });
}

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth(Role.ADMIN);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const parsed = manualMemberCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "Please correct the highlighted fields.",
          fieldErrors: mapIssuesToFieldErrors(parsed.error.issues),
        },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email: parsed.data.email,
      },
      select: {
        id: true,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "This email is already registered.",
          fieldErrors: {
            email: "An account with this email already exists.",
          },
        },
        { status: 409 },
      );
    }

    const passwordHash = await hash(parsed.data.password, 12);
    const dateOfBirth = new Date(`${parsed.data.dateOfBirth}T00:00:00.000Z`);
    const profileImage = parsed.data.profileImage ? parsed.data.profileImage : null;

    const member = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: parsed.data.fullName,
          fullName: parsed.data.fullName,
          email: parsed.data.email,
          passwordHash,
          role: Role.MEMBER,
          status: parsed.data.status,
          phone: parsed.data.phone,
          dateOfBirth,
          gender: parsed.data.gender,
          address: parsed.data.address,
          emergencyContact: parsed.data.emergencyContact,
          sportLevel: parsed.data.sportLevel,
          membershipType: parsed.data.membershipType,
          profileImage,
        },
      });

      await tx.userProfile.create({
        data: {
          userId: user.id,
          fullName: parsed.data.fullName,
          displayName: parsed.data.fullName,
          phone: parsed.data.phone,
          dateOfBirth,
          gender: parsed.data.gender,
          address: parsed.data.address,
          emergencyContact: parsed.data.emergencyContact,
          avatarUrl: profileImage,
          joinedAt: user.createdAt,
        },
      });

      await tx.memberProfile.create({
        data: {
          userId: user.id,
          ...createMemberProfileCreateData(parsed.data.sportLevel),
        },
      });

      return user;
    });

    return NextResponse.json(
      {
        message: "Member account created successfully.",
        member: {
          id: member.id,
          fullName: member.fullName ?? member.name,
          email: member.email,
          status: member.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Unable to create member account.",
      },
      { status: 500 },
    );
  }
}
