import { Role } from "@prisma/client";

import { AnnouncementForm } from "@/components/forms/announcement-form";
import { Card } from "@/components/ui/card";
import { formatReadableDateTime } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function CoachAnnouncementsPage() {
  await requirePageAuth(Role.COACH);

  const announcements = await prisma.announcement.findMany({
    include: {
      coach: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-5">
      <AnnouncementForm />

      <Card>
        <h2 className="font-heading text-2xl uppercase tracking-wide text-white">Recent Announcements</h2>
        <div className="mt-4 space-y-3">
          {announcements.length === 0 ? (
            <p className="text-sm text-club-muted">No announcements yet.</p>
          ) : (
            announcements.map((announcement) => (
              <article key={announcement.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                <h3 className="font-semibold text-white">{announcement.title}</h3>
                <p className="mt-2 text-sm text-zinc-200">{announcement.content}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-club-muted">
                  {announcement.coach.name} • {formatReadableDateTime(announcement.createdAt)}
                </p>
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
