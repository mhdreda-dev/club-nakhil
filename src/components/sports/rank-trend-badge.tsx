"use client";

import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

import { useTranslations } from "@/components/providers/translations-provider";
import { cn } from "@/lib/utils";

export type RankTrend = "up" | "down" | "same";

type RankTrendBadgeProps = {
  rankChange: number;
  className?: string;
  compact?: boolean;
};

function getRankTrend(rankChange: number): RankTrend {
  if (rankChange > 0) {
    return "up";
  }

  if (rankChange < 0) {
    return "down";
  }

  return "same";
}

export function RankTrendBadge({ rankChange, className, compact = false }: RankTrendBadgeProps) {
  const trend = getRankTrend(rankChange);
  const { t } = useTranslations();

  if (trend === "up") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-red-300/40 bg-red-500/15 text-red-100",
          compact ? "px-2 py-0.5 text-[11px] font-semibold" : "px-2.5 py-1 text-xs font-bold",
          className,
        )}
      >
        <ArrowUpRight className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {compact
          ? t("sports.rankTrend.compactUp", { count: rankChange })
          : t("sports.rankTrend.up", { count: rankChange })}
      </span>
    );
  }

  if (trend === "down") {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full border border-rose-300/40 bg-rose-500/15 text-rose-100",
          compact ? "px-2 py-0.5 text-[11px] font-semibold" : "px-2.5 py-1 text-xs font-bold",
          className,
        )}
      >
        <ArrowDownRight className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
        {compact
          ? t("sports.rankTrend.compactDown", { count: Math.abs(rankChange) })
          : t("sports.rankTrend.down", { count: Math.abs(rankChange) })}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/5 text-zinc-200",
        compact ? "px-2 py-0.5 text-[11px] font-semibold" : "px-2.5 py-1 text-xs font-bold",
        className,
      )}
    >
      <Minus className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {compact ? t("sports.rankTrend.compactStable") : t("sports.rankTrend.stable")}
    </span>
  );
}
