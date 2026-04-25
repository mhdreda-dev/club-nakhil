import { Role } from "@prisma/client";
import { CalendarDays, Flame, Medal, Sparkles, Star, Trophy } from "lucide-react";
import { after } from "next/server";

import { MetricCard } from "@/components/sports/metric-card";
import { PlayerRatingCard } from "@/components/sports/player-rating-card";
import { RankTrendBadge } from "@/components/sports/rank-trend-badge";
import { SectionHeader } from "@/components/sports/section-header";
import { Card } from "@/components/ui/card";
import { normalizeMemberProfile } from "@/features/profiles/member-profile";
import { syncMemberMetrics } from "@/features/profiles/profiles.service";
import { formatSessionDate } from "@/lib/format";
import { translateTrainingType } from "@/lib/i18n";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

// Toggle with PERF_TIMINGS=1 in env to print server timings in the dev console
// without polluting production logs.
const PERF_TIMINGS = process.env.PERF_TIMINGS === "1";
function timeStart(label: string) {
  if (PERF_TIMINGS) console.time(label);
}
function timeEnd(label: string) {
  if (PERF_TIMINGS) console.timeEnd(label);
}

export default async function MemberDashboardPage() {
  timeStart("dashboard:total");
  timeStart("dashboard:auth+i18n");
  // requirePageAuth + getServerTranslations are both wrapped in React cache(),
  // so the layout's earlier calls (with the same args) are reused for free.
  const session = await requirePageAuth(Role.MEMBER);
  const { intlLocale, t } = await getServerTranslations();
  timeEnd("dashboard:auth+i18n");

  // Push the per-user metric sync off the critical path. The dashboard reads
  // whatever is currently persisted in MemberProfile; the next request sees
  // freshly synced numbers.
  //
  // The global leaderboard recompute is NOT triggered from here. It runs on a
  // Vercel Cron (POST /api/cron/recompute-leaderboard) and an admin trigger.
  // This page must never open a transaction against the pooled DATABASE_URL
  // (PgBouncer transaction mode does not support interactive transactions).
  after(async () => {
    timeStart("dashboard:after:sync");
    try {
      await syncMemberMetrics(session.user.id);
    } catch (error) {
      // Non-blocking: the dashboard already responded. Log + swallow.
      console.error("[dashboard:after] syncMemberMetrics failed", error);
    } finally {
      timeEnd("dashboard:after:sync");
    }
  });

  timeStart("dashboard:queries");
  const [attendanceCount, points, badges, upcomingSessions, notes, memberProfile] = await Promise.all([
    prisma.attendance.count({
      where: {
        memberId: session.user.id,
      },
    }),
    prisma.pointsLog.aggregate({
      where: {
        memberId: session.user.id,
      },
      _sum: {
        points: true,
      },
    }),
    prisma.memberBadge.findMany({
      where: {
        memberId: session.user.id,
      },
      include: {
        badge: true,
      },
    }),
    prisma.trainingSession.findMany({
      where: {
        sessionDate: {
          gte: new Date(),
        },
      },
      include: {
        coach: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [{ sessionDate: "asc" }, { startTime: "asc" }],
      take: 5,
    }),
    prisma.progressNote.findMany({
      where: {
        memberId: session.user.id,
      },
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
      take: 4,
    }),
    prisma.memberProfile.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        currentRank: true,
        previousRank: true,
        rankChange: true,
        overallRating: true,
        currentStreak: true,
        leaderboardUpdatedAt: true,
      },
    }),
  ]);
  timeEnd("dashboard:queries");

  const safeMemberProfile = normalizeMemberProfile(memberProfile);
  const totalPoints = points._sum.points ?? 0;
  const badgeCount = Math.max(safeMemberProfile.badgeCount, badges.length);
  const roundedRating = Math.round(safeMemberProfile.overallRating);
  const hasTrackedPerformance =
    roundedRating > 0 ||
    attendanceCount > 0 ||
    totalPoints > 0 ||
    safeMemberProfile.currentStreak > 0 ||
    badgeCount > 0;
  const rankLabel =
    hasTrackedPerformance && safeMemberProfile.currentRank
      ? t("pages.memberDashboard.rankLabel", { rank: safeMemberProfile.currentRank })
      : t("pages.memberDashboard.notRanked");
  const rankChange = hasTrackedPerformance ? safeMemberProfile.rankChange : 0;
  const streak = safeMemberProfile.currentStreak;

  // Derive FIFA-style attribute scores (40–99) from real member data
  const norm = (v: number, cap: number) => Math.min(1, Math.max(0, v / cap));
  const toScore = (ratio: number) => (ratio <= 0 ? 0 : Math.round(40 + ratio * 59));
  const attScore = toScore(norm(attendanceCount, 40));
  const pwrScore = toScore(norm(totalPoints, 120));
  const disScore = toScore(norm(streak, 30));
  const spdScore =
    hasTrackedPerformance && safeMemberProfile.currentRank
      ? Math.max(40, Math.min(99, 99 - (safeMemberProfile.currentRank - 1) * 3))
      : 0;
  const tecScore = roundedRating > 0 ? Math.min(99, roundedRating + 1) : 0;
  const carScore = hasTrackedPerformance ? Math.round(attScore * 0.55 + disScore * 0.45) : 0;
  const memberAttributes = [
    { code: "ATT", label: t("pages.memberDashboard.attributes.attendance"), value: attScore },
    { code: "PWR", label: t("pages.memberDashboard.attributes.power"), value: pwrScore },
    { code: "DIS", label: t("pages.memberDashboard.attributes.discipline"), value: disScore },
    { code: "SPD", label: t("pages.memberDashboard.attributes.speed"), value: spdScore },
    { code: "TEC", label: t("pages.memberDashboard.attributes.technique"), value: tecScore },
    { code: "CAR", label: t("pages.memberDashboard.attributes.cardio"), value: carScore },
  ];
  const trendSummary =
    !hasTrackedPerformance
      ? t("pages.memberDashboard.trend.locked")
      : rankChange > 0
      ? t("pages.memberDashboard.trend.up", { count: rankChange })
      : rankChange < 0
        ? t("pages.memberDashboard.trend.down", { count: Math.abs(rankChange) })
        : t("pages.memberDashboard.trend.stable");

  const updatedAtLabel = hasTrackedPerformance && memberProfile?.leaderboardUpdatedAt
    ? new Intl.DateTimeFormat(intlLocale, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(
        memberProfile.leaderboardUpdatedAt,
      )
    : null;

  timeEnd("dashboard:total");

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={t("pages.memberDashboard.eyebrow")}
        title={t("pages.memberDashboard.title")}
        subtitle={t("pages.memberDashboard.subtitle")}
        action={
          updatedAtLabel ? (
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-club-muted">
              {t("pages.memberDashboard.leaderboardUpdated", { date: updatedAtLabel })}
            </span>
          ) : null
        }
      />

      <PlayerRatingCard
        name={session.user.name ?? t("pages.memberDashboard.athleteFallback")}
        overallRating={roundedRating}
        rankLabel={rankLabel}
        statusText={trendSummary}
        trendBadge={<RankTrendBadge rankChange={rankChange} />}
        attributes={memberAttributes}
        highlights={[
          { label: t("pages.memberDashboard.highlights.points"), value: totalPoints },
          { label: t("pages.memberDashboard.highlights.attendance"), value: attendanceCount },
          { label: t("pages.memberDashboard.highlights.streak"), value: `${streak}d` },
          { label: t("pages.memberDashboard.highlights.badges"), value: badgeCount },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label={t("pages.memberDashboard.metric.currentRank")}
          value={hasTrackedPerformance && safeMemberProfile.currentRank ? `#${safeMemberProfile.currentRank}` : "-"}
          hint={
            hasTrackedPerformance && safeMemberProfile.previousRank
              ? t("pages.memberDashboard.metric.previousRank", { rank: safeMemberProfile.previousRank })
              : t("pages.memberDashboard.metric.currentRankHint")
          }
          icon={<Trophy className="h-5 w-5" />}
          badge={<RankTrendBadge rankChange={rankChange} compact />}
          tone="amber"
        />
        <MetricCard
          label={t("pages.memberDashboard.metric.overallRating")}
          value={roundedRating}
          hint={t("pages.memberDashboard.metric.overallRatingHint")}
          icon={<Star className="h-5 w-5" />}
          tone="sky"
        />
        <MetricCard
          label={t("pages.memberDashboard.metric.totalPoints")}
          value={totalPoints}
          hint={t("pages.memberDashboard.metric.totalPointsHint")}
          icon={<Sparkles className="h-5 w-5" />}
          tone="emerald"
        />
        <MetricCard
          label={t("pages.memberDashboard.metric.sessionsAttended")}
          value={attendanceCount}
          hint={t("pages.memberDashboard.metric.sessionsAttendedHint")}
          icon={<CalendarDays className="h-5 w-5" />}
          tone="slate"
        />
        <MetricCard
          label={t("pages.memberDashboard.metric.currentStreak")}
          value={`${streak}d`}
          hint={t("pages.memberDashboard.metric.currentStreakHint")}
          icon={<Flame className="h-5 w-5" />}
          tone="rose"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="font-heading text-2xl uppercase tracking-wide text-white">{t("pages.memberDashboard.upcomingSessionsTitle")}</h2>
            <p className="mt-1 text-sm text-club-muted">{t("pages.memberDashboard.upcomingSessionsSubtitle")}</p>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingSessions.length === 0 ? (
              <div className="cn-empty-state">
                <CalendarDays className="h-7 w-7 opacity-25" />
                <p>{t("pages.memberDashboard.upcomingSessionsEmpty")}</p>
              </div>
            ) : (
              upcomingSessions.map((trainingSession) => (
                <article
                  key={trainingSession.id}
                  className="group rounded-xl border border-white/10 bg-black/20 p-3 transition hover:-translate-y-0.5 hover:border-red-300/30 hover:bg-black/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-semibold text-white">{trainingSession.title}</h3>
                    <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-xs font-semibold text-zinc-100">
                      {translateTrainingType(t, trainingSession.trainingType)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-club-muted">
                    {formatSessionDate(trainingSession.sessionDate, intlLocale)} • {trainingSession.startTime} - {trainingSession.endTime}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-red-200/80">
                    {t("pages.memberDashboard.coachPrefix", { name: trainingSession.coach.name })}
                  </p>
                </article>
              ))
            )}
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="font-heading text-2xl uppercase tracking-wide text-white">{t("pages.memberDashboard.recentNotesTitle")}</h2>
            <p className="mt-1 text-sm text-club-muted">{t("pages.memberDashboard.recentNotesSubtitle")}</p>
          </div>
          <div className="mt-4 space-y-3">
            {notes.length === 0 ? (
              <div className="cn-empty-state">
                <Sparkles className="h-7 w-7 opacity-25" />
                <p>{t("pages.memberDashboard.recentNotesEmpty")}</p>
              </div>
            ) : (
              notes.map((note) => (
                <article key={note.id} className="rounded-xl border border-white/10 bg-black/20 p-3">
                  <p className="text-sm text-zinc-200">{note.note}</p>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-club-muted">{note.coach.name}</p>
                </article>
              ))
            )}
          </div>
        </Card>
      </section>

      <Card className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-transparent" />
        <div className="relative">
          <h2 className="font-heading text-2xl uppercase tracking-wide text-white">{t("pages.memberDashboard.summaryTitle")}</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/12 bg-black/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-club-muted">{t("pages.memberDashboard.summaryLabels.trendSignal")}</p>
              <p className="mt-1 text-sm font-semibold text-white">{trendSummary}</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-club-muted">{t("pages.memberDashboard.summaryLabels.sessionOutlook")}</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {upcomingSessions.length > 0
                  ? t("pages.memberDashboard.sessionOutlookBooked", { count: upcomingSessions.length })
                  : t("pages.memberDashboard.sessionOutlookEmpty")}
              </p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-club-muted">{t("pages.memberDashboard.summaryLabels.badgeProgress")}</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-white">
                <Medal className="h-4 w-4 text-amber-200" />
                {t("pages.memberProfile.badgesEarned", { count: badges.length })}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
