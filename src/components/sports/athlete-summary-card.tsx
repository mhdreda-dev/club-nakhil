"use client";

import { AlertTriangle, Sparkles, Target } from "lucide-react";
import type { ReactNode } from "react";

import { RankTrendBadge } from "@/components/sports/rank-trend-badge";
import { useTranslations } from "@/components/providers/translations-provider";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

type AthleteSummaryCardProps = {
  name: string;
  email: string;
  avatarUrl?: string | null;
  attendanceCount: number;
  points: number;
  badgesCount: number;
  overallRating: number;
  rank: number | null;
  rankChange: number;
  latestNote?: string | null;
  isTopPerformer?: boolean;
  needsAttention?: boolean;
  className?: string;
  children?: ReactNode;
};

export function AthleteSummaryCard({
  name,
  email,
  avatarUrl,
  attendanceCount,
  points,
  badgesCount,
  overallRating,
  rank,
  rankChange,
  latestNote,
  isTopPerformer = false,
  needsAttention = false,
  className,
  children,
}: AthleteSummaryCardProps) {
  const { t } = useTranslations();

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-white/10 bg-club-surface/85 p-5 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition duration-300 hover:-translate-y-1 hover:border-white/20",
        isTopPerformer &&
          "border-amber-300/40 shadow-[0_22px_55px_-18px_rgba(245,200,101,0.45)]",
        needsAttention &&
          "border-rose-300/40 shadow-[0_22px_55px_-18px_rgba(255,107,123,0.4)]",
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br from-white/8 via-transparent to-transparent opacity-90",
          isTopPerformer && "from-amber-500/18",
          needsAttention && "from-rose-500/16",
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />

      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar name={name} avatarUrl={avatarUrl} size="md" className="h-12 w-12" />
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{name}</p>
              <p className="truncate text-xs text-club-muted">{email}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs font-bold text-white">
              {rank ? `#${rank}` : t("sports.athleteSummary.unranked")}
            </span>
            <RankTrendBadge rankChange={rankChange} compact />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-club-muted">
              {t("sports.athleteSummary.stats.rating")}
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-white">
              {overallRating}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-club-muted">
              {t("sports.athleteSummary.stats.points")}
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-white">
              {points}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-club-muted">
              {t("sports.athleteSummary.stats.attendance")}
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-white">
              {attendanceCount}
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/30 p-2.5">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-club-muted">
              {t("sports.athleteSummary.stats.badges")}
            </p>
            <p className="mt-1 font-heading text-xl font-bold text-white">
              {badgesCount}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          {isTopPerformer ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/40 bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-100">
              <Sparkles className="h-3.5 w-3.5" />
              {t("sports.athleteSummary.badges.topPerformer")}
            </span>
          ) : null}
          {needsAttention ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-300/40 bg-rose-500/15 px-2.5 py-1 text-xs font-semibold text-rose-100">
              <AlertTriangle className="h-3.5 w-3.5" />
              {t("sports.athleteSummary.badges.needsAttention")}
            </span>
          ) : null}
          {!isTopPerformer && !needsAttention ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-red-300/30 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-100">
              <Target className="h-3.5 w-3.5" />
              {t("sports.athleteSummary.badges.inProgress")}
            </span>
          ) : null}
        </div>

        <div className="mt-4 rounded-xl border border-white/10 bg-black/30 px-3 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-club-muted">
            {t("sports.athleteSummary.latestCoachNote")}
          </p>
          <p className="mt-1 text-sm text-zinc-200">
            {latestNote ?? t("sports.athleteSummary.emptyNote")}
          </p>
        </div>

        {children ? <div className="mt-4">{children}</div> : null}
      </div>
    </article>
  );
}
