import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type MetricTone = "emerald" | "amber" | "sky" | "rose" | "slate";

type MetricCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  badge?: ReactNode;
  tone?: MetricTone;
  className?: string;
};

const toneBg: Record<MetricTone, string> = {
  emerald:
    "from-red-500/20 via-red-500/6 to-transparent border-red-300/20 hover:border-red-300/35",
  amber:
    "from-amber-500/22 via-amber-400/6 to-transparent border-amber-300/25 hover:border-amber-300/40",
  sky: "from-cyan-500/22 via-cyan-500/6 to-transparent border-cyan-300/22 hover:border-cyan-300/40",
  rose: "from-rose-500/22 via-rose-500/6 to-transparent border-rose-300/22 hover:border-rose-300/40",
  slate:
    "from-white/12 via-white/4 to-transparent border-white/10 hover:border-white/20",
};

const toneGlow: Record<MetricTone, string> = {
  emerald: "shadow-[0_24px_45px_-22px_rgba(220,38,38,0.5)]",
  amber: "shadow-[0_24px_45px_-22px_rgba(245,200,101,0.4)]",
  sky: "shadow-[0_24px_45px_-22px_rgba(90,216,255,0.4)]",
  rose: "shadow-[0_24px_45px_-22px_rgba(255,107,123,0.4)]",
  slate: "shadow-[0_18px_45px_rgba(0,0,0,0.35)]",
};

const iconTone: Record<MetricTone, string> = {
  emerald:
    "text-red-100 bg-gradient-to-br from-red-500/30 to-red-700/10 border-red-300/30",
  amber:
    "text-amber-100 bg-gradient-to-br from-amber-400/30 to-amber-700/10 border-amber-300/35",
  sky: "text-cyan-100 bg-gradient-to-br from-cyan-400/30 to-cyan-700/10 border-cyan-300/30",
  rose: "text-rose-100 bg-gradient-to-br from-rose-500/30 to-rose-700/10 border-rose-300/30",
  slate:
    "text-zinc-100 bg-gradient-to-br from-white/15 to-white/5 border-white/15",
};

export function MetricCard({
  label,
  value,
  hint,
  icon,
  badge,
  tone = "slate",
  className,
}: MetricCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-club-surface/85 p-4 backdrop-blur-md transition duration-300 hover:-translate-y-1 sm:p-5",
        toneBg[tone],
        toneGlow[tone],
        className,
      )}
    >
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-100 transition-opacity duration-300 group-hover:opacity-80",
          toneBg[tone],
        )}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"
      />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-club-muted">
              {label}
            </p>
            <p className="mt-2.5 break-words font-heading text-3xl font-black leading-none text-white sm:text-4xl">
              {value}
            </p>
          </div>
          {icon ? (
            <div
              className={cn(
                "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border backdrop-blur sm:h-11 sm:w-11",
                iconTone[tone],
              )}
            >
              {icon}
            </div>
          ) : null}
        </div>
        <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2">
          {hint ? (
            <p className="min-w-0 flex-1 text-[11px] leading-relaxed text-club-muted">{hint}</p>
          ) : (
            <span />
          )}
          {badge}
        </div>
      </div>
    </article>
  );
}
