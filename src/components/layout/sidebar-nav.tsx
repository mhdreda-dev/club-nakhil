'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';

export type NavigationItem = {
  href: string;
  label: string;
  badgeCount?: number;
  icon?: React.ReactNode;
  /**
   * When true, this link is prefetched eagerly on mount.
   * Use sparingly — reserve for the single most-likely next click per role.
   * All other links defer to hover/focus-triggered prefetch to avoid the
   * "prefetch storm" on pages that render many sidebar entries at once.
   */
  priority?: boolean;
};

interface SidebarNavProps {
  items: NavigationItem[];
  onNavigate?: () => void;
}

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Track which hrefs we've already warmed to avoid duplicate router.prefetch
  // calls on repeated hovers (Next dedupes internally, but this saves the
  // round-trip through its cache too).
  const prefetched = useRef<Set<string>>(new Set());

  const warm = useCallback(
    (href: string) => {
      if (prefetched.current.has(href)) return;
      prefetched.current.add(href);
      router.prefetch(href);
    },
    [router],
  );

  return (
    <nav className="space-y-1">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(`${item.href}/`));

        // Only the active route and explicitly-flagged priority items
        // prefetch on mount. Everything else waits for hover/focus — which
        // Next's router.prefetch satisfies in <100ms on warm caches, and
        // keeps the initial render from firing ~9 parallel route fetches.
        const shouldEagerPrefetch = isActive || item.priority === true;

        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={shouldEagerPrefetch}
            onMouseEnter={shouldEagerPrefetch ? undefined : () => warm(item.href)}
            onFocus={shouldEagerPrefetch ? undefined : () => warm(item.href)}
            onTouchStart={shouldEagerPrefetch ? undefined : () => warm(item.href)}
            onClick={onNavigate}
            className={cn(
              // Base — always dark, never white
              'group flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200',
              isActive
                ? [
                    // Active: deep dark-red tinted bg, crisp white text, subtle red border
                    'border-[rgba(220,38,38,0.30)]',
                    'bg-[linear-gradient(110deg,rgba(180,20,20,0.28)_0%,rgba(140,14,14,0.18)_55%,rgba(100,10,10,0.10)_100%)]',
                    'text-white',
                    'shadow-[0_4px_20px_rgba(180,20,20,0.20),inset_0_1px_0_rgba(255,255,255,0.07)]',
                  ]
                : [
                    // Inactive: near-invisible border, muted text
                    'border-transparent',
                    'text-[#8b9ab4]',
                    // Hover: dark, barely-there tint — never bright
                    'hover:border-[rgba(255,255,255,0.08)]',
                    'hover:bg-[rgba(255,255,255,0.04)]',
                    'hover:text-white',
                  ],
            )}
          >
            {/* Icon slot */}
            {item.icon && (
              <span
                className={cn(
                  'shrink-0 transition-colors',
                  isActive ? 'text-[#ef4444]' : 'text-[#5d6a82] group-hover:text-[#8b9ab4]',
                )}
              >
                {item.icon}
              </span>
            )}

            <span className="min-w-0 flex-1 truncate">{item.label}</span>

            {item.badgeCount != null && item.badgeCount > 0 && (
              <span
                className={cn(
                  'inline-flex min-w-[1.75rem] items-center justify-center rounded-full border px-1.5 py-0.5 text-[10px] font-bold leading-none',
                  isActive
                    ? 'border-[rgba(220,38,38,0.40)] bg-[rgba(180,20,20,0.30)] text-red-200'
                    : 'border-white/10 bg-black/30 text-[#5d6a82] group-hover:text-white',
                )}
              >
                {item.badgeCount}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}