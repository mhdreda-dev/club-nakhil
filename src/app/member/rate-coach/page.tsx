import { Role } from "@prisma/client";
import { Star, UserCheck } from "lucide-react";

import { RateCoachForm } from "@/components/forms/rate-coach-form";
import { Card } from "@/components/ui/card";
import { Tag } from "@/components/ui/tag";
import { formatSessionDate } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

export default async function MemberRateCoachPage() {
  const session = await requirePageAuth(Role.MEMBER);
  const { intlLocale, t } = await getServerTranslations();

  const completedAttendances = await prisma.attendance.findMany({
    where: {
      memberId: session.user.id,
      session: {
        sessionDate: {
          lte: new Date(),
        },
      },
    },
    include: {
      session: {
        include: {
          coach: {
            select: {
              name: true,
            },
          },
          ratings: {
            where: {
              memberId: session.user.id,
            },
          },
        },
      },
    },
    orderBy: {
      checkedInAt: "desc",
    },
  });

  const ratedCount = completedAttendances.filter((a) => a.session.ratings.length > 0).length;

  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl uppercase tracking-[0.05em] text-white">{t("pages.memberRateCoach.title")}</h2>
          <p className="mt-1 text-sm text-club-muted">
            {t("pages.memberRateCoach.subtitle")}
          </p>
        </div>
        {completedAttendances.length > 0 && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-club-muted">
            <Star className="h-3.5 w-3.5" />
            {t("pages.memberRateCoach.count", {
              rated: ratedCount,
              total: completedAttendances.length,
            })}
          </span>
        )}
      </div>

      <div className="mt-5 space-y-4">
        {completedAttendances.length === 0 ? (
          <div className="cn-empty-state">
            <UserCheck className="h-8 w-8 opacity-25" />
            <p>{t("pages.memberRateCoach.empty")}</p>
          </div>
        ) : (
          completedAttendances.map((attendance) => {
            const existingRating = attendance.session.ratings[0];
            const isRated = !!existingRating;

            return (
              <article
                key={attendance.id}
                className="rounded-xl border border-white/8 bg-black/20 p-4 transition duration-200 hover:border-white/[0.13] hover:bg-black/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white">{attendance.session.title}</h3>
                    <p className="mt-0.5 text-xs text-club-muted">
                      {formatSessionDate(attendance.session.sessionDate, intlLocale)} · {t("pages.memberRateCoach.coachPrefix", { name: attendance.session.coach.name })}
                    </p>
                  </div>
                  <Tag
                    label={isRated ? t("pages.memberRateCoach.rated") : t("pages.memberRateCoach.pending")}
                    tone={isRated ? "gold" : "slate"}
                  />
                </div>

                <div className="mt-4 border-t border-white/[0.06] pt-4">
                  <RateCoachForm
                    sessionId={attendance.session.id}
                    defaultScore={existingRating?.score ?? 5}
                    defaultComment={existingRating?.comment}
                  />
                </div>
              </article>
            );
          })
        )}
      </div>
    </Card>
  );
}
