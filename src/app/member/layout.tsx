import { Role } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { getProfileHeader, getProfileSidebarSummary } from "@/features/profiles/profiles.service";
import { requirePageAuth } from "@/lib/page-auth";

const memberNavItems = [
  { href: "/member/dashboard", label: "Dashboard" },
  { href: "/member/activity-feed", label: "Activity Feed" },
  { href: "/member/leaderboard", label: "Leaderboard" },
  { href: "/member/profile", label: "My Profile" },
  { href: "/member/sessions", label: "My Sessions" },
  { href: "/member/attendance", label: "My Attendance" },
  { href: "/member/progress", label: "My Progress" },
  { href: "/member/rate-coach", label: "Rate Coach" },
  { href: "/member/announcements", label: "Announcements" },
];

export default async function MemberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageAuth(Role.MEMBER);
  const [profileHeader, sidebarProfileSummary] = await Promise.all([
    getProfileHeader(session.user.id),
    getProfileSidebarSummary(session.user.id),
  ]);

  return (
    <AppShell
      title="Member Workspace"
      subtitle="Track your sessions, progress, and performance milestones."
      userName={profileHeader?.displayName ?? session.user.name ?? "Member"}
      avatarUrl={profileHeader?.avatarUrl}
      roleLabel="Member"
      navItems={memberNavItems}
      sidebarProfileSummary={sidebarProfileSummary}
    >
      {children}
    </AppShell>
  );
}
