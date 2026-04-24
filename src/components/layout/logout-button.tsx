'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useTranslations } from '@/components/providers/translations-provider';
import { cn } from '@/lib/utils';

type LogoutButtonProps = {
  className?: string;
  compact?: boolean;
};

export function LogoutButton({ className, compact = false }: LogoutButtonProps) {
  const { t } = useTranslations();

  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: '/login' })}
      className={cn(
        // Always visible — explicit dark bg, clear border, readable text
        'group inline-flex items-center gap-2 rounded-xl',
        'border border-white/10 bg-[rgba(255,255,255,0.05)]',
        'px-3 py-2.5',
        'text-sm font-semibold text-[#cfd8ea]',
        'transition-all duration-200',
        'hover:border-rose-400/35 hover:bg-[rgba(220,38,38,0.12)] hover:text-rose-100',
        'active:scale-[0.975]',
        // Make sure it never collapses to zero height
        'min-h-[40px]',
        className,
      )}
      aria-label={t('layout.logout.ariaLabel')}
    >
      <LogOut className="h-4 w-4 shrink-0 transition-transform duration-200 group-hover:-translate-x-0.5" />
      {/* Always show label — compact just controls sm breakpoint on desktop */}
      <span className={compact ? 'inline' : 'hidden sm:inline'}>
        {t('layout.logout.label')}
      </span>
    </button>
  );
}