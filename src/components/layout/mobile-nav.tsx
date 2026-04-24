'use client';

import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '@/components/ui/avatar';
import { BrandLogo } from '@/components/brand-logo';
import { SidebarNav, type NavigationItem } from '@/components/layout/sidebar-nav';
import { LogoutButton } from '@/components/layout/logout-button';
import { LocaleSwitcher } from '@/components/locale-switcher';
import { useTranslations } from '@/components/providers/translations-provider';

type MobileNavProps = {
  items: NavigationItem[];
  userName: string;
  avatarUrl?: string | null;
  roleLabel: string;
};

export function MobileNav({ items, userName, avatarUrl, roleLabel }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false); // drives CSS transition
  const [mounted, setMounted] = useState(false); // true once we're on the client
  const { dir, t } = useTranslations();
  const drawerRef = useRef<HTMLDivElement>(null);
  const isRtl = dir === 'rtl';

  /* ── wait for client mount before using createPortal ── */
  useEffect(() => { setMounted(true); }, []);

  /* ── body scroll lock + transition trigger ── */
  useEffect(() => {
    if (!mounted) return;

    if (open) {
      // Lock scroll — also prevent iOS rubber-band scrolling behind drawer
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';
      // One RAF so element is painted before we start the slide-in
      const raf = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(raf);
    } else {
      setVisible(false);
      // Keep lock until slide-out finishes (300 ms), then unlock
      const timer = setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.touchAction = '';
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [open, mounted]);

  /* ── restore scroll on unmount ── */
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
    };
  }, []);

  /* ── Escape key ── */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  /* ────────────────────────────────────────────────────────────
     The drawer is teleported straight into <body> via a portal.
     This means it is NEVER a descendant of <header>, <aside>,
     or any element with backdrop-filter / transform / will-change
     that would break position:fixed.
  ──────────────────────────────────────────────────────────── */
  const drawerPortal =
    mounted && open
      ? createPortal(
          /*
           * Outermost wrapper:
           *   - fixed inset-0  → covers full viewport (not clipped by header)
           *   - h-dvh          → true full height on mobile (avoids address-bar gap)
           *   - isolate        → creates its own stacking context cleanly
           *   - z-[9999]       → above everything: header(z-30), sidebar(z-40), modals
           *   - pointer-events-none on wrapper so clicks pass through unless consumed
           */
          <div
            aria-modal="true"
            role="dialog"
            aria-label={t('layout.mobileNav.open')}
            style={{
              position: 'fixed',
              inset: 0,
              height: '100dvh',
              zIndex: 9999,
              isolation: 'isolate',
              // No pointer-events on the root; children opt-in
            }}
          >
            {/* ── Backdrop ── */}
            <div
              aria-hidden="true"
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0, 0, 0, 0.80)',
                backdropFilter: 'blur(6px)',
                WebkitBackdropFilter: 'blur(6px)',
                opacity: visible ? 1 : 0,
                transition: 'opacity 280ms ease',
                cursor: 'default',
              }}
            />

            {/* ── Drawer panel ── */}
            <div
              ref={drawerRef}
              style={{
                // Geometry — flush to the correct edge, full height
                position: 'absolute',
                top: 0,
                bottom: 0,
                height: '100dvh',
                [isRtl ? 'right' : 'left']: 0,
                width: 'min(88vw, 360px)',

                // Stacking — above the backdrop
                zIndex: 10000,

                // Layout — strict column so footer is always pinned
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',

                // Visuals
                background: 'linear-gradient(180deg, #090b10 0%, #080a0e 100%)',
                borderInlineEnd: isRtl ? 'none' : '1px solid rgba(255,255,255,0.08)',
                borderInlineStart: isRtl ? '1px solid rgba(255,255,255,0.08)' : 'none',
                boxShadow: '4px 0 60px rgba(0, 0, 0, 0.75)',

                // Slide animation — JS-controlled transform, no Tailwind class needed
                transform: visible
                  ? 'translateX(0)'
                  : isRtl
                  ? 'translateX(100%)'
                  : 'translateX(-100%)',
                transition: 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)',
              }}
            >
              {/* ── 1. Header row ── */}
              <div
                style={{
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.75rem',
                  padding: '1rem 1rem 0.75rem',
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <BrandLogo compact />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <LocaleSwitcher />
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label={t('layout.mobileNav.close')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '2rem',
                      height: '2rem',
                      borderRadius: '0.75rem',
                      border: '1px solid rgba(255,255,255,0.10)',
                      background: 'rgba(255,255,255,0.05)',
                      color: '#8b9ab4',
                      cursor: 'pointer',
                      transition: 'background 150ms, color 150ms',
                    }}
                  >
                    <X style={{ width: '1rem', height: '1rem' }} />
                  </button>
                </div>
              </div>

              {/* ── 2. User identity card ── */}
              <div style={{ flexShrink: 0, padding: '0.75rem 1rem' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem',
                    borderRadius: '1rem',
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(0,0,0,0.30)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  <Avatar name={userName} avatarUrl={avatarUrl} size="md" />
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.875rem',
                        fontWeight: 600,
                        color: '#ffffff',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {userName}
                    </p>
                    <p
                      style={{
                        margin: '0.125rem 0 0',
                        fontSize: '0.625rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.22em',
                        color: 'rgba(252,165,165,0.75)',
                      }}
                    >
                      {roleLabel}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── 3. Navigation — flex-1, scrollable ── */}
              <div
                style={{
                  flex: '1 1 0%',
                  minHeight: 0, // critical: allows flex child to shrink below content size
                  overflowY: 'auto',
                  overflowX: 'hidden',
                  padding: '0.25rem 0.75rem 0.5rem',
                  // Soft fade at the bottom edge hinting more items
                  maskImage:
                    'linear-gradient(to bottom, black calc(100% - 2rem), transparent 100%)',
                  WebkitMaskImage:
                    'linear-gradient(to bottom, black calc(100% - 2rem), transparent 100%)',
                  // Enable momentum scrolling on iOS
                  WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'],
                }}
              >
                <SidebarNav items={items} onNavigate={() => setOpen(false)} />
              </div>

              {/* ── 4. Logout — shrink-0, always at bottom ── */}
              <div
                style={{
                  flexShrink: 0,
                  padding: '0.75rem 1rem',
                  // safe-area-inset-bottom handles iPhone home indicator
                  paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                  borderTop: '1px solid rgba(255,255,255,0.08)',
                }}
              >
                <LogoutButton className="w-full justify-center" compact />
              </div>
            </div>
          </div>,
          document.body, // ← teleport out of any stacking context
        )
      : null;

  return (
    <>
      {/* Hamburger trigger — stays inside the header, just a button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={t('layout.mobileNav.open')}
        aria-expanded={open}
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-[#cfd8ea] transition hover:border-white/20 hover:bg-white/10 hover:text-white lg:hidden"
      >
        <Menu className="h-4 w-4" />
      </button>

      {/* Drawer teleported to <body> */}
      {drawerPortal}
    </>
  );
}