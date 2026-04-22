import Image from "next/image";

import { cn } from "@/lib/utils";

type AvatarProps = {
  name: string;
  avatarUrl?: string | null;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  ring?: boolean;
};

const sizeClasses = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-11 w-11 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

function initialsFromName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (!parts.length) {
    return "CN";
  }

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export function Avatar({
  name,
  avatarUrl,
  size = "md",
  className,
  ring = true,
}: AvatarProps) {
  const initials = initialsFromName(name);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border bg-gradient-to-br from-red-500/20 via-red-700/10 to-transparent font-semibold uppercase tracking-wide text-red-100",
        ring
          ? "border-red-300/35 shadow-[0_0_0_2px_rgba(220,38,38,0.1),0_6px_18px_rgba(0,0,0,0.35)]"
          : "border-white/10",
        sizeClasses[size],
        className,
      )}
    >
      {avatarUrl ? (
        <Image
          src={avatarUrl}
          alt={`${name} avatar`}
          fill
          sizes="96px"
          unoptimized
          className="object-cover"
        />
      ) : (
        <span className="relative">{initials}</span>
      )}
    </span>
  );
}
