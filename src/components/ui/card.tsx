import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/utils";

type CardProps = {
  children: ReactNode;
  className?: string;
  tone?: "default" | "raised" | "glow";
  style?: CSSProperties;
};

export function Card({ children, className, tone = "default", style }: CardProps) {
  return (
    <section
      style={style}
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300",
        tone === "default" &&
          "border-white/8 bg-club-surface/80 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-md hover:border-white/[0.13] hover:shadow-[0_22px_55px_rgba(0,0,0,0.42)]",
        tone === "raised" &&
          "cn-surface-raised shadow-[0_22px_60px_rgba(0,0,0,0.45)] hover:shadow-[0_28px_70px_rgba(0,0,0,0.52)]",
        tone === "glow" &&
          "border-red-300/25 bg-gradient-to-br from-red-950/60 via-club-surface to-club-surface-soft shadow-[0_22px_60px_rgba(0,0,0,0.45)] hover:border-red-300/35",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />
      {children}
    </section>
  );
}
