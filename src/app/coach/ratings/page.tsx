import { Role } from "@prisma/client";
import { Star } from "lucide-react";

import { Card } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { formatSessionDate } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

export default async function CoachRatingsPage() {
  const session = await requirePageAuth(Role.COACH);
  const { intlLocale, t } = await getServerTranslations();

  const [ratings, stats] = await Promise.all([
    prisma.rating.findMany({
      where: {
        coachId: session.user.id,
      },
      include: {
        member: {
          select: {
            name: true,
          },
        },
        session: {
          select: {
            title: true,
            sessionDate: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.rating.aggregate({
      where: {
        coachId: session.user.id,
      },
      _avg: {
        score: true,
      },
      _count: {
        score: true,
      },
    }),
  ]);

  const average = stats._avg.score ?? 0;
  const count = stats._count.score;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-2">
        <StatCard
          label={t("pages.coachRatings.averageRating")}
          value={average.toFixed(2)}
          hint={t("pages.coachRatings.averageRatingHint")}
        />
        <StatCard
          label={t("pages.coachRatings.totalReviews")}
          value={count}
          hint={t("pages.coachRatings.totalReviewsHint")}
        />
      </section>

      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl uppercase tracking-[0.05em] text-white">
              {t("pages.coachRatings.title")}
            </h2>
            <p className="mt-1 text-sm text-club-muted">{t("pages.coachRatings.subtitle")}</p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-club-muted">
            <Star className="h-3.5 w-3.5" />
            {t("pages.coachRatings.count", { count: ratings.length })}
          </span>
        </div>
        <div className="mt-5 space-y-3">
          {ratings.length === 0 ? (
            <div className="cn-empty-state">
              <Star className="h-8 w-8 opacity-25" />
              <p>{t("pages.coachRatings.empty")}</p>
            </div>
          ) : (
            ratings.map((rating) => (
              <article
                key={rating.id}
                className="rounded-xl border border-white/8 bg-black/20 p-4 transition duration-200 hover:border-amber-300/25 hover:bg-black/30"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white">{rating.member.name}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-[0.14em] text-club-muted">
                      {rating.session.title} · {formatSessionDate(rating.session.sessionDate, intlLocale)}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/35 bg-amber-400/12 px-2.5 py-1 font-heading text-xs font-bold tracking-[0.08em] text-amber-100">
                    <Star className="h-3 w-3 fill-amber-200" />
                    {rating.score}<span className="text-amber-200/60">/5</span>
                  </span>
                </div>
                {rating.comment ? (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-200">{rating.comment}</p>
                ) : (
                  <p className="mt-3 text-xs italic text-club-muted">{t("pages.coachRatings.noComment")}</p>
                )}
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
