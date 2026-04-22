import Link from "next/link";

import { ClubLogo } from "@/components/club-logo";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
  tagline?: string;
  size?: "sm" | "md" | "lg";
  framed?: boolean;
};

const LOGO_SIZES: Record<NonNullable<BrandLogoProps["size"]>, number> = {
  sm: 34,
  md: 44,
  lg: 64,
};

export function BrandLogo({
  compact = false,
  href = "/",
  className,
  tagline = "Kickboxing · Coach Rabah · Morocco",
  size = "md",
  framed = true,
}: BrandLogoProps) {
  const px = LOGO_SIZES[size];

  return (
    <Link
      href={href}
      aria-label="Club Nakhil home"
      className={cn(
        "group inline-flex items-center gap-3 transition",
        className,
      )}
    >
      <ClubLogo
        size={px}
        framed={framed}
        glow
        className="transition duration-300 group-hover:scale-[1.04]"
      />
      {!compact ? (
        <span className="flex min-w-0 flex-col leading-none">
          <span
            className={cn(
              "font-heading uppercase tracking-[0.18em] text-white",
              size === "lg"
                ? "text-[1.75rem]"
                : size === "sm"
                  ? "text-base"
                  : "text-[1.35rem]",
            )}
          >
            Club <span className="cn-text-green-gradient">Nakhil</span>
          </span>
          <span
            className={cn(
              "mt-1 truncate uppercase tracking-[0.3em] text-red-300/70",
              size === "lg" ? "text-[11px]" : "text-[10px]",
            )}
          >
            {tagline}
          </span>
        </span>
      ) : null}
    </Link>
  );
}
