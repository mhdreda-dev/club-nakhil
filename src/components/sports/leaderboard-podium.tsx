"use client";

import { Crown, Medal, Star } from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import type { LeaderboardEntry } from "@/features/leaderboard/leaderboard.service";
import { Avatar } from "@/components/ui/avatar";
import { useTranslations } from "@/components/providers/translations-provider";
import { RankTrendBadge } from "@/components/sports/rank-trend-badge";
import { getTierInfo } from "@/lib/tier";
import { cn } from "@/lib/utils";

type LeaderboardPodiumProps = {
  entries: LeaderboardEntry[];
  currentMemberId?: string;
  className?: string;
  footer?: ReactNode;
};

type PodiumTone = "gold" | "silver" | "bronze";

const TONE = {
  gold: {
    label: "Champion",
    cardBg:
      "bg-gradient-to-b from-[#1e1600]/96 via-[#281e00]/92 to-[#0e0a00]/96",
    border: "border-amber-400/50",
    extraShadow: "cn-gold-glow-pulse",
    rankBorder: "border-amber-300/65",
    rankBg:
      "bg-gradient-to-br from-amber-300/35 via-amber-500/22 to-amber-800/28",
    rankText: "text-amber-100",
    rankGlow: "shadow-[0_0_20px_rgba(245,200,101,0.6)]",
    iconColor: "text-amber-300",
    iconGlow: "drop-shadow-[0_0_8px_rgba(245,200,101,0.9)]",
    avatarBorder:
      "border-amber-300/55 shadow-[0_0_0_3px_rgba(245,200,101,0.35),0_0_24px_rgba(245,200,101,0.25)]",
    divider: "border-amber-400/20",
    statLabel: "text-amber-300/65",
    statValue: "text-amber-100",
    platformGradient:
      "bg-gradient-to-r from-amber-500/80 via-amber-300/60 to-amber-600/50",
    height: "md:min-h-[400px]",
    lift: "md:-translate-y-8 md:scale-[1.04] md:z-10",
    avatarSize: "xl" as const,
    nameSize: "text-xl",
  },
  silver: {
    label: "Runner-up",
    cardBg:
      "bg-gradient-to-b from-[#151515]/96 via-[#1c1c1c]/92 to-[#0e0e0e]/96",
    border: "border-zinc-300/38",
    extraShadow: "",
    rankBorder: "border-zinc-300/55",
    rankBg:
      "bg-gradient-to-br from-zinc-200/28 via-zinc-400/18 to-zinc-600/22",
    rankText: "text-zinc-100",
    rankGlow: "shadow-[0_0_14px_rgba(200,210,230,0.45)]",
    iconColor: "text-zinc-200",
    iconGlow: "drop-shadow-[0_0_6px_rgba(200,210,230,0.65)]",
    avatarBorder:
      "border-zinc-300/45 shadow-[0_0_0_3px_rgba(200,210,230,0.22),0_0_18px_rgba(180,195,220,0.18)]",
    divider: "border-zinc-400/18",
    statLabel: "text-zinc-400/65",
    statValue: "text-zinc-100",
    platformGradient:
      "bg-gradient-to-r from-zinc-400/70 via-zinc-200/50 to-zinc-500/45",
    height: "md:min-h-[350px]",
    lift: "",
    avatarSize: "lg" as const,
    nameSize: "text-lg",
  },
  bronze: {
    label: "Third Place",
    cardBg:
      "bg-gradient-to-b from-[#170a00]/96 via-[#1e0f00]/92 to-[#0e0700]/96",
    border: "border-orange-400/32",
    extraShadow: "",
    rankBorder: "border-orange-300/50",
    rankBg:
      "bg-gradient-to-br from-orange-400/28 via-orange-500/18 to-orange-700/22",
    rankText: "text-orange-100",
    rankGlow: "shadow-[0_0_14px_rgba(255,150,60,0.4)]",
    iconColor: "text-orange-200",
    iconGlow: "drop-shadow-[0_0_6px_rgba(255,150,60,0.55)]",
    avatarBorder:
      "border-orange-300/45 shadow-[0_0_0_3px_rgba(255,150,60,0.22),0_0_18px_rgba(255,130,40,0.18)]",
    divider: "border-orange-400/15",
    statLabel: "text-orange-400/65",
    statValue: "text-orange-100",
    platformGradient:
      "bg-gradient-to-r from-orange-500/70 via-orange-400/50 to-orange-600/45",
    height: "md:min-h-[315px]",
    lift: "",
    avatarSize: "lg" as const,
    nameSize: "text-base",
  },
} satisfies Record<PodiumTone, object>;

function toneForIndex(index: number): PodiumTone {
  if (index === 0) return "gold";
  if (index === 1) return "silver";
  return "bronze";
}

