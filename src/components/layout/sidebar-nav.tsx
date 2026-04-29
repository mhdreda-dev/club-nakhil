'use client';

import Link, { useLinkStatus } from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useRef } from 'react';
import { cn } from '@/lib/utils';

export type NavigationItem = {
  href: string;
  label: string;
  badgeCount?: number;
  icon?: React.ReactNode;
};

interface SidebarNavProps {
  items: NavigationItem[];
  onNavigate?: () => void;
}

/**
 * Visual content of a nav link. Lives INSIDE the <Link> so it can read
 * `useLinkStatus()` — Next 16's hook that flips `pending` to `true` the
 * instant the user clicks, and back to `false` when the new route commits.
 *
 * Pending links are styled identically to the active link, so the user
 * sees instant feedback the moment they click — no waiting on TTFB before
 * the highlight moves.
 */
function NavLinkContent({
  item,
  isActive,
}: {
  item: NavigationItem;
  isActive: boolean;
}) {
  const { pending } = useLinkStatus();
  // Treat pending the same as active for visuals. The real `isActive` from
  // pathname is still authoritative once the route commits.
  const looksActive = isActive || pending;

  return (
    <span
      className={cn(
        'group relative flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all duration-200',
        looksActive
          ? [
              'border-[rgba(220,38,38,0.30)]',
              'bg-[linear-gradient(110deg,rgba(180,20,20,0.28)_0%,rgba(140,14,14,0.18)_55%,rgba(100,10,10,0.10)_100%)]',
              'text-white',
              'shadow-[0_4px_20px_rgba(180,20,20,0.20),inset_0_1px_0_rgba(255,255,255,0.07)]',
            ]
          : [
              'border-transparent',
              'text-[#8b9ab4]',
              'hover:border-[rgba(255,255,255,0.08)]',
              'hover:bg-[rgba(255,255,255,0.04)]',
              'hover:text-white',
            ],
      )}
    >
      {item.icon && (
        <span
          className={cn(
            'shrink-0 transition-colors',
            looksActive ? 'text-[#ef4444]' : 'text-[#5d6a82] group-hover:text-[#8b9ab4]',
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
            looksActive
              ? 'border-[rgba(220,38,38,0.40)] bg-[rgba(180,20,20,0.30)] text-red-200'
              : 'border-white/10 bg-black/30 text-[#5d6a82] group-hover:text-white',
          )}
        >
          {item.badgeCount}
        </span>
      )}

      {/*
        Thin loading bar across the bottom edge while pending. Pure CSS,
        absolutely positioned so it never causes layout shift. Only mounts
        when pending — the active-but-not-pending case shows nothing here.
      */}
      {pending && !isActive && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-3 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/10"
        >
          <span className="block h-full w-1/3 animate-[sidebar-pending_900ms_ease-in-out_infinite] rounded-full bg-[#ef4444]" />
        </span>
      )}
    </span>
  );
}

function NavLink({
  item,
  isActive,
  onNavigate,
  onIntent,
}: {
  item: NavigationItem;
  isActive: boolean;
  onNavigate?: () => void;
  onIntent: (href: string) => void;
}) {
  const trigger = () => {
    if (!isActive) onIntent(item.href);
  };

  // onClick fires synchronously BEFORE Next.js starts the route transition,
  // so calling onNavigate() here closes the mobile drawer instantly — the
  // backdrop slides away on the same frame as the click, regardless of how
  // long the new page takes to render on the server.
  const handleClick = () => {
    onNavigate?.();
  };

  return (
    <Link
      href={item.href}
      onClick={handleClick}
      onMouseEnter={trigger}
      onFocus={trigger}
      onTouchStart={trigger}
      prefetch={false}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400/60 rounded-xl"
    >
      <NavLinkContent item={item} isActive={isActive} />
    </Link>
  );
}

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const prefetchedRef = useRef<Set<string>>(new Set());

  const handleIntent = (href: string) => {
    if (href === pathname) return;
    if (prefetchedRef.current.has(href)) return;
    prefetchedRef.current.add(href);
    router.prefetch(href);
  };

  return (
    <nav className="space-y-1">
      {/*
        Keyframes for the pending bar — kept inline so the component is
        fully self-contained and we don't have to touch the global stylesheet.
      */}
      <style>{`
        @keyframes sidebar-pending {
          0%   { transform: translateX(-100%); }
          50%  { transform: translateX(150%); }
          100% { transform: translateX(350%); }
        }
      `}</style>
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== '/' && pathname.startsWith(`${item.href}/`));

        return (
          <NavLink
            key={item.href}
            item={item}
            isActive={isActive}
            onNavigate={onNavigate}
            onIntent={handleIntent}
          />
        );
      })}
    </nav>
  );
}
