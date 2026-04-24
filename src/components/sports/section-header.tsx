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
      <div className="min-w-0 flex-1 space-y-2">
        {eyebrow ? (
          <p className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-amber-200/90">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_rgba(245,200,101,0.7)]" />
            {eyebrow}
          </p>
        ) : null}
        <h2 className="font-heading text-xl uppercase leading-tight tracking-[0.05em] text-white sm:text-2xl md:text-[1.75rem]">
          {title}
        </h2>
        {subtitle ? (
          <p className="max-w-2xl text-sm leading-relaxed text-club-text-soft">
            {subtitle}
          </p>
        ) : null}
      </div>
      {action ? (
        <div className="w-full shrink-0 sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
