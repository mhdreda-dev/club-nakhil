import { AlertTriangle } from "lucide-react";
import { Role } from "@prisma/client";
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAuthSession } from '@/lib/auth';
import { getLoginErrorMessage } from "@/lib/auth-errors";
import { getServerTranslations } from "@/lib/server-translations";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const [{ locale }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const { t } = await getServerTranslations(locale);
  const session = await getAuthSession();
  const errorParam = resolvedSearchParams.error;
  const errorCode = Array.isArray(errorParam) ? errorParam[0] : errorParam;
  const errorMessage = errorCode ? getLoginErrorMessage(errorCode, t) : null;

  if (session) {
    const role = session.user?.role;
    if (role === Role.ADMIN) redirect(`/${locale}/admin/dashboard`);
    if (role === Role.COACH) redirect(`/${locale}/coach/dashboard`);
    if (role === Role.MEMBER) redirect(`/${locale}/member/dashboard`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Club Nakhil
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("auth.welcomeBack")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          {errorMessage ? (
            <div className="mb-5 flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-400/25 dark:bg-rose-500/10 dark:text-rose-100">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          <form className="space-y-6" action="/api/auth/signin" method="POST">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("auth.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t("auth.placeholders.email")}
                aria-label={t("auth.email")}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t("auth.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t("auth.placeholders.password")}
                aria-label={t("auth.password")}
              />
            </div>

            <div className="grid gap-3 sm:flex sm:items-center sm:justify-between">
              <label className="flex shrink-0 items-center cursor-pointer">
                <input type="checkbox" name="remember" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                <span className="ms-2 text-sm text-gray-600 dark:text-gray-400">
                  {t("auth.rememberMe")}
                </span>
              </label>
              <Link
                href={`/${locale}/forgot-password`}
                className="justify-self-start text-sm font-medium text-slate-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-blue-600 dark:text-slate-200 dark:decoration-slate-500 dark:hover:text-blue-300 sm:justify-self-auto"
              >
                {t("auth.forgotPassword")}
              </Link>
            </div>

            <button type="submit" className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
              {t("auth.signIn")}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t("auth.noAccount")}{' '}
            <Link href={`/${locale}/signup`} className="text-blue-600 hover:text-blue-500 font-medium">
              {t("auth.signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
