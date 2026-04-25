'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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

// Hover/touch-triggered prefetch: avoids the first-render request storm
// (one prefetch per nav item) while keeping navigation feeling instant —
// once the user shows intent we restore Next's default static prefetch.
function NavLink({
  item,
  isActive,
  onNavigate,
  className,
  children,
}: {
  item: NavigationItem;
  isActive: boolean;
  onNavigate?: () => void;
  className: string;
  children: React.ReactNode;
}) {
  const [warm, setWarm] = useState(false);
  const arm = () => {
    if (!warm) setWarm(true);
  };

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      onMouseEnter={arm}
      onFocus={arm}
      onTouchStart={arm}
      prefetch={isActive ? false : warm ? null : false}
      className={className}
    >
      {children}
    </Link>
  );
}

export function SidebarNav({ items, onNavigate }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
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
          </NavLink>
        );
      })}
    </nav>
  );
}