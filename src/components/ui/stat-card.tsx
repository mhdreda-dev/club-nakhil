import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type StatCardProps = {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  className?: string;
};

export function StatCard({ label, value, hint, icon, className }: StatCardProps) {
  return (
    <Card
      className={cn(
        "group transition-all duration-300 hover:-translate-y-1 hover:border-red-300/28 hover:shadow-[0_24px_55px_rgba(0,0,0,0.45)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-club-muted">
            {label}
          </p>
          <p className="mt-2 font-heading text-4xl font-bold leading-none tracking-tight text-white">
            {value}
          </p>
          {hint ? (
            <p className="mt-2 text-sm text-club-muted/90">{hint}</p>
          ) : null}
        </div>
        {icon ? (
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-300/25 bg-gradient-to-br from-red-500/25 to-red-700/10 text-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition group-hover:shadow-[0_0_25px_rgba(220,38,38,0.25)]">
            {icon}
          </div>
        ) : null}
      </div>
    </Card>
  );
}
