"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";
import { SidebarNav, type NavigationItem } from "@/components/layout/sidebar-nav";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "@/components/providers/translations-provider";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  items: NavigationItem[];
  userName: string;
  avatarUrl?: string | null;
  roleLabel: string;
};

export function MobileNav({ items, userName, avatarUrl, roleLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const { dir, t } = useTranslations();

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t("layout.mobileNav.open")}
        className="cn-btn-ghost cn-btn !px-2.5 !py-2 lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label={t("layout.mobileNav.close")}
            onClick={() => setOpen(false)}
            className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm"
          />
          <div
            className={cn(
              "absolute top-0 flex h-full w-[82%] max-w-[320px] flex-col gap-4 bg-club-base/98 p-4 shadow-[0_0_60px_rgba(0,0,0,0.7)]",
              dir === "rtl"
                ? "right-0 border-l border-white/10"
                : "left-0 border-r border-white/10",
              "cn-rise",
            )}
          >
            <div className="flex items-center justify-between">
              <BrandLogo compact />
              <div className="flex items-center gap-2">
                <LocaleSwitcher />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label={t("layout.mobileNav.close")}
                  className="cn-btn-ghost cn-btn !px-2.5 !py-2"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <Avatar name={userName} avatarUrl={avatarUrl} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{userName}</p>
                <p className="text-[10px] uppercase tracking-[0.22em] text-red-300/80">
                  {roleLabel}
                </p>
              </div>
            </div>

            <SidebarNav items={items} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
