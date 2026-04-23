"use client";

import { ChevronDown, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/utils";
import { useTranslations } from "@/components/providers/translations-provider";

export function LocaleSwitcher() {
  const { dir, locale, localeOptions, setLocale, t } = useTranslations();
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const currentLocale =
    localeOptions.find((option) => option.code === locale) ?? localeOptions[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div ref={wrapperRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setIsOpen((value) => !value)}
        aria-expanded={isOpen ? "true" : "false"}
        aria-haspopup="menu"
        aria-controls="locale-menu"
        aria-label={t("locale.switcher")}
        className="group inline-flex min-w-[132px] max-w-[44vw] items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[linear-gradient(135deg,rgba(255,255,255,0.07),rgba(255,255,255,0.02))] px-3 py-2.5 text-sm text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl transition hover:border-red-300/30 hover:bg-[linear-gradient(135deg,rgba(220,38,38,0.14),rgba(255,255,255,0.05))] sm:min-w-[148px] sm:max-w-none sm:px-3.5"
      >
        <span
          className={cn(
            "flex items-center gap-2.5",
            dir === "rtl" ? "flex-row-reverse" : "",
          )}
        >
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-red-300/20 bg-red-500/12 text-red-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <Languages className="h-4 w-4" />
          </span>
          <span className="flex min-w-0 flex-col items-start leading-none" data-rtl-align="start">
            <span className="text-[9px] font-bold uppercase tracking-[0.24em] text-zinc-400">
              {t("locale.switcher")}
            </span>
            <span className="mt-1 font-semibold text-white">
              {currentLocale.label}
            </span>
          </span>
        </span>

        <ChevronDown
          className={cn(
            "h-4 w-4 text-zinc-400 transition group-hover:text-white",
            isOpen ? "rotate-180" : "",
          )}
        />
      </button>

      {isOpen ? (
        <div
          id="locale-menu"
          role="menu"
          className="absolute end-0 z-[999] mt-2 w-56 overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(17,17,17,0.97),rgba(10,10,10,0.95))] p-2 shadow-[0_22px_55px_rgba(0,0,0,0.55)] backdrop-blur-2xl sm:w-60"
        >
          {localeOptions.map((option) => {
            const active = option.code === locale;

            return (
              <button
                key={option.code}
                type="button"
                role="menuitem"
                onClick={() => {
                  setLocale(option.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex w-full items-center justify-between rounded-2xl px-3.5 py-3 text-start text-sm transition",
                  active
                    ? "bg-red-500/14 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    : "text-zinc-300 hover:bg-white/5 hover:text-white"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "h-2.5 w-2.5 rounded-full border border-white/15",
                      active ? "bg-red-300 shadow-[0_0_12px_rgba(252,165,165,0.6)]" : "bg-transparent",
                    )}
                  />
                  <span className="font-semibold">{option.label}</span>
                </span>
                <span className="text-xs text-zinc-400">{option.nativeName}</span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
