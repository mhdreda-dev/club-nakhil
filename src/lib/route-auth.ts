import { AccountStatus, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslator } from "@/lib/server-translations";

export async function requireApiAuth(role?: Role) {
  const t = await getServerTranslator();
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return {
      error: NextResponse.json({ message: t("auth.errors.unauthorized") }, { status: 401 }),
    };
  }

  const dbUser = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });

  if (!dbUser) {
    return {
      error: NextResponse.json({ message: t("auth.errors.unauthorized") }, { status: 401 }),
    };
  }

  if (role && dbUser.role !== role) {
    return {
      error: NextResponse.json({ message: t("auth.errors.forbidden") }, { status: 403 }),
    };
  }

  if (dbUser.status !== AccountStatus.ACTIVE) {
    const message =
      dbUser.status === AccountStatus.PENDING
        ? t("auth.errors.pendingApproval")
        : t("auth.errors.accountBlocked");

    return {
      error: NextResponse.json({ message }, { status: 403 }),
    };
  }

  return {
    session: {
      ...session,
      user: {
        ...session.user,
        id: dbUser.id,
        role: dbUser.role,
        status: dbUser.status,
      },
    },
  };
}
