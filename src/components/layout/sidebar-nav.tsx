"use client";

import {
  Activity,
  Bell,
  CalendarCheck2,
  CalendarClock,
  ClipboardList,
  LayoutDashboard,
  LineChart,
  ScanLine,
  Star,
  Trophy,
  UserCircle2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ComponentType, SVGProps } from "react";

import { cn } from "@/lib/utils";

export type NavigationItem = {
  href: string;
  label: string;
  badgeCount?: number;
};

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

const iconMap: Record<string, IconComponent> = {
  "/admin/dashboard": LayoutDashboard,
  "/admin/activity-feed": Activity,
  "/admin/members": Users,
  "/member/dashboard": LayoutDashboard,
  "/member/activity-feed": Activity,
  "/member/profile": UserCircle2,
  "/member/sessions": CalendarClock,
  "/member/attendance": CalendarCheck2,
  "/member/progress": LineChart,
  "/member/rate-coach": Star,
  "/member/announcements": Bell,
  "/member/leaderboard": Trophy,
  "/coach/dashboard": LayoutDashboard,
  "/coach/activity-feed": Activity,
  "/coach/profile": UserCircle2,
  "/coach/sessions": CalendarClock,
  "/coach/attendance": ScanLine,
  "/coach/ratings": Star,
  "/coach/members": Users,
  "/coach/announcements": Bell,
};

function getIcon(href: string): IconComponent {
  return iconMap[href] ?? ClipboardList;
}

type SidebarNavProps = {
  items: NavigationItem[];
  className?: string;
  onNavigate?: () => void;
};

export function SidebarNav({ items, className, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn("flex flex-col gap-0.5", className)}
      aria-label="Primary navigation"
    >
      <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.28em] text-club-muted/80">
        Navigation
      </p>
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/" && pathname?.startsWith(item.href));

        const Icon = getIcon(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-3 overflow-hidden rounded-lg border px-2.5 py-2 text-sm font-semibold transition-all duration-200",
              isActive
                ? "border-red-300/30 bg-gradient-to-r from-red-500/15 via-red-500/5 to-transparent text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_8px_24px_-12px_rgba(220,38,38,0.45)]"
                : "border-transparent text-club-text-soft hover:border-white/10 hover:bg-white/[0.04] hover:text-white",
            )}
          >
            {isActive ? (
              <span
                aria-hidden
                className="absolute inset-y-1.5 left-0 w-[3px] rounded-r-full bg-gradient-to-b from-red-300 via-red-400 to-red-600 shadow-[0_0_10px_rgba(220,38,38,0.7)]"
              />
            ) : null}
            <span
              className={cn(
                "grid h-8 w-8 shrink-0 place-items-center rounded-md border transition",
                isActive
                  ? "border-red-300/40 bg-red-500/15 text-red-100 shadow-[0_0_14px_-4px_rgba(220,38,38,0.55)]"
                  : "border-white/8 bg-white/[0.03] text-club-muted group-hover:border-red-300/25 group-hover:bg-red-500/8 group-hover:text-red-100",
              )}
            >
              <Icon className="h-4 w-4" />
            </span>
            <span className="truncate tracking-[0.01em]">{item.label}</span>
            {item.badgeCount && item.badgeCount > 0 ? (
              <span className="ml-auto inline-flex min-w-[1.35rem] items-center justify-center rounded-full border border-red-300/40 bg-red-500/15 px-1.5 py-0.5 text-[10px] font-bold text-red-100">
                {item.badgeCount}
              </span>
            ) : isActive ? (
              <span
                aria-hidden
                className="ml-auto h-1.5 w-1.5 rounded-full bg-red-300 shadow-[0_0_8px_rgba(220,38,38,0.9)]"
              />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
