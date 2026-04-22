import { Role } from "@prisma/client";

import { ActivityFeedBoard } from "@/features/activity-feed/components/activity-feed-board";
import { getProfileHeader } from "@/features/profiles/profiles.service";
import { requirePageAuth } from "@/lib/page-auth";

export default async function AdminActivityFeedPage() {
  const session = await requirePageAuth(Role.ADMIN);
  const profileHeader = await getProfileHeader(session.user.id);

  return (
    <ActivityFeedBoard
      viewerRole={session.user.role}
      userName={profileHeader?.displayName ?? session.user.name ?? "Admin"}
      userAvatar={profileHeader?.avatarUrl ?? null}
    />
  );
}
