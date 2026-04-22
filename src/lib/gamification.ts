import { subDays } from "date-fns";

import { badgeMilestones } from "@/lib/domain";
import { prisma } from "@/lib/prisma";

export async function awardBadges(memberId: string) {
  const attendanceCount = await prisma.attendance.count({
    where: { memberId },
  });

  const candidateBadgeKeys: string[] = badgeMilestones
    .filter((milestone) => attendanceCount >= milestone.minSessions)
    .map((milestone) => milestone.key);

  const weekAttendanceCount = await prisma.attendance.count({
    where: {
      memberId,
      checkedInAt: {
        gte: subDays(new Date(), 7),
      },
    },
  });

  if (weekAttendanceCount >= 3) {
    candidateBadgeKeys.push("PERFECT_WEEK");
  }

  if (!candidateBadgeKeys.length) {
    return;
  }

  const badges = await prisma.badge.findMany({
    where: {
      key: {
        in: candidateBadgeKeys,
      },
    },
  });

  if (!badges.length) {
    return;
  }

  const existing = await prisma.memberBadge.findMany({
    where: {
      memberId,
      badgeId: {
        in: badges.map((badge) => badge.id),
      },
    },
    select: {
      badgeId: true,
    },
  });

  const existingBadgeIds = new Set(existing.map((item) => item.badgeId));

  const newBadges = badges
    .filter((badge) => !existingBadgeIds.has(badge.id))
    .map((badge) => ({ memberId, badgeId: badge.id }));

  if (newBadges.length) {
    await prisma.memberBadge.createMany({
      data: newBadges,
      skipDuplicates: true,
    });
  }
}
