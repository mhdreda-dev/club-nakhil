import { Role } from "@prisma/client";

import { AppShell } from "@/components/layout/app-shell";
import { getProfileHeader, getProfileSidebarSummary } from "@/features/profiles/profiles.service";
import { requirePageAuth } from "@/lib/page-auth";

const coachNavItems = [
  { href: "/coach/dashboard", label: "Dashboard" },
  { href: "/coach/activity-feed", label: "Activity Feed" },
  { href: "/coach/profile", label: "My Profile" },
  { href: "/coach/sessions", label: "Manage Sessions" },
  { href: "/coach/attendance", label: "Attendance" },
  { href: "/coach/ratings", label: "Coach Ratings" },
  { href: "/coach/members", label: "Members" },
  { href: "/coach/announcements", label: "Announcements" },
];

export default async function CoachLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requirePageAuth(Role.COACH);
  const [profileHeader, sidebarProfileSummary] = await Promise.all([
    getProfileHeader(session.user.id),
    getProfileSidebarSummary(session.user.id),
  ]);

  return (
    <AppShell
      title="Coach Workspace"
      subtitle="Manage sessions, monitor attendance, and guide member development."
      userName={profileHeader?.displayName ?? session.user.name ?? "Coach"}
      avatarUrl={profileHeader?.avatarUrl}
      roleLabel="Coach"
      navItems={coachNavItems}
      sidebarProfileSummary={sidebarProfileSummary}
    >
      {children}
    </AppShell>
  );
}