export function LeaderboardPodium({
  entries,
  currentMemberId,
  className,
  footer,
}: LeaderboardPodiumProps) {
  const { t } = useTranslations();

  if (entries.length === 0) return null;

  const orderedByPodium = [entries[1], entries[0], entries[2]].filter(
    Boolean,
  ) as LeaderboardEntry[];

  return (
    <section className={cn("space-y-4", className)}>
      <div className="grid gap-4 md:grid-cols-3 md:items-end">
        {orderedByPodium.map((entry, displayIdx) => {
          const originalIndex = entries.findIndex(
            (e) => e.memberId === entry.memberId,
          );
          const tone = toneForIndex(originalIndex);
          const cfg = TONE[tone];
          const isGold = tone === "gold";
          const isCurrentMember = entry.memberId === currentMemberId;
          const memberTier = getTierInfo(entry.overallRating);
          const Icon = isGold ? Crown : Medal;
          const toneLabel =
            tone === "gold"
              ? t("sports.leaderboard.podium.champion")
              : tone === "silver"
                ? t("sports.leaderboard.podium.runnerUp")
                : t("sports.leaderboard.podium.thirdPlace");

          return (
            <article
              key={entry.memberId}
              style={
                {
                  "--cn-stagger-delay": `${displayIdx * 90}ms`,
                } as CSSProperties
              }
              className={cn(
                "cn-feed-stagger relative flex flex-col overflow-hidden rounded-2xl border backdrop-blur-xl",
                "transition-all duration-500 hover:-translate-y-2",
                "shadow-[0_24px_65px_rgba(0,0,0,0.72)]",
                cfg.cardBg,
                cfg.border,
                cfg.height,
                cfg.lift,
                cfg.extraShadow,
                isCurrentMember &&
                  "ring-2 ring-red-400/65 ring-offset-1 ring-offset-transparent",
              )}
            >
              {/* FIFA diagonal card shimmer */}
              <div
                aria-hidden
                className="cn-card-shimmer pointer-events-none absolute inset-0 opacity-55"
              />
              {/* Top specular highlight */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
              />
              {/* Ambient glow for gold */}
              {isGold && (
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-gradient-to-b from-amber-400/10 via-amber-400/4 to-transparent"
                />
              )}

              <div className="relative flex h-full flex-col p-5">
                {/* Header: label badge + rank circle */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.22em]",
                      cfg.rankBorder,
                      cfg.rankBg,
                      cfg.rankText,
                      cfg.rankGlow,
                    )}
                    >
                      <Icon
                        className={cn("h-3.5 w-3.5", cfg.iconColor, cfg.iconGlow)}
                      />
                    {toneLabel}
                  </span>

                  <span
                    className={cn(
                      "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border font-heading text-sm font-black",
                      cfg.rankBorder,
                      cfg.rankBg,
                      cfg.rankText,
                      cfg.rankGlow,
                    )}
                  >
                    #{entry.currentRank}
                  </span>
                </div>

                {/* Avatar + name */}
                <div className="mt-5 flex flex-col items-center gap-3 text-center">
                  <Avatar
                    name={entry.name}
                    avatarUrl={entry.avatarUrl}
                    size={cfg.avatarSize}
                    className={cfg.avatarBorder}
                  />
                  <div>
                    <p
                      className={cn(
                        "font-heading font-black text-white",
                        cfg.nameSize,
                      )}
                    >
                      {entry.name}
                    </p>
                    <p className="mt-0.5 text-xs text-club-muted">
                      {entry.city ?? t("sports.leaderboard.memberFallback")}
                    </p>
                  </div>
                </div>

                {/* Tier + trend + you badges */}
                <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
                  <RankTrendBadge rankChange={entry.rankChange} compact />
                  <span
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em]",
                      memberTier.badgeBg,
                      memberTier.badgeBorder,
                      memberTier.badgeText,
                    )}
                  >
                    <Star className="h-2.5 w-2.5" />
                    {memberTier.name}
                  </span>
                  {isCurrentMember && (
                    <span className="inline-flex rounded-full border border-red-300/45 bg-red-500/15 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.2em] text-red-200">
                      {t("sports.leaderboard.you")}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div
                  className={cn(
                    "mt-auto grid grid-cols-2 gap-2 border-t pt-4",
                    cfg.divider,
                    "mt-4",
                  )}
                >
                  <div className="rounded-xl bg-black/25 px-3 py-3 text-center">
                    <p
                      className={cn(
                        "text-[8px] font-bold uppercase tracking-[0.22em]",
                        cfg.statLabel,
                      )}
                      >
                      {t("sports.leaderboard.stats.rating")}
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-heading font-black",
                        isGold ? "text-3xl" : "text-2xl",
                        cfg.statValue,
                      )}
                    >
                      {entry.overallRating}
                    </p>
                  </div>
                  <div className="rounded-xl bg-black/25 px-3 py-3 text-center">
                    <p
                      className={cn(
                        "text-[8px] font-bold uppercase tracking-[0.22em]",
                        cfg.statLabel,
                      )}
                      >
                      {t("sports.leaderboard.stats.points")}
                    </p>
                    <p
                      className={cn(
                        "mt-1 font-heading font-black",
                        isGold ? "text-3xl" : "text-2xl",
                        cfg.statValue,
                      )}
                    >
                      {entry.totalPoints}
                    </p>
                  </div>
                </div>

                {/* Podium platform bar */}
                <div
                  className={cn(
                    "mt-3 w-full rounded-full opacity-65",
                    isGold ? "h-2" : tone === "silver" ? "h-1.5" : "h-1",
                    cfg.platformGradient,
                  )}
                />
              </div>
            </article>
          );
        })}
      </div>

      {footer ? <div>{footer}</div> : null}
    </section>
  );
}
