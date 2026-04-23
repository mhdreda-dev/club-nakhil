import { Role } from "@prisma/client";
import { Trophy } from "lucide-react";

import { LeaderboardEliteTable } from "@/components/sports/leaderboard-elite-table";
import { LeaderboardPodium } from "@/components/sports/leaderboard-podium";
import { PlayerRatingCard } from "@/components/sports/player-rating-card";
import { RankTrendBadge } from "@/components/sports/rank-trend-badge";
import { SectionHeader } from "@/components/sports/section-header";
import { getMemberLeaderboardSnapshot } from "@/features/leaderboard/leaderboard.service";
import { requirePageAuth } from "@/lib/page-auth";
import { getServerTranslations } from "@/lib/server-translations";

export const dynamic = "force-dynamic";

export default async function MemberLeaderboardPage() {
  const session = await requirePageAuth(Role.MEMBER);
  const { intlLocale, t } = await getServerTranslations();
  const snapshot = await getMemberLeaderboardSnapshot({
    limit: 50,
    currentMemberId: session.user.id,
  });

  const leaderboard = snapshot.leaderboard;
  const topThree = snapshot.topThree;
  const currentMember = snapshot.currentMember;

  const updatedAtLabel = snapshot.leaderboardUpdatedAt
    ? new Intl.DateTimeFormat(intlLocale, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(snapshot.leaderboardUpdatedAt))
    : null;

  return (
    <div className="space-y-8">
      <SectionHeader
        eyebrow={t("pages.memberLeaderboard.eyebrow")}
        title={t("pages.memberLeaderboard.title")}
        subtitle={t("pages.memberLeaderboard.subtitle")}
        action={
          updatedAtLabel ? (
            <span className="rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-semibold text-club-muted">
              {t("pages.memberLeaderboard.updated", { date: updatedAtLabel })}
            </span>
          ) : null
        }
      />

      {currentMember ? (
        <PlayerRatingCard
          name={currentMember.name}
          avatarUrl={currentMember.avatarUrl}
          overallRating={currentMember.overallRating}
          rankLabel={
            currentMember.overallRating > 0 && currentMember.currentRank
              ? t("pages.memberLeaderboard.position", { rank: currentMember.currentRank })
              : t("pages.memberLeaderboard.notRanked")
          }
          trendBadge={<RankTrendBadge rankChange={currentMember.rankChange} />}
          statusText={
            currentMember.overallRating <= 0
              ? t("pages.memberLeaderboard.status.locked")
              : currentMember.rankChange > 0
              ? t("pages.memberLeaderboard.status.up", { count: currentMember.rankChange })
              : currentMember.rankChange < 0
                ? t("pages.memberLeaderboard.status.down", { count: Math.abs(currentMember.rankChange) })
                : t("pages.memberLeaderboard.status.stable")
          }
          highlights={[
            { label: t("pages.memberLeaderboard.highlights.points"), value: currentMember.totalPoints },
            { label: t("pages.memberLeaderboard.highlights.attendance"), value: currentMember.attendanceCount },
            { label: t("pages.memberLeaderboard.highlights.city"), value: currentMember.city ?? t("pages.memberLeaderboard.highlights.cityFallback") },
            { label: t("pages.memberLeaderboard.highlights.trend"), value: currentMember.trend.toUpperCase() },
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
              {t("pages.memberLeaderboard.podium.label")}
            </span>
            <span>{t("pages.memberLeaderboard.podium.subtitle")}</span>
          </div>
        }
      />

      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-heading text-xl uppercase tracking-[0.05em] text-white md:text-2xl">
              {t("pages.memberLeaderboard.fullRankingTitle")}
            </h3>
            <p className="mt-1 text-xs text-club-muted">
              {t("pages.memberLeaderboard.fullRankingSubtitle")}
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-red-300/40 bg-red-500/12 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-red-100">
            <Trophy className="h-3 w-3" />
            {t("pages.memberLeaderboard.memberCount", { count: leaderboard.length })}
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
