import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export function SectionHeader({
  title,
  subtitle,
  eyebrow,
  action,
  className,
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.07] pb-5",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(245,200,101,0.7)]" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-heading text-2xl uppercase leading-tight tracking-[0.05em] text-white md:text-[1.75rem]">
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-relaxed text-club-text-soft">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
