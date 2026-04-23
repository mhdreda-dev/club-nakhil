import { Role } from "@prisma/client";
import { CalendarCheck2 } from "lucide-react";

import { AttendanceScanner } from "@/components/attendance/attendance-scanner";
import { Card } from "@/components/ui/card";
import { formatReadableDateTime, formatSessionDate } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

export default async function MemberAttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await requirePageAuth(Role.MEMBER);
  const { intlLocale, t } = await getServerTranslations();
  const { token } = await searchParams;

  const attendance = await prisma.attendance.findMany({
    where: {
      memberId: session.user.id,
    },
    include: {
      session: {
        include: {
          coach: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: {
      checkedInAt: "desc",
    },
  });

  return (
    <div className="space-y-5">
      <AttendanceScanner initialToken={token} />

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl uppercase tracking-[0.05em] text-white">{t("pages.memberAttendance.title")}</h2>
          <p className="mt-1 text-sm text-club-muted">{t("pages.memberAttendance.subtitle")}</p>
        </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-red-100">
          <CalendarCheck2 className="h-3.5 w-3.5" />
          {t("pages.memberAttendance.count", { count: attendance.length })}
          </span>
        </div>

        <div className="mt-5 space-y-2.5">
          {attendance.length === 0 ? (
            <div className="cn-empty-state">
              <CalendarCheck2 className="h-8 w-8 opacity-25" />
              <p>{t("pages.memberAttendance.empty")}</p>
            </div>
          ) : (
            attendance.map((item) => (
              <article
                key={item.id}
                className="group flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-black/20 px-4 py-3.5 transition duration-200 hover:border-red-300/25 hover:bg-black/30"
              >
                <div className="min-w-0">
                  <h3 className="truncate font-semibold text-white">{item.session.title}</h3>
                  <p className="mt-0.5 text-xs text-club-muted">
                    {formatSessionDate(item.session.sessionDate, intlLocale)} · {item.session.startTime}–{item.session.endTime}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-red-200/80">
                    {t("pages.memberAttendance.coachPrefix", { name: item.session.coach.name })}
                  </p>
                  <p className="mt-0.5 text-[10px] text-club-muted">
                    {formatReadableDateTime(item.checkedInAt, intlLocale)}
                  </p>
                </div>
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
