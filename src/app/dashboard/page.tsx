import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { getDashboardPathByRole } from "@/lib/dashboard-path";
import { requirePageAuth } from "@/lib/page-auth";

export default async function DashboardRouterPage() {
  const session = await requirePageAuth();
  redirect(getDashboardPathByRole(session.user.role as Role));
}
