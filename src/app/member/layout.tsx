import { Role } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { getProfileHeader, getProfileSidebarSummary } from "@/features/profiles/profiles.service";
import { requirePageAuth } from "@/lib/page-auth";
import { getServerTranslations } from "@/lib/server-translations";

const getMemberNavItems = (t: Awaited<ReturnType<typeof getServerTranslations>>["t"]) => [
  { href: "/member/dashboard", label: t("nav.dashboard") },
  { href: "/member/activity-feed", label: t("nav.activityFeed") },
  { href: "/member/leaderboard", label: t("nav.leaderboard") },
  { href: "/member/profile", label: t("layout.member.nav.profile") },
  { href: "/member/sessions", label: t("layout.member.nav.sessions") },
  { href: "/member/attendance", label: t("layout.member.nav.attendance") },
  { href: "/member/progress", label: t("layout.member.nav.progress") },
  { href: "/member/rate-coach", label: t("layout.member.nav.rateCoach") },
  { href: "/member/announcements", label: t("nav.announcements") },
];

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageAuth(Role.MEMBER);
  const { t } = await getServerTranslations();
  
  const [profileHeader, sidebarProfileSummary] = await Promise.all([
    getProfileHeader(session.user.id),
    getProfileSidebarSummary(session.user.id),
  ]);

  const navItems = getMemberNavItems(t);

  return (
    <AppShell
      title={t("layout.member.title")}
      subtitle={t("layout.member.subtitle")}
      userName={profileHeader?.displayName ?? session.user.name ?? t("roles.member")}
      avatarUrl={profileHeader?.avatarUrl}
      roleLabel={t("roles.member")}
      navItems={navItems}
      sidebarProfileSummary={sidebarProfileSummary}
    >
      {children}
    </AppShell>
  );
}
