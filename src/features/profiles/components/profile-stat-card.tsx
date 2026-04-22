import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ProfileStatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  className?: string;
};

export function ProfileStatCard({
  label,
  value,
  hint,
  icon,
  className,
}: ProfileStatCardProps) {
  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-white/5 via-club-surface/80 to-black/30 p-4 shadow-[0_12px_30px_rgba(0,0,0,0.3)] transition hover:-translate-y-0.5 hover:border-red-300/30",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-club-muted">
            {label}
          </p>
          <p className="mt-2 font-heading text-3xl font-black leading-none text-white">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-[11px] text-club-muted">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-300/30 bg-gradient-to-br from-red-500/25 to-red-800/10 text-red-100 transition group-hover:shadow-[0_0_22px_rgba(220,38,38,0.28)]">
            {icon}
          </div>
        ) : null}
      </div>
    </article>
  );
}
