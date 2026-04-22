import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ProfileSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function ProfileSection({
  title,
  description,
  children,
  className,
  action,
}: ProfileSectionProps) {
  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-club-surface/85 p-5 backdrop-blur-md shadow-[0_18px_45px_rgba(0,0,0,0.35)] sm:p-6",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-heading text-xl uppercase tracking-[0.05em] text-white md:text-2xl">
            {title}
          </h3>
          {description ? (
            <p className="mt-1 text-sm text-club-muted">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      <div className="mt-5">{children}</div>
    </section>
  );
}
