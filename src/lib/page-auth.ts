import { cache } from "react";

import { AccountStatus, Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getDashboardPathByRole } from "@/lib/dashboard-path";
import { getAuthSession } from "@/lib/get-session";
import { prisma } from "@/lib/prisma";

// Per-request memoized DB lookup. Both the route layout and the page typically
// call requirePageAuth(); without dedupe that's two `User` lookups per render.
const fetchDbUser = cache(async (userId: string) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });
});

// Memoized end-to-end so even the redirect logic only runs once per request.
export const requirePageAuth = cache(async (expectedRole?: Role) => {
  const session = await getAuthSession();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const dbUser = await fetchDbUser(session.user.id);

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
});
