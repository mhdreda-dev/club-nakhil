import { Role } from "@prisma/client";
import { Megaphone } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatReadableDateTime } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

export default async function MemberAnnouncementsPage() {
  await requirePageAuth(Role.MEMBER);
  const { intlLocale, t } = await getServerTranslations();

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
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl uppercase tracking-[0.05em] text-white">{t("pages.memberAnnouncements.title")}</h2>
          <p className="mt-1 text-sm text-club-muted">{t("pages.memberAnnouncements.subtitle")}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-club-muted">
          <Megaphone className="h-3.5 w-3.5" />
          {t("pages.memberAnnouncements.count", { count: announcements.length })}
        </span>
      </div>

      <div className="mt-5 space-y-3">
        {announcements.length === 0 ? (
            <div className="cn-empty-state">
              <Megaphone className="h-8 w-8 opacity-25" />
              <p>{t("pages.memberAnnouncements.empty")}</p>
            </div>
        ) : (
          announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="group rounded-xl border border-white/8 bg-black/20 p-4 transition duration-200 hover:border-red-300/20 hover:bg-black/30"
            >
              <h3 className="font-semibold text-white">{announcement.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-200">{announcement.content}</p>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-200/80">
                    {t("pages.memberAnnouncements.coachPrefix", { name: announcement.coach.name })}
                  </span>
                  <span className="text-[10px] text-club-muted">{formatReadableDateTime(announcement.createdAt, intlLocale)}</span>
                </div>
            </article>
          ))
        )}
      </div>
    </Card>
  );
}
