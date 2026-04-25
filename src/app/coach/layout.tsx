import { Role } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { requirePageAuth } from "@/lib/page-auth";
import { getServerTranslations } from "@/lib/server-translations";

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageAuth(Role.COACH);
  const { t } = await getServerTranslations();

  // `priority: true` opts the link into mount-time prefetch. Everything else
  // is hover/focus-warmed inside SidebarNav so we don't fan out parallel
  // prefetches on the coach dashboard load.
  const coachNavItems = [
    { href: "/coach/dashboard", label: t("nav.dashboard") },
    { href: "/coach/members", label: t("nav.members") },
    { href: "/coach/sessions", label: t("nav.sessions") },
    { href: "/coach/attendance", label: t("nav.attendance"), priority: true },
    { href: "/coach/announcements", label: t("nav.announcements") },
    { href: "/coach/ratings", label: t("nav.ratings") },
    { href: "/coach/activity-feed", label: t("nav.activityFeed") },
    { href: "/coach/profile", label: t("nav.profile") },
  ];

  return (
    <AppShell
      title={t("layout.coach.title")}
      subtitle={t("layout.coach.subtitle")}
      userName={session.user.name ?? t("roles.coach")}
      avatarUrl={null}
      roleLabel={t("roles.coach")}
      navItems={coachNavItems}
      sidebarProfileSummary={null}
    >
      {children}
    </AppShell>
  );
}
