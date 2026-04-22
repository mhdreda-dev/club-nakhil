import { AccountStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

function dashboardPathByRole(role: Role) {
  if (role === Role.ADMIN) {
    return "/admin/dashboard";
  }

  if (role === Role.COACH) {
    return "/coach/dashboard";
  }

  return "/member/dashboard";
}

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
    redirect(dashboardPathByRole(dbUser.role));
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
