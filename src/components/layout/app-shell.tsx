import type { ReactNode } from "react";

import { BrandLogo } from "@/components/brand-logo";
import { ClubLogo } from "@/components/club-logo";
import { LogoutButton } from "@/components/layout/logout-button";
import { MobileNav } from "@/components/layout/mobile-nav";
import { SidebarNav, type NavigationItem } from "@/components/layout/sidebar-nav";
import { Avatar } from "@/components/ui/avatar";

type SidebarProfileSummary = {
  displayName: string;
  city: string | null;
  bio: string | null;
  avatarUrl: string | null;
  metrics: Array<{
    label: string;
    value: string;
  }>;
};

type AppShellProps = {
  title: string;
  subtitle: string;
  userName: string;
  avatarUrl?: string | null;
  roleLabel: string;
  navItems: NavigationItem[];
  sidebarProfileSummary?: SidebarProfileSummary | null;
  children: ReactNode;
};

export function AppShell({
  title,
  subtitle,
  userName,
  avatarUrl,
  roleLabel,
  navItems,
  sidebarProfileSummary,
  children,
}: AppShellProps) {
  return (
    <div className="relative min-h-screen text-club-text">
      {/* Decorative glow layers */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[420px] bg-[radial-gradient(ellipse_70%_55%_at_50%_0%,rgba(220,38,38,0.14),transparent_70%)]"
      />

      <header className="sticky top-0 z-40 border-b border-white/8 bg-club-base/75 backdrop-blur-xl">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-gradient-to-r from-transparent via-red-400/40 to-transparent"
        />
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <MobileNav
              items={navItems}
              userName={userName}
              avatarUrl={avatarUrl}
              roleLabel={roleLabel}
            />
            <BrandLogo href="/" compact={false} />
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="hidden items-center gap-1.5 rounded-full border border-red-300/30 bg-red-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-red-100 sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-red-300 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
              {roleLabel}
            </span>
            <div className="hidden items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 sm:flex">
              <Avatar name={userName} avatarUrl={avatarUrl} size="sm" />
              <span className="pr-1 text-sm font-semibold text-club-text-soft">
                {userName}
              </span>
            </div>
            <div className="sm:hidden">
              <Avatar name={userName} avatarUrl={avatarUrl} size="sm" />
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid w-full max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_1fr] lg:gap-8 lg:px-8 lg:py-8">
        <aside className="hidden h-fit lg:sticky lg:top-24 lg:block">
          <div className="cn-surface-raised overflow-hidden p-4">
            {/* Branded sidebar panel — official Club Nakhil lockup */}
            <div className="relative mb-4 overflow-hidden rounded-xl border border-red-300/20 bg-gradient-to-br from-red-500/8 via-club-surface-alt/90 to-black/55 p-3">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-red-400/55 to-transparent"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full bg-red-400/15 blur-2xl"
              />
              <div className="relative flex items-center gap-3">
                <ClubLogo size={42} framed glow priority />
                <div className="min-w-0">
                  <p className="truncate font-heading text-sm font-black uppercase tracking-[0.18em] text-white">
                    Club <span className="cn-text-green-gradient">Nakhil</span>
                  </p>
                  <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.24em] text-red-300/85">
                    Coach Rabah · Official
                  </p>
                </div>
              </div>
            </div>

            {sidebarProfileSummary ? (
              <div className="relative mb-4 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-red-500/12 via-club-surface-alt/90 to-club-surface p-4">
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-24 w-24 rounded-full bg-red-400/20 blur-3xl"
                />
                <div className="relative flex items-center gap-3">
                  <Avatar
                    name={sidebarProfileSummary.displayName}
                    avatarUrl={sidebarProfileSummary.avatarUrl}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {sidebarProfileSummary.displayName}
                    </p>
                    {sidebarProfileSummary.city ? (
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-red-300/80">
                        {sidebarProfileSummary.city}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-club-muted">
                        Club Member
                      </p>
                    )}
                  </div>
                </div>

                {sidebarProfileSummary.bio ? (
                  <p className="cn-line-2 relative mt-3 text-xs text-club-muted">
                    {sidebarProfileSummary.bio}
                  </p>
                ) : null}

                <div className="relative mt-4 grid grid-cols-3 gap-2">
                  {sidebarProfileSummary.metrics.map((metric) => (
                    <div
                      key={metric.label}
                      className="rounded-lg border border-white/10 bg-black/25 p-2 text-center"
                    >
                      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-club-muted">
                        {metric.label}
                      </p>
                      <p className="mt-1 font-heading text-sm font-bold text-red-100">
                        {metric.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <SidebarNav items={navItems} />

            <div className="cn-divider-glow mt-5" />

            <div className="mt-4 relative overflow-hidden rounded-xl border border-amber-300/22 bg-gradient-to-br from-amber-500/12 via-club-surface-alt/80 to-club-surface p-3.5">
              <div aria-hidden className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-amber-400/12 blur-2xl" />
              <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
              <p className="relative text-[10px] font-bold uppercase tracking-[0.24em] text-amber-300/90">
                Club Nakhil · Coach Rabah
              </p>
              <p className="relative mt-1.5 text-xs leading-relaxed text-club-muted">
                Train with intent. Every round counts.
              </p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 space-y-6">
          <section className="relative overflow-hidden rounded-3xl border border-red-300/20 bg-[linear-gradient(135deg,rgba(35,8,8,0.95)_0%,rgba(10,15,24,0.95)_55%,rgba(25,20,5,0.8)_100%)] p-6 sm:p-8">
            <div
              aria-hidden
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-red-400/15 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -left-24 bottom-[-80px] h-48 w-48 rounded-full bg-amber-400/10 blur-3xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 cn-grid-bg opacity-30"
            />
            {/* Logo watermark */}
            <div
              aria-hidden
              className="pointer-events-none absolute -right-6 -top-6 opacity-[0.08] md:-right-2 md:-top-2 md:opacity-[0.12]"
            >
              <ClubLogo size={220} />
            </div>
            <div className="relative flex flex-wrap items-center gap-4">
              <ClubLogo size={56} framed glow className="shrink-0" />
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-300/25 bg-red-500/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-red-100">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-300 shadow-[0_0_8px_rgba(220,38,38,0.9)]" />
                  Club Nakhil · Official Platform
                </div>
                <h1 className="mt-3 font-heading text-3xl uppercase leading-tight tracking-[0.06em] text-white sm:text-4xl md:text-[2.5rem]">
                  {title}
                </h1>
                <p className="mt-2 max-w-2xl text-sm text-club-text-soft sm:text-base">
                  {subtitle}
                </p>
              </div>
            </div>
          </section>

          <div className="cn-rise">{children}</div>
        </main>
      </div>
    </div>
  );
}
