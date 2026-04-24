'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Avatar } from '@/components/ui/avatar';
import { BrandLogo } from '@/components/brand-logo';
import { SidebarNav, type NavigationItem } from '@/components/layout/sidebar-nav';
import { LogoutButton } from '@/components/layout/logout-button';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';

type MobileNavProps = {
  items: NavigationItem[];
  userName: string;
  avatarUrl?: string | null;
  roleLabel: string;
};

export function MobileNav({ items, userName, avatarUrl, roleLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);   // controls CSS transition
  const { dir, t } = useTranslations();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isRtl = dir === 'rtl';

  /* ── lock body scroll ── */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      // Defer 1 frame so the element is mounted before we trigger the transition
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      // Wait for slide-out before unmounting
      const timer = setTimeout(() => {
        document.body.style.overflow = '';
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [open]);

  /* ── cleanup on unmount ── */
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  /* ── close on Escape ── */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  return (
    <>
      {/* Hamburger trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('layout.mobileNav.open')}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#cfd8ea] transition hover:border-white/20 hover:bg-white/10 hover:text-white lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Portal-style overlay + drawer — only in DOM when open */}
      {open && (
        <div
          className="fixed inset-0 lg:hidden"
          style={{ zIndex: 9999 }}
          role="dialog"
          aria-modal="true"
          aria-label={t('layout.mobileNav.open')}
        >
          {/* ── Backdrop ── */}
          <div
            className="absolute inset-0 transition-opacity duration-300"
            style={{
              background: 'rgba(0,0,0,0.78)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              opacity: visible ? 1 : 0,
            }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* ── Drawer panel ── */}
          <div
            ref={drawerRef}
            className="absolute top-0 flex flex-col overflow-hidden"
            style={{
              // Positioning: snap flush to the correct edge
              [isRtl ? 'right' : 'left']: 0,
              top: 0,
              bottom: 0,
              // Width: fills most of the screen up to 360 px
              width: 'min(88vw, 360px)',
              // Background
              background: 'linear-gradient(180deg, #090b10 0%, #080a0e 100%)',
              borderRight: isRtl ? 'none' : '1px solid rgba(255,255,255,0.08)',
              borderLeft: isRtl ? '1px solid rgba(255,255,255,0.08)' : 'none',
              boxShadow: '0 0 80px rgba(0,0,0,0.8)',
              // Slide animation
              transform: visible
                ? 'translateX(0)'
                : isRtl
                  ? 'translateX(100%)'
                  : 'translateX(-100%)',
              transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
              // Stack above backdrop
              zIndex: 10000,
            }}
          >
            {/* ── Header ── */}
            <div
              className="shrink-0 border-b border-white/8 px-4 pb-3 pt-4"
              style={{ borderBottomColor: 'rgba(255,255,255,0.08)' }}
            >
              <div className="flex items-center justify-between gap-3">
                <BrandLogo compact />
                <div className="flex items-center gap-2">
                  <LocaleSwitcher />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t('layout.mobileNav.close')}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#8b9ab4] transition hover:border-white/20 hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* ── User identity card ── */}
            <div className="shrink-0 px-4 py-3">
              <div
                className="flex items-center gap-3 rounded-2xl p-3"
                style={{
                  border: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(0,0,0,0.30)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                }}
              >
                <Avatar name={userName} avatarUrl={avatarUrl} size="md" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">{userName}</p>
                  <p
                    className="mt-0.5 text-[10px] uppercase tracking-[0.22em]"
                    style={{ color: 'rgba(252,165,165,0.75)' }}
                  >
                    {roleLabel}
                  </p>
                </div>
              </div>
            </div>

            {/* ── Navigation — scrollable ── */}
            <div
              className="min-h-0 flex-1 overflow-y-auto px-3 pb-2"
              style={{
                // Slight fade at bottom to indicate scrollability
                maskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)',
              }}
            >
              <SidebarNav items={items} onNavigate={() => setOpen(false)} />
            </div>

            {/* ── Logout — always pinned at bottom ── */}
            <div
              className="shrink-0 px-4 pb-4 pt-3"
              style={{
                borderTop: '1px solid rgba(255,255,255,0.08)',
                // Safe area for iPhone home bar
                paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
              }}
            >
              <LogoutButton className="w-full justify-center" compact />
            </div>
          </div>
        </div>
      )}
    </>
  );
}