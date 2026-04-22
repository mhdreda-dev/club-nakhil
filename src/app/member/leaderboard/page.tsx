import { Role } from "@prisma/client";
import { Trophy } from "lucide-react";

import { LeaderboardEliteTable } from "@/components/sports/leaderboard-elite-table";
import { LeaderboardPodium } from "@/components/sports/leaderboard-podium";
import { PlayerRatingCard } from "@/components/sports/player-rating-card";
import { RankTrendBadge } from "@/components/sports/rank-trend-badge";
import { SectionHeader } from "@/components/sports/section-header";
import { getMemberLeaderboardSnapshot } from "@/features/leaderboard/leaderboard.service";
import { requirePageAuth } from "@/lib/page-auth";

export const dynamic = "force-dynamic";

export default async function MemberLeaderboardPage() {
  const session = await requirePageAuth(Role.MEMBER);
  const snapshot = await getMemberLeaderboardSnapshot({
    limit: 50,
    currentMemberId: session.user.id,
  });

  const leaderboard = snapshot.leaderboard;
  const topThree = snapshot.topThree;
  const currentMember = snapshot.currentMember;

  const updatedAtLabel = snapshot.leaderboardUpdatedAt
    ? new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(snapshot.leaderboardUpdatedAt))
    : null;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow="Competitive Rankings"
        title="Member Leaderboard"
        subtitle="Placement is computed from real overall rating, points, attendance, and tie-breakers."
        action={
          updatedAtLabel ? (
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-club-muted">
              Updated {updatedAtLabel}
            </span>
          ) : null
        }
      />

      {currentMember ? (
        <PlayerRatingCard
          name={currentMember.name}
          avatarUrl={currentMember.avatarUrl}
          overallRating={currentMember.overallRating}
          rankLabel={`Your Position #${currentMember.currentRank ?? "-"}`}
          trendBadge={<RankTrendBadge rankChange={currentMember.rankChange} />}
          statusText={
            currentMember.rankChange > 0
              ? `You climbed ${currentMember.rankChange} spot(s).`
              : currentMember.rankChange < 0
                ? `You dropped ${Math.abs(currentMember.rankChange)} spot(s).`
                : "Your position is stable."
          }
          highlights={[
            { label: "Points", value: currentMember.totalPoints },
            { label: "Attendance", value: currentMember.attendanceCount },
            { label: "City", value: currentMember.city ?? "N/A" },
            { label: "Trend", value: currentMember.trend.toUpperCase() },
          ]}
        />
      ) : null}

      <LeaderboardPodium
        entries={topThree}
        currentMemberId={session.user.id}
        footer={
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-club-muted">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/35 bg-amber-500/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-100">
              <Trophy className="h-3.5 w-3.5" />
              Podium
            </span>
            <span>Top 3 athletes ranked by real persisted performance data.</span>
          </div>
        }
      />

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-xl uppercase tracking-[0.05em] text-white md:text-2xl">
              Full Ranking
            </h3>
            <p className="mt-1 text-xs text-club-muted">
              All ranked athletes sorted by overall rating and points.
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-red-300/40 bg-red-500/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-red-100">
            <Trophy className="h-3 w-3" />
            {leaderboard.length}{" "}
            {leaderboard.length === 1 ? "Member" : "Members"}
          </span>
        </div>

        <LeaderboardEliteTable
          leaderboard={leaderboard}
          currentMemberId={session.user.id}
        />
      </div>
    </div>
  );
}
