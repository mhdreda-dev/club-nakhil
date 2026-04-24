import { AccountStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getDashboardPathByRole } from "@/lib/dashboard-path";
import { getAuthSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

export async function requirePageAuth(expectedRole?: Role) {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
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
    redirect("/login");
  }

  if (dbUser.status === AccountStatus.PENDING) {
    redirect("/pending-approval");
  }

  if (dbUser.status === AccountStatus.BLOCKED) {
    redirect("/login?error=blocked");
  }

  if (expectedRole && dbUser.role !== expectedRole) {
    redirect(getDashboardPathByRole(dbUser.role));
  }

  return {
    ...session,
    user: {
      ...session.user,
      id: dbUser.id,
      role: dbUser.role,
      status: dbUser.status,
    },
  };
}
