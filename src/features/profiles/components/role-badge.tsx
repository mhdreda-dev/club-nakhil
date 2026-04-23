"use client";

import { Role } from "@prisma/client";
import { ShieldCheck, UserRound } from "lucide-react";

import { useTranslations } from "@/components/providers/translations-provider";
import { cn } from "@/lib/utils";

type RoleBadgeProps = {
  role: Role;
  className?: string;
};

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const { t } = useTranslations();
  const isAdmin = role === Role.ADMIN;
  const isCoach = role === Role.COACH;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em]",
        isAdmin
          ? "border-cyan-300/45 bg-cyan-500/12 text-cyan-100"
          : isCoach
          ? "border-amber-300/45 bg-amber-400/12 text-amber-100"
          : "border-red-300/45 bg-red-500/12 text-red-100",
        className,
      )}
    >
      {isAdmin || isCoach ? <ShieldCheck className="h-3 w-3" /> : <UserRound className="h-3 w-3" />}
      {isAdmin ? t("roles.admin") : isCoach ? t("roles.coach") : t("roles.member")}
    </span>
  );
}
