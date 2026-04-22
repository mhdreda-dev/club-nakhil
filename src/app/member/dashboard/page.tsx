import { Role } from "@prisma/client";
import { CalendarDays, Flame, Medal, Sparkles, Star, Trophy } from "lucide-react";

import { MetricCard } from "@/components/sports/metric-card";
import { PlayerRatingCard } from "@/components/sports/player-rating-card";
import { RankTrendBadge } from "@/components/sports/rank-trend-badge";
import { SectionHeader } from "@/components/sports/section-header";
import { Card } from "@/components/ui/card";
import { syncMemberMetrics } from "@/features/profiles/profiles.service";
import { formatSessionDate } from "@/lib/format";
import { requirePageAuth } from "@/lib/page-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function MemberDashboardPage() {
  const session = await requirePageAuth(Role.MEMBER);
  await syncMemberMetrics(session.user.id);

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

  const totalPoints = points._sum.points ?? 0;
  const roundedRating = Math.round(memberProfile?.overallRating ?? 0);
  const rankLabel = memberProfile?.currentRank ? `Current Rank #${memberProfile.currentRank}` : "Not ranked yet";
  const rankChange = memberProfile?.rankChange ?? 0;
  const streak = memberProfile?.currentStreak ?? 0;

  // Derive FIFA-style attribute scores (40–99) from real member data
  const norm = (v: number, cap: number) => Math.min(1, Math.max(0, v / cap));
  const toScore = (ratio: number) => Math.round(40 + ratio * 59);
  const attScore = toScore(norm(attendanceCount, 40));
  const pwrScore = toScore(norm(totalPoints, 120));
  const disScore = toScore(norm(streak, 30));
  const spdScore = memberProfile?.currentRank
    ? Math.max(40, Math.min(99, 99 - (memberProfile.currentRank - 1) * 3))
    : 40;
  const tecScore = Math.min(99, roundedRating + 1);
  const carScore = Math.round(attScore * 0.55 + disScore * 0.45);
  const memberAttributes = [
    { code: "ATT", label: "Attendance", value: attScore },
    { code: "PWR", label: "Power", value: pwrScore },
    { code: "DIS", label: "Discipline", value: disScore },
    { code: "SPD", label: "Speed", value: spdScore },
    { code: "TEC", label: "Technique", value: tecScore },
    { code: "CAR", label: "Cardio", value: carScore },
  ];
  const trendSummary =
    rankChange > 0
      ? `Momentum rising with +${rankChange} rank movement.`
      : rankChange < 0
        ? `Ranking slipped by ${Math.abs(rankChange)}. A strong session can recover quickly.`
        : "Performance is stable. One high-quality session can push you up.";

  const updatedAtLabel = memberProfile?.leaderboardUpdatedAt
    ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(
        memberProfile.leaderboardUpdatedAt,
      )
    : null;

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Athlete Dashboard"
        title="Performance Center"
        subtitle="Track your competitive form across rank, consistency, and coach feedback."
        action={
          updatedAtLabel ? (
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-club-muted">
              Leaderboard updated {updatedAtLabel}
            </span>
          ) : null
        }
      />

      <PlayerRatingCard
        name={session.user.name ?? "Athlete"}
        overallRating={roundedRating}
        rankLabel={rankLabel}
        statusText={trendSummary}
        trendBadge={<RankTrendBadge rankChange={rankChange} />}
        attributes={memberAttributes}
        highlights={[
          { label: "Points", value: totalPoints },
          { label: "Attendance", value: attendanceCount },
          { label: "Streak", value: `${streak}d` },
          { label: "Badges", value: badges.length },
        ]}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          label="Current Rank"
          value={memberProfile?.currentRank ? `#${memberProfile.currentRank}` : "-"}
          hint={memberProfile?.previousRank ? `Previous #${memberProfile.previousRank}` : "First snapshot pending"}
          icon={<Trophy className="h-5 w-5" />}
          badge={<RankTrendBadge rankChange={rankChange} compact />}
          tone="amber"
        />
        <MetricCard
          label="Overall Rating"
          value={roundedRating}
          hint="Weighted from attendance, points, streak, badges, and feedback"
          icon={<Star className="h-5 w-5" />}
          tone="sky"
        />
        <MetricCard
          label="Total Points"
          value={totalPoints}
          hint="Earned through attendance and activity"
          icon={<Sparkles className="h-5 w-5" />}
          tone="emerald"
        />
        <MetricCard
          label="Sessions Attended"
          value={attendanceCount}
          hint="Total attendance history"
          icon={<CalendarDays className="h-5 w-5" />}
          tone="slate"
        />
        <MetricCard
          label="Current Streak"
          value={`${streak}d`}
          hint="Consecutive active training days"
          icon={<Flame className="h-5 w-5" />}
          tone="rose"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-red-500/10 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="font-heading text-2xl uppercase tracking-wide text-white">Upcoming Sessions</h2>
            <p className="mt-1 text-sm text-club-muted">Your next training opportunities and coach assignments.</p>
          </div>
          <div className="mt-4 space-y-3">
            {upcomingSessions.length === 0 ? (
              <div className="cn-empty-state">
                <CalendarDays className="h-7 w-7 opacity-25" />
                <p>No upcoming sessions scheduled right now.</p>
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
                      {trainingSession.trainingType}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-club-muted">
                    {formatSessionDate(trainingSession.sessionDate)} • {trainingSession.startTime} - {trainingSession.endTime}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-red-200/80">Coach {trainingSession.coach.name}</p>
                </article>
              ))
            )}
          </div>
        </Card>

        <Card className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-transparent" />
          <div className="relative">
            <h2 className="font-heading text-2xl uppercase tracking-wide text-white">Recent Progress Notes</h2>
            <p className="mt-1 text-sm text-club-muted">Coach feedback that impacts your next performance jump.</p>
          </div>
          <div className="mt-4 space-y-3">
            {notes.length === 0 ? (
              <div className="cn-empty-state">
                <Sparkles className="h-7 w-7 opacity-25" />
                <p>Your coach has not added notes yet.</p>
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
          <h2 className="font-heading text-2xl uppercase tracking-wide text-white">Performance Summary</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            <div className="rounded-xl border border-white/12 bg-black/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-club-muted">Trend Signal</p>
              <p className="mt-1 text-sm font-semibold text-white">{trendSummary}</p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-club-muted">Session Outlook</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {upcomingSessions.length > 0
                  ? `${upcomingSessions.length} session(s) ahead. Keep attendance streak alive.`
                  : "No sessions booked yet. Check with your coach for the next slot."}
              </p>
            </div>
            <div className="rounded-xl border border-white/12 bg-black/20 px-3 py-2">
              <p className="text-[11px] uppercase tracking-[0.14em] text-club-muted">Badge Progress</p>
              <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-white">
                <Medal className="h-4 w-4 text-amber-200" />
                {badges.length} achievement badge(s) unlocked.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
