import { Role } from "@prisma/client";
import { redirect } from "next/navigation";

import { requirePageAuth } from "@/lib/page-auth";

export default async function DashboardRouterPage() {
  const session = await requirePageAuth();

  if (session.user.role === Role.ADMIN) {
    redirect("/admin/dashboard");
  }

  if (session.user.role === Role.COACH) {
    redirect("/coach/dashboard");
  }

  redirect("/member/dashboard");
}
