import { Flame, ShieldCheck, Star } from "lucide-react";
import type { ReactNode } from "react";

import { AttributeGrid, type Attribute } from "@/components/sports/attribute-grid";
import { XpProgressBar } from "@/components/sports/xp-progress-bar";
import { Avatar } from "@/components/ui/avatar";
import { getTierInfo } from "@/lib/tier";
import { cn } from "@/lib/utils";

type PlayerRatingCardProps = {
  name: string;
  avatarUrl?: string | null;
  overallRating: number;
  rankLabel: string;
  statusText?: string;
  trendBadge?: ReactNode;
  highlights?: Array<{ label: string; value: string | number }>;
  attributes?: Attribute[];
  className?: string;
};

export function PlayerRatingCard({
  name,
  avatarUrl,
  overallRating,
  rankLabel,
  statusText,
  trendBadge,
  highlights = [],
  attributes,
  className,
}: PlayerRatingCardProps) {
  const tier = getTierInfo(overallRating);
  const firstName = name.split(" ")[0] ?? name;

  return (
    <section
      className={cn(
        "cn-glow-border relative overflow-hidden rounded-3xl border-2 p-6 shadow-[0_32px_90px_rgba(0,0,0,0.6)]",
        tier.cardBorder,
        tier.cardShadow,
        className,
      )}
    >
      {/* Tier-keyed background */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br",
          tier.cardGradient,
        )}
      />
      {/* Ambient radials */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/5 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-20 bottom-0 h-56 w-56 rounded-full bg-black/20 blur-3xl"
      />
      {/* Subtle grid */}
      <div aria-hidden className="pointer-events-none absolute inset-0 cn-grid-bg opacity-15" />
      {/* Top edge highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent"
      />

      <div className="relative grid gap-6 lg:grid-cols-[1fr_auto] lg:items-start">
        {/* ═══ LEFT: Identity + Attributes + XP ═══ */}
        <div className="space-y-5">
          {/* Tier badge row */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/75">
              <ShieldCheck className="h-3.5 w-3.5" />
              Athlete Profile
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]",
                tier.badgeBg,
                tier.badgeBorder,
                tier.badgeText,
              )}
            >
              <Star className="h-3 w-3" />
              {tier.name} Tier
            </span>
          </div>

          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div
              className={cn(
                "shrink-0 rounded-full p-[3px] bg-gradient-to-br",
                tier.barGradient,
              )}
            >
              <Avatar
                name={name}
                avatarUrl={avatarUrl}
                size="xl"
                className="h-[88px] w-[88px] border-0"
                ring={false}
              />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">
                Welcome Back
              </p>
              <h1 className="mt-0.5 font-heading text-4xl uppercase leading-[1.05] tracking-[0.04em] text-white md:text-5xl">
                {name}
              </h1>
            </div>
          </div>

          {/* Rank + trend */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs font-semibold text-white">
              {rankLabel}
            </span>
            {trendBadge}
            {statusText && (
              <span className="text-sm text-white/55">{statusText}</span>
            )}
          </div>

          {/* FIFA attribute grid */}
          {attributes && attributes.length > 0 && (
            <div className="rounded-2xl border border-white/10 bg-black/35 p-4 backdrop-blur-sm">
              <p className="mb-3 text-[9px] font-black uppercase tracking-[0.28em] text-white/35">
                Athlete Attributes
              </p>
              <AttributeGrid attributes={attributes} />
            </div>
          )}

          {/* Highlights strip */}
          {highlights.length > 0 && (
            <div
              className={cn(
                "grid gap-2",
                attributes ? "grid-cols-4" : "grid-cols-2 md:max-w-xl md:grid-cols-4",
              )}
            >
              {highlights.map((h) => (
                <div
                  key={h.label}
                  className="rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-center backdrop-blur-sm transition hover:border-white/20 hover:bg-black/40"
                >
                  <p className="font-heading text-xl font-black text-white">{h.value}</p>
                  <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-white/45">
                    {h.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* XP progression bar */}
          <XpProgressBar tier={tier} rating={overallRating} />
        </div>

        {/* ═══ RIGHT: FIFA-style identity card ═══ */}
        <div className="mx-auto lg:mx-0">
          <FifaStyleCard
            name={firstName}
            avatarUrl={avatarUrl}
            overallRating={overallRating}
            tier={tier}
          />
        </div>
      </div>
    </section>
  );
}

/* ──────────────────────────────────────────────────────────────────────
   Inner component — FIFA card shape on the right side
   ────────────────────────────────────────────────────────────────────── */
function FifaStyleCard({
  name,
  avatarUrl,
  overallRating,
  tier,
}: {
  name: string;
  avatarUrl?: string | null;
  overallRating: number;
  tier: ReturnType<typeof getTierInfo>;
}) {
  return (
    <div
      className={cn(
        "relative w-[152px] overflow-hidden rounded-[1.6rem] border-2",
        tier.cardBorder,
        tier.cardShadow,
      )}
      style={{ aspectRatio: "3 / 4.2" }}
    >
      {/* Card background */}
      <div className={cn("absolute inset-0 bg-gradient-to-b", tier.cardGradient)} />
      {/* Metallic shimmer overlay */}
      <div className="pointer-events-none absolute inset-0 cn-card-shimmer" />
      {/* Top edge shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/45 to-transparent" />
      {/* Bottom edge */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />

      <div className="relative flex h-full flex-col p-3.5">
        {/* OVR number + tier label */}
        <div className="flex items-start justify-between gap-1">
          <div>
            <p
              className={cn(
                "font-heading text-[2.8rem] font-black leading-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.6)]",
                tier.ovrText,
              )}
            >
              {overallRating}
            </p>
            <p
              className={cn(
                "mt-0.5 text-[8px] font-black uppercase tracking-[0.2em]",
                tier.badgeText,
              )}
            >
              {tier.name}
            </p>
          </div>
          <div
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
              tier.badgeBg,
              tier.badgeBorder,
            )}
          >
            <ShieldCheck className={cn("h-5 w-5", tier.badgeText)} />
          </div>
        </div>

        {/* Avatar with tier ring */}
        <div className="flex flex-1 items-center justify-center py-2">
          <div
            className={cn(
              "rounded-full p-[3px] bg-gradient-to-br shadow-lg",
              tier.barGradient,
            )}
          >
            <Avatar
              name={name}
              avatarUrl={avatarUrl}
              size="lg"
              className="h-[72px] w-[72px] border-0"
              ring={false}
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />

        {/* Athlete name */}
        <p className="mt-2 truncate text-center font-heading text-[11px] font-black uppercase tracking-[0.1em] text-white drop-shadow">
          {name}
        </p>

        {/* Club label */}
        <div className="mt-1.5 flex justify-center">
          <span
            className={cn(
              "inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-[0.18em]",
              tier.badgeText,
            )}
          >
            <Flame className="h-2.5 w-2.5" />
            Club Nakhil
          </span>
        </div>
      </div>
    </div>
  );
}
