"use client";

import {
  AlertTriangle,
  ArrowLeft,
  Flame,
  Loader2,
  Lock,
  Mail,
  Sparkles,
  Trophy,
} from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ClubLogo } from "@/components/club-logo";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { useTranslations } from "@/components/providers/translations-provider";
import type { Locale } from "@/lib/i18n";
import { getLoginErrorMessage } from "@/lib/auth-errors";
import { cn } from "@/lib/utils";

type PremiumLoginFormProps = {
  locale: Locale;
};

export function PremiumLoginForm({ locale }: PremiumLoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { dir, t } = useTranslations();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const queryErrorMessage = useMemo(() => {
    const errorCode = searchParams.get("error");
    return errorCode ? getLoginErrorMessage(errorCode, t) : null;
  }, [searchParams, t]);

  const emailIconClass =
    dir === "rtl" ? "right-3 left-auto" : "left-3 right-auto";
  const passwordIconClass =
    dir === "rtl" ? "right-3 left-auto" : "left-3 right-auto";
  const inputPadClass = dir === "rtl" ? "!pr-10" : "!pl-10";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!result || result.error) {
      setError(getLoginErrorMessage(result?.error, t));
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="absolute end-4 top-4 z-30 sm:end-6 sm:top-6">
        <LocaleSwitcher />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[500px] bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,rgba(220,38,38,0.22),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 cn-grid-bg opacity-30"
      />

      <div className="mx-auto grid min-h-screen w-full max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:px-8">
        <section className="hidden flex-col justify-between lg:flex">
          <div>
            <BrandLogo href={`/${locale}`} />

            <div className="mt-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.28em] text-red-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
                {t("auth.loginPage.heroTag")}
              </div>
              <h2 className="mt-5 font-heading text-5xl uppercase leading-[0.95] tracking-[0.02em] text-white">
                {t("auth.loginPage.heroTitleBefore")}
                <br />
                <span className="cn-text-green-gradient">Club Nakhil</span>
                <br />
                {t("auth.loginPage.heroTitleAfter")}
              </h2>
              <p className="mt-5 max-w-md text-base text-club-text-soft">
                {t("auth.loginPage.heroDescription")}
              </p>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-3">
              {[
                {
                  icon: <Trophy className="h-4 w-4" />,
                  label: t("auth.loginPage.features.ranked"),
                },
                {
                  icon: <Flame className="h-4 w-4" />,
                  label: t("auth.loginPage.features.streaks"),
                },
                {
                  icon: <Sparkles className="h-4 w-4" />,
                  label: t("auth.loginPage.features.badges"),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-center backdrop-blur-md"
                >
                  <div className="mx-auto inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-300/30 bg-red-500/15 text-red-100">
                    {item.icon}
                  </div>
                  <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.22em] text-club-muted">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-club-muted">
            {t("auth.loginPage.copyright")}
          </p>
        </section>

        <section className="mx-auto w-full max-w-md cn-rise">
          <div className="flex justify-center lg:hidden">
            <BrandLogo href={`/${locale}`} />
          </div>

          <div className="mt-6 cn-glow-border overflow-hidden rounded-3xl border border-white/10 bg-club-surface/85 p-6 shadow-[0_32px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-7">
            <div className="flex flex-col items-center text-center">
              <ClubLogo size={96} priority glow className="cn-logo-float" />
              <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-red-300/35 bg-red-500/12 px-2.5 py-1 text-[9px] font-bold uppercase tracking-[0.24em] text-red-100">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-400 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
                {t("auth.loginPage.accessBadge")}
              </span>
              <h1 className="mt-4 font-heading text-3xl uppercase tracking-[0.04em] text-white">
                {t("auth.loginPage.welcomePrefix")}{" "}
                <span className="cn-text-green-gradient">Club Nakhil</span>
              </h1>
              <p className="mt-1.5 text-sm text-club-muted">
                {t("auth.loginPage.subtitle")}
              </p>
            </div>

            <div className="cn-hairline my-5" />

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.email")}
                </span>
                <span className="relative block">
                  <Mail
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted",
                      emailIconClass,
                    )}
                  />
                  <input
                    required
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={cn("cn-input", inputPadClass)}
                    placeholder={t("auth.loginPage.placeholders.email")}
                  />
                </span>
              </label>

              <label className="block space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-club-text-soft">
                  {t("auth.password")}
                </span>
                <span className="relative block">
                  <Lock
                    className={cn(
                      "pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 text-club-muted",
                      passwordIconClass,
                    )}
                  />
                  <input
                    required
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className={cn("cn-input", inputPadClass)}
                    placeholder={t("auth.loginPage.placeholders.password")}
                  />
                </span>
              </label>

              <button
                disabled={loading}
                type="submit"
                className="cn-btn cn-btn-primary w-full !py-3"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {loading ? t("auth.loginPage.submitting") : t("auth.loginPage.submit")}
              </button>

              {error ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {!error && queryErrorMessage ? (
                <div className="flex items-start gap-2 rounded-xl border border-rose-300/30 bg-rose-500/10 px-3 py-2.5 text-sm text-rose-100">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{queryErrorMessage}</span>
                </div>
              ) : null}
            </form>

            <div className="cn-hairline mt-6" />

            <p className="mt-5 text-xs text-club-muted">
              {t("auth.loginPage.demoCredentials")}
            </p>

            <Link
              href={`/${locale}/signup`}
              prefetch={false}
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 transition hover:text-cyan-100"
            >
              {t("auth.loginPage.createAccount")}
            </Link>

            <Link
              href={`/${locale}`}
              prefetch={false}
              className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-red-200 transition hover:text-red-100"
            >
              <ArrowLeft
                className={cn("h-3.5 w-3.5", dir === "rtl" ? "rotate-180" : "")}
              />
              {t("auth.loginPage.returnHome")}
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
