export type TierName = "Bronze" | "Silver" | "Gold" | "Elite" | "Champion";

export type TierInfo = {
  name: TierName;
  min: number;
  max: number;
  nextTier: TierName | null;
  nextThreshold: number | null;
  progress: number;
  cardGradient: string;
  cardBorder: string;
  cardShadow: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  ovrText: string;
  barGradient: string;
};

const TIERS = [
  { name: "Bronze" as TierName, min: 40, max: 54 },
  { name: "Silver" as TierName, min: 55, max: 64 },
  { name: "Gold" as TierName, min: 65, max: 74 },
  { name: "Elite" as TierName, min: 75, max: 84 },
  { name: "Champion" as TierName, min: 85, max: 99 },
] as const;

const STYLES: Record<
  TierName,
  Omit<TierInfo, "name" | "min" | "max" | "nextTier" | "nextThreshold" | "progress">
> = {
  Bronze: {
    cardGradient: "from-orange-950/98 via-orange-900/85 to-amber-950/98",
    cardBorder: "border-orange-500/55",
    cardShadow: "shadow-[0_28px_80px_rgba(160,70,20,0.55)]",
    badgeBg: "bg-orange-600/25",
    badgeBorder: "border-orange-400/45",
    badgeText: "text-orange-200",
    ovrText: "text-orange-100",
    barGradient: "from-orange-700 via-orange-500 to-orange-400",
  },
  Silver: {
    cardGradient: "from-zinc-800/98 via-zinc-700/80 to-zinc-900/98",
    cardBorder: "border-zinc-300/55",
    cardShadow: "shadow-[0_28px_80px_rgba(160,170,200,0.45)]",
    badgeBg: "bg-zinc-400/25",
    badgeBorder: "border-zinc-300/45",
    badgeText: "text-zinc-100",
    ovrText: "text-zinc-50",
    barGradient: "from-zinc-500 via-zinc-300 to-zinc-100",
  },
  Gold: {
    cardGradient: "from-amber-900/98 via-amber-700/80 to-amber-950/98",
    cardBorder: "border-amber-300/65",
    cardShadow: "shadow-[0_28px_90px_rgba(245,200,101,0.55)]",
    badgeBg: "bg-amber-500/25",
    badgeBorder: "border-amber-300/55",
    badgeText: "text-amber-100",
    ovrText: "text-amber-50",
    barGradient: "from-amber-700 via-amber-400 to-amber-200",
  },
  Elite: {
    cardGradient: "from-red-950/98 via-red-800/80 to-red-950/98",
    cardBorder: "border-red-300/65",
    cardShadow: "shadow-[0_28px_90px_rgba(220,38,38,0.5)]",
    badgeBg: "bg-red-500/25",
    badgeBorder: "border-red-300/55",
    badgeText: "text-red-100",
    ovrText: "text-red-50",
    barGradient: "from-red-700 via-red-400 to-red-200",
  },
  Champion: {
    cardGradient: "from-yellow-800/98 via-amber-600/75 to-orange-950/98",
    cardBorder: "border-yellow-200/80",
    cardShadow: "shadow-[0_32px_100px_rgba(255,215,0,0.65)]",
    badgeBg: "bg-yellow-400/30",
    badgeBorder: "border-yellow-200/70",
    badgeText: "text-yellow-100",
    ovrText: "text-yellow-50",
    barGradient: "from-yellow-600 via-yellow-300 to-yellow-100",
  },
};

export function getTierInfo(rating: number): TierInfo {
  const r = Math.min(99, Math.max(40, rating));
  const idx = TIERS.findIndex((t) => r >= t.min && r <= t.max);
  const i = idx >= 0 ? idx : TIERS.length - 1;
  const tier = TIERS[i];
  const next = TIERS[i + 1] ?? null;
  const range = tier.max - tier.min + 1;
  const progress =
    tier.name === "Champion" ? 100 : Math.round(((r - tier.min) / range) * 100);

  return {
    name: tier.name,
    min: tier.min,
    max: tier.max,
    nextTier: next?.name ?? null,
    nextThreshold: next?.min ?? null,
    progress,
    ...STYLES[tier.name],
  };
}
