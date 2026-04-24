import { LocaleSwitcher } from '@/components/locale-switcher';
import { SidebarNav, type NavigationItem } from './sidebar-nav';
import { MobileNav } from './mobile-nav';
import { LogoutButton } from './logout-button';
import { Avatar } from '@/components/ui/avatar';
import { BrandLogo } from '@/components/brand-logo';

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  userName: string;
  avatarUrl?: string | null;
  roleLabel: string;
  navItems: NavigationItem[];
  sidebarProfileSummary?: unknown;
}

export async function AppShell({
  children,
  title,
  subtitle,
  userName,
  avatarUrl,
  roleLabel,
  navItems,
}: AppShellProps) {
  return (
    /*
     * Root: flex row, full viewport height, no horizontal overflow.
     * overflow-x-clip rather than hidden so sticky sidebar still works.
     */
    <div className="flex min-h-screen overflow-x-clip bg-[#05070c] text-white">

      {/* ──────────────────────────────────────────────
          Desktop sidebar — hidden below lg
      ────────────────────────────────────────────── */}
      <aside
        className="sticky top-0 z-40 hidden h-screen w-[290px] shrink-0 flex-col
          border-e border-[rgba(255,255,255,0.08)]
          bg-[linear-gradient(180deg,#0a0c12_0%,#0d1018_100%)]
          lg:flex xl:w-[312px]"
      >
        {/* Logo + locale */}
        <div className="shrink-0 border-b border-[rgba(255,255,255,0.08)] px-5 pb-4 pt-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <BrandLogo compact />
            </div>
            <div className="shrink-0">
              <LocaleSwitcher />
            </div>
          </div>
        </div>

        {/* User identity */}
        <div className="shrink-0 border-b border-[rgba(255,255,255,0.08)] px-5 py-4">
          <div
            className="flex items-center gap-3 rounded-2xl p-3
              border border-[rgba(255,255,255,0.08)]
              bg-[rgba(255,255,255,0.03)]
              shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
          >
            <Avatar name={userName} avatarUrl={avatarUrl} size="md" ring={false} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="mt-0.5 text-[10px] uppercase tracking-[0.22em] text-[rgba(161,161,170,0.8)]">
                {roleLabel}
              </p>
            </div>
          </div>
        </div>

        {/* Nav links — scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
          <SidebarNav items={navItems} />
        </div>

        {/* Logout — pinned at bottom */}
        <div className="shrink-0 border-t border-[rgba(255,255,255,0.08)] px-5 py-4">
          <LogoutButton className="w-full justify-center" compact />
        </div>
      </aside>

      {/* ──────────────────────────────────────────────
          Main content area
      ────────────────────────────────────────────── */}
      <main className="flex min-w-0 flex-1 flex-col bg-[#080a0e]">

        {/* Sticky top header */}
        <header
          className="sticky top-0 z-30 px-4 py-3 lg:px-6
            border-b border-[rgba(255,255,255,0.08)]
            bg-[linear-gradient(180deg,rgba(12,14,20,0.97)_0%,rgba(10,12,18,0.93)_100%)]
            backdrop-blur-md"
        >
          <div className="flex items-start gap-3">
            {/* Mobile hamburger — visible only below lg */}
            <div className="shrink-0 pt-0.5 lg:hidden">
              <MobileNav
                items={navItems}
                userName={userName}
                avatarUrl={avatarUrl}
                roleLabel={roleLabel}
              />
            </div>

            {/* Page title / subtitle */}
            <div className="min-w-0 flex-1">
              {title && (
                <h1 className="truncate text-lg font-bold text-white sm:text-xl">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 max-w-3xl text-sm leading-relaxed text-zinc-400">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        </header>

        {/* Page body */}
        <div className="min-w-0 flex-1 p-4 md:p-5 lg:p-6 xl:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}