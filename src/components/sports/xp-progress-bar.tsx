"use client";

import { useTranslations } from "@/components/providers/translations-provider";
import { cn } from "@/lib/utils";
import type { TierInfo } from "@/lib/tier";

type XpProgressBarProps = {
  tier: TierInfo;
  rating: number;
  className?: string;
};

export function XpProgressBar({ tier, rating, className }: XpProgressBarProps) {
  const { t } = useTranslations();
  const pointsInTier = rating - tier.min;
  const tierRange = tier.max - tier.min;

  return (
    <div className={cn("space-y-1.5", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "text-[9px] font-black uppercase tracking-[0.25em]",
              tier.badgeText,
            )}
          >
            {t("sports.playerRating.tierLabel", { tier: tier.name })}
          </span>
          <span className="text-[9px] text-white/30">
            {t("sports.xpProgress.current", {
              points: pointsInTier,
              total: tierRange,
            })}
          </span>
        </div>
        {tier.nextTier ? (
          <span className="text-[9px] font-semibold text-white/40">
            {t("sports.xpProgress.nextTier", {
              points: tier.nextThreshold! - rating,
              tier: tier.nextTier,
            })}
          </span>
        ) : (
          <span className="text-[9px] font-black uppercase tracking-[0.18em] text-yellow-300">
            {t("sports.xpProgress.maxTier")}
          </span>
        )}
      </div>
      <div className="relative h-2.5 overflow-hidden rounded-full border border-white/10 bg-black/50">
        <div
          className={cn(
            "absolute inset-y-0 start-0 rounded-full bg-gradient-to-r transition-all duration-700",
            tier.barGradient,
          )}
          style={{ width: `${tier.progress}%` }}
        />
        <div className="pointer-events-none absolute inset-0 cn-shimmer opacity-40" />
      </div>
    </div>
  );
}
