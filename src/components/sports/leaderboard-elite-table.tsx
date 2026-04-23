"use client";

import {
  ArrowDownRight,
  ArrowUpRight,
  CalendarDays,
  Clock,
  Infinity,
  Minus,
  Star,
  Trophy,
} from "lucide-react";
import { useState, type CSSProperties } from "react";

import type { LeaderboardEntry } from "@/features/leaderboard/leaderboard.service";
import { useTranslations } from "@/components/providers/translations-provider";
import { Avatar } from "@/components/ui/avatar";
import type { MessageKey } from "@/lib/i18n";
import { getTierInfo } from "@/lib/tier";
import { cn } from "@/lib/utils";

type FilterPeriod = "week" | "month" | "all";

type LeaderboardEliteTableProps = {
  leaderboard: LeaderboardEntry[];
  currentMemberId?: string;
};

const FILTERS: { key: FilterPeriod; labelKey: MessageKey; icon: typeof Clock }[] = [
  { key: "week", labelKey: "sports.leaderboard.filters.week", icon: Clock },
  { key: "month", labelKey: "sports.leaderboard.filters.month", icon: CalendarDays },
  { key: "all", labelKey: "sports.leaderboard.filters.all", icon: Infinity },
];

function RankBadge({ rank }: { rank: number | null }) {
  const r = rank ?? 999;

  if (r === 1) {
    return (
      <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-amber-400/25 blur-sm" />
        <span className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-amber-300/65 bg-gradient-to-br from-amber-300/35 via-amber-500/22 to-amber-800/28 font-heading text-sm font-black text-amber-100 shadow-[0_0_18px_rgba(245,200,101,0.55)]">
          1
        </span>
      </div>
    );
  }

  if (r === 2) {
    return (
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-300/55 bg-gradient-to-br from-zinc-200/28 via-zinc-400/18 to-zinc-600/22 font-heading text-sm font-black text-zinc-100 shadow-[0_0_12px_rgba(200,210,230,0.4)]">
        2
      </span>
    );
  }

  if (r === 3) {
    return (
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-orange-300/50 bg-gradient-to-br from-orange-400/28 via-orange-500/18 to-orange-700/22 font-heading text-sm font-black text-orange-100 shadow-[0_0_12px_rgba(255,150,60,0.38)]">
        3
      </span>
    );
  }

  if (r <= 10) {
    return (
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-cyan-300/25 bg-cyan-500/10 font-heading text-sm font-bold text-cyan-200">
        {r}
      </span>
    );
  }

  return (
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/30 font-heading text-sm font-semibold text-club-muted">
      {r}
    </span>
  );
}

function TrendChip({ rankChange }: { rankChange: number }) {
  if (rankChange > 0) {
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-emerald-400/35 bg-emerald-500/12 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
        <ArrowUpRight className="h-3 w-3" />+{rankChange}
      </span>
    );
  }

  if (rankChange < 0) {
    return (
      <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-rose-400/35 bg-rose-500/12 px-2 py-0.5 text-[10px] font-bold text-rose-300">
        <ArrowDownRight className="h-3 w-3" />
        {Math.abs(rankChange)}
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-white/12 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-club-muted">
      <Minus className="h-3 w-3" />–
    </span>
  );
}

