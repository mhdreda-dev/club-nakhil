import { Role, AccountStatus } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslations } from "@/lib/server-translations";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageAuth(Role.ADMIN);
  const { t } = await getServerTranslations();
  
  const pendingCount = await prisma.user.count({
    where: {
      role: Role.MEMBER,
      status: AccountStatus.PENDING,
    },
  });

  // Only the members page prefetches on mount — admins spend most of their
  // time approving pending sign-ups, so that's the hot path. Other links
  // warm up on hover/focus inside SidebarNav.
  const adminNavItems = [
    { href: "/admin/dashboard", label: t("nav.dashboard") },
    { href: "/admin/activity-feed", label: t("nav.activityFeed") },
    {
      href: "/admin/members",
      label: t("nav.members"),
      badgeCount: pendingCount,
      priority: true,
    },
  ];

  return (
    <AppShell
      title={t("layout.admin.title")}
      subtitle={t("layout.admin.subtitle")}
      userName={session.user.name ?? t("roles.admin")}
      avatarUrl={null}
      roleLabel={t("roles.admin")}
      navItems={adminNavItems}
      sidebarProfileSummary={null}
    >
      {children}
    </AppShell>
  );
}
