import { AccountStatus, Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/route-auth";

export async function GET() {
  const auth = await requireApiAuth(Role.COACH);
  if (auth.error) return auth.error;

  const members = await prisma.user.findMany({
    where: {
      role: Role.MEMBER,
      status: AccountStatus.ACTIVE,
    },
    include: {
      attendances: {
        select: {
          id: true,
        },
      },
      pointsLogs: {
        select: {
          points: true,
        },
      },
      progressNotesReceived: {
        where: {
          coachId: auth.session.user.id,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      memberBadges: {
        include: {
          badge: true,
        },
      },
      profile: {
        select: {
          displayName: true,
          avatarUrl: true,
          memberProfile: {
            select: {
              overallRating: true,
              currentRank: true,
              previousRank: true,
              rankChange: true,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  const data = members.map((member) => ({
    id: member.id,
    name: member.name,
    displayName: member.profile?.displayName ?? member.name,
    avatarUrl: member.profile?.avatarUrl ?? null,
    email: member.email,
    attendanceCount: member.attendances.length,
    points: member.pointsLogs.reduce((total, item) => total + item.points, 0),
    overallRating: Math.round(member.profile?.memberProfile?.overallRating ?? 0),
    currentRank: member.profile?.memberProfile?.currentRank ?? null,
    previousRank: member.profile?.memberProfile?.previousRank ?? null,
    rankChange: member.profile?.memberProfile?.rankChange ?? 0,
    trend:
      (member.profile?.memberProfile?.rankChange ?? 0) > 0
        ? "up"
        : (member.profile?.memberProfile?.rankChange ?? 0) < 0
          ? "down"
          : "same",
    latestProgressNote: member.progressNotesReceived[0]?.note ?? null,
    badges: member.memberBadges.map((memberBadge) => memberBadge.badge),
  }));

  return NextResponse.json({ members: data });
}