export function LeaderboardEliteTable({
  leaderboard,
  currentMemberId,
}: LeaderboardEliteTableProps) {
  const { t } = useTranslations();
  const [filter, setFilter] = useState<FilterPeriod>("all");

  if (leaderboard.length === 0) {
    return (
      <div className="cn-empty-state py-16">
        <Trophy className="h-10 w-10 opacity-20" />
        <p className="font-heading text-sm uppercase tracking-[0.15em]">
          {t("sports.leaderboard.empty.title")}
        </p>
        <p className="text-xs text-club-muted-soft">
          {t("sports.leaderboard.empty.subtitle")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const Icon = f.icon;
          const isActive = filter === f.key;
          return (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              aria-pressed={isActive}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] transition-all duration-200",
                "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400",
                isActive
                  ? "border-red-400/50 bg-red-500/15 text-red-100 shadow-[0_0_16px_rgba(220,38,38,0.22)]"
                  : "border-white/12 bg-white/[0.03] text-club-muted hover:border-white/20 hover:bg-white/[0.05] hover:text-club-text-soft",
              )}
            >
              <Icon className="h-3 w-3" />
              {t(f.labelKey)}
            </button>
          );
        })}

        {filter !== "all" && (
          <span className="ms-auto text-[10px] italic text-club-muted-soft">
            {t("sports.leaderboard.filters.allTimeNote")}
          </span>
        )}
      </div>

      {/* Rankings container */}
      <div className="overflow-hidden rounded-2xl border border-white/8 bg-club-surface/80 shadow-[0_22px_60px_rgba(0,0,0,0.45)] backdrop-blur-md">
        {/* Column header */}
        <div className="border-b border-white/8 px-4 py-3">
          <div className="flex items-center gap-3 text-[9px] font-black uppercase tracking-[0.22em] text-club-muted">
            <span className="w-10 shrink-0 text-center">{t("sports.leaderboard.columns.rank")}</span>
            <span className="w-14 shrink-0 text-center">{t("sports.leaderboard.columns.move")}</span>
            <span className="flex-1">{t("sports.leaderboard.columns.athlete")}</span>
            <span className="hidden shrink-0 w-16 text-right md:block">
              {t("sports.leaderboard.columns.tier")}
            </span>
            <span className="shrink-0 w-10 text-right">{t("sports.leaderboard.columns.ovr")}</span>
            <span className="shrink-0 w-12 text-right">{t("sports.leaderboard.columns.pts")}</span>
          </div>
        </div>

        {/* Rows */}
        <div
          role="list"
          aria-label="Leaderboard rankings"
          className="divide-y divide-white/[0.045]"
        >
          {leaderboard.map((entry, idx) => {
            const isCurrentMember = entry.memberId === currentMemberId;
            const rank = entry.currentRank ?? 999;
            const isTop3 = rank <= 3;
            const memberTier = getTierInfo(entry.overallRating);

            return (
              <div
                key={entry.memberId}
                role="listitem"
                tabIndex={0}
                style={
                  {
                    "--cn-stagger-delay": `${Math.min(idx * 25, 700)}ms`,
                  } as CSSProperties
                }
                className={cn(
                  "cn-feed-stagger group relative flex items-center gap-3 px-4 py-3.5",
                  "transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-red-400/50",
                  isCurrentMember
                    ? "border-l-2 border-red-500/70 bg-gradient-to-r from-red-500/14 via-red-400/7 to-transparent"
                    : isTop3
                      ? "border-l-2 border-amber-400/50 bg-gradient-to-r from-amber-400/10 via-amber-400/5 to-transparent"
                      : "border-l-2 border-transparent hover:border-white/14 hover:bg-white/[0.025]",
                )}
              >
                {/* Rank */}
                <div className="flex w-10 shrink-0 justify-center">
                  <RankBadge rank={entry.currentRank} />
                </div>

                {/* Trend */}
                <div className="flex w-14 shrink-0 justify-center">
                  <TrendChip rankChange={entry.rankChange} />
                </div>

                {/* Athlete info */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar
                    name={entry.name}
                    avatarUrl={entry.avatarUrl}
                    size="sm"
                    className={cn(
                      "shrink-0",
                      isTop3 &&
                        "border-amber-300/40 shadow-[0_0_0_2px_rgba(245,200,101,0.2)]",
                      isCurrentMember &&
                        "border-red-300/50 shadow-[0_0_0_2px_rgba(220,38,38,0.25)]",
                    )}
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="truncate font-semibold text-white">
                        {entry.name}
                      </span>
                      {isCurrentMember && (
                        <span className="inline-flex shrink-0 rounded-full border border-red-300/45 bg-red-500/15 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.2em] text-red-200">
                          {t("sports.leaderboard.you")}
                        </span>
                      )}
                    </div>
                    <p className="truncate text-[11px] text-club-muted">
                      {entry.city ?? t("sports.leaderboard.memberFallback")}
                    </p>
                  </div>
                </div>

                {/* Tier badge — desktop only */}
                <div className="hidden w-16 shrink-0 justify-end md:flex">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.18em]",
                      memberTier.badgeBg,
                      memberTier.badgeBorder,
                      memberTier.badgeText,
                    )}
                  >
                    <Star className="h-2 w-2" />
                    {memberTier.name}
                  </span>
                </div>

                {/* OVR */}
                <div className="flex w-10 shrink-0 justify-end">
                  <span className="inline-flex min-w-[2.25rem] items-center justify-center rounded-lg border border-cyan-300/30 bg-cyan-500/10 px-1.5 py-1 font-heading text-sm font-black text-cyan-100 shadow-[0_0_10px_rgba(90,216,255,0.18)]">
                    {entry.overallRating}
                  </span>
                </div>

                {/* Points */}
                <div className="flex w-12 shrink-0 justify-end">
                  <span className="font-heading text-base font-black text-red-200">
                    {entry.totalPoints}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
