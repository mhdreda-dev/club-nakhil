import { AccountStatus, Role } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageAuth(Role.ADMIN);
  const pendingCount = await prisma.user.count({
    where: {
      role: Role.MEMBER,
      status: AccountStatus.PENDING,
    },
  });

  const adminNavItems = [
    { href: "/admin/dashboard", label: "Dashboard" },
    { href: "/admin/activity-feed", label: "Activity Feed" },
    {
      href: "/admin/members",
      label: pendingCount > 0 ? `Members (${pendingCount})` : "Members",
      badgeCount: pendingCount,
    },
  ];

  return (
    <AppShell
      title="Admin Command Center"
      subtitle="Approve member registrations, manage account status, and keep the roster clean."
      userName={session.user.name ?? "Admin"}
      roleLabel="Admin"
      navItems={adminNavItems}
      sidebarProfileSummary={null}
    >
      {children}
    </AppShell>
  );
}
