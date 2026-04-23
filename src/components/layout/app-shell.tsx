import { LocaleSwitcher } from "@/components/locale-switcher";
import { SidebarNav, type NavigationItem } from "./sidebar-nav";
import { MobileNav } from "./mobile-nav";
import { LogoutButton } from "./logout-button";
import { Avatar } from "@/components/ui/avatar";
import { BrandLogo } from "@/components/brand-logo";

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  userName: string;
  avatarUrl?: string | null;
  roleLabel: string;
  navItems: NavigationItem[];
  sidebarProfileSummary: unknown;
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
    <div className="flex min-h-screen bg-black text-white">
      <aside className="hidden w-72 flex-col border-e border-white/10 bg-[#0b0b0b] lg:flex">
        <div className="border-b border-white/10 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <BrandLogo compact />
            </div>
            <div className="shrink-0">
              <LocaleSwitcher />
            </div>
          </div>
        </div>

        <div className="border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <Avatar
              name={userName}
              avatarUrl={avatarUrl}
              size="sm"
              ring={false}
            />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">
                {userName}
              </p>
              <p className="text-xs text-zinc-400">{roleLabel}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav items={navItems} />
        </div>

        <div className="border-t border-white/10 p-4">
          <LogoutButton />
        </div>
      </aside>

      <MobileNav
        items={navItems}
        userName={userName}
        avatarUrl={avatarUrl}
        roleLabel={roleLabel}
      />

      <main className="flex-1 bg-[#080808]">
        <header className="border-b border-white/10 bg-[#0f0f0f] px-4 py-4 lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              {title && (
                <h1 className="truncate text-xl font-bold text-white">
                  {title}
                </h1>
              )}
              {subtitle && (
                <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
              )}
            </div>

            <div className="shrink-0 flex items-center gap-3">
              <LocaleSwitcher />
            </div>
          </div>
        </header>

        <div className="p-4 lg:p-8">{children}</div>
      </main>
    </div>
  );
}