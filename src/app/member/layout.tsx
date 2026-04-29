import { Role } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { getProfileHeader, getProfileSidebarSummary } from "@/features/profiles/profiles.service";
import { requirePageAuth } from "@/lib/page-auth";
import { getServerTranslations } from "@/lib/server-translations";

// Concurrent renders on the same Lambda would share static console.time
// labels and produce "No such label" warnings + nonsense durations. Each
// render gets a short unique tag so its timers stay isolated.
const _PERF = process.env.PERF_TIMINGS === "1";
function makeLayoutTimer() {
  const tag = Math.random().toString(16).slice(2, 8);
  return {
    start: (label: string) => {
      if (_PERF) console.time(`[layout] ${label}#${tag}`);
    },
    end: (label: string) => {
      if (_PERF) console.timeEnd(`[layout] ${label}#${tag}`);
    },
  };
}

// `priority: true` makes the link prefetch on mount. Only the single most
// likely "next click" gets this flag so the sidebar doesn't fire 9 parallel
// prefetches on page load. All other links prefetch on hover/focus.
const getMemberNavItems = (t: Awaited<ReturnType<typeof getServerTranslations>>["t"]) => [
  { href: "/member/dashboard", label: t("nav.dashboard") },
  { href: "/member/activity-feed", label: t("nav.activityFeed"), priority: true },
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
  const lt = makeLayoutTimer();
  lt.start("total");

  lt.start("auth");
  const session = await requirePageAuth(Role.MEMBER);
  lt.end("auth");

  lt.start("i18n");
  const { t } = await getServerTranslations();
  lt.end("i18n");

  lt.start("profiles");
  const [profileHeader, sidebarProfileSummary] = await Promise.all([
    getProfileHeader(session.user.id),
    getProfileSidebarSummary(session.user.id),
  ]);
  lt.end("profiles");

  const navItems = getMemberNavItems(t);

  lt.end("total");

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
