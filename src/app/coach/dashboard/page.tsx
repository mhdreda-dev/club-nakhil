import { AccountStatus, Role } from "@prisma/client";
import { CalendarClock, MessageSquareText, Star, Users } from "lucide-react";
import { subDays } from "date-fns";

import { MetricCard } from "@/components/sports/metric-card";
import { SectionHeader } from "@/components/sports/section-header";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { formatSessionDate } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

export default async function CoachDashboardPage() {
  const session = await requirePageAuth(Role.COACH);
  const { intlLocale, t } = await getServerTranslations();

  const [upcomingSessions, memberCount, weeklyAttendance, ratingStats, recentFeedback] =
    await Promise.all([
      prisma.trainingSession.count({
        where: {
          coachId: session.user.id,
          sessionDate: {
            gte: new Date(),
          },
        },
      }),
      prisma.user.count({
        where: {
          role: Role.MEMBER,
          status: AccountStatus.ACTIVE,
        },
      }),
      prisma.attendance.count({
        where: {
          checkedInAt: {
            gte: subDays(new Date(), 7),
          },
          session: {
            coachId: session.user.id,
          },
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
        take: 5,
      }),
    ]);

  const averageRating = ratingStats._avg.score ?? 0;
  const totalReviews = ratingStats._count.score;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={t("pages.coachDashboard.eyebrow")}
        title={t("pages.coachDashboard.title")}
        subtitle={t("pages.coachDashboard.subtitle")}
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-red-100">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
            {t("pages.coachDashboard.live")}
          </span>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label={t("pages.coachDashboard.upcomingSessions")}
          value={upcomingSessions}
          hint={t("pages.coachDashboard.upcomingSessionsHint")}
          icon={<CalendarClock className="h-5 w-5" />}
          tone="emerald"
        />
        <MetricCard
          label={t("pages.coachDashboard.activeMembers")}
          value={memberCount}
          hint={t("pages.coachDashboard.activeMembersHint")}
          icon={<Users className="h-5 w-5" />}
          tone="sky"
        />
        <MetricCard
          label={t("pages.coachDashboard.attendance")}
          value={weeklyAttendance}
          hint={t("pages.coachDashboard.attendanceHint")}
          icon={<Users className="h-5 w-5" />}
          tone="slate"
        />
        <MetricCard
          label={t("pages.coachDashboard.coachRating")}
          value={averageRating.toFixed(2)}
          hint={t("pages.coachDashboard.coachRatingHint", { count: totalReviews })}
          icon={<Star className="h-5 w-5" />}
          tone="amber"
        />
      </section>

      <Card tone="raised">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl uppercase tracking-[0.06em] text-white">
              {t("pages.coachDashboard.recentFeedbackTitle")}
            </h2>
            <p className="mt-1 text-sm text-club-muted">
              {t("pages.coachDashboard.recentFeedbackSubtitle")}
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-400/12 px-3 py-1.5 text-xs font-semibold text-amber-100">
            <MessageSquareText className="h-3.5 w-3.5" />
            {t("pages.coachDashboard.reviewsBadge", { count: totalReviews })}
          </span>
        </div>

        <div className="mt-5 space-y-3">
          {recentFeedback.length === 0 ? (
            <div className="cn-empty-state">
              <MessageSquareText className="h-8 w-8 opacity-25" />
              <p>{t("pages.coachDashboard.empty")}</p>
            </div>
          ) : (
            recentFeedback.map((feedback) => (
              <article
                key={feedback.id}
                className="group rounded-xl border border-white/10 bg-black/25 p-4 transition hover:-translate-y-0.5 hover:border-red-300/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={feedback.member.name} size="sm" />
                    <div>
                      <p className="font-semibold text-white">
                        {feedback.member.name}
                      </p>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-club-muted">
                        {feedback.session.title} · {formatSessionDate(feedback.session.sessionDate, intlLocale)}
                      </p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-300/40 bg-amber-400/15 px-2.5 py-1 text-xs font-bold text-amber-100">
                    <Star className="h-3.5 w-3.5 fill-amber-200" />
                    {feedback.score}/5
                  </span>
                </div>
                <p className="mt-3 text-sm text-zinc-200">
                  {feedback.comment ?? (
                    <span className="text-club-muted">{t("pages.coachDashboard.noComment")}</span>
                  )}
                </p>
              </article>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
