import type { Metadata } from 'next';
import { LocaleSwitcher } from '@/components/locale-switcher';

export const metadata: Metadata = {
  title: 'Club Nakhil',
  description: 'Club Nakhil',
};

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 h-16 border-b border-gray-200 bg-white px-4 dark:border-gray-800 dark:bg-gray-900 md:px-6">
        <div className="flex h-full items-center justify-between gap-4">
          <div className="font-bold text-xl text-gray-900 dark:text-white">
            Club Nakhil
          </div>
          <LocaleSwitcher />
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
