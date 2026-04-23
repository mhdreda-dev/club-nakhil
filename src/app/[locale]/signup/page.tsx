import { getAuthSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Role } from '@prisma/client';
import { getServerTranslations } from "@/lib/server-translations";

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { t } = await getServerTranslations(locale);
  const session = await getAuthSession();

  if (session) {
    const role = session.user?.role;
    if (role === Role.ADMIN) redirect(`/${locale}/admin/dashboard`);
    if (role === Role.COACH) redirect(`/${locale}/coach/dashboard`);
    if (role === Role.MEMBER) redirect(`/${locale}/member/dashboard`);
    redirect(`/${locale}/dashboard`);
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Club Nakhil
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t("auth.createAccount")}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
          <form className="space-y-6" action="/api/auth/register" method="POST">
            <div>
              <label 
                htmlFor="fullName" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.fullName")}
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t("auth.placeholders.fullName")}
              />
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.email")}
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t("auth.placeholders.email")}
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.password")}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t("auth.placeholders.password")}
              />
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.confirmPassword")}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder={t("auth.placeholders.confirmPassword")}
              />
            </div>

            <div>
              <label 
                htmlFor="role" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                {t("auth.role")}
              </label>
              <select
                id="role"
                name="role"
                required
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="member">{t("roles.member")}</option>
                <option value="coach">{t("roles.coach")}</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t("auth.notes.accountReview")}
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t("auth.signUp")}
            </button>
          </form>

          <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
            {t("auth.signUp")} {t("common.by")} {t("auth.creatingAccount")}
            <br />
            <Link 
              href={`/${locale}/terms`} 
              className="text-blue-600 hover:text-blue-500 underline"
            >
              {t("common.termsOfService")}
            </Link>{' '}
            {t("common.and")}{' '}
            <Link 
              href={`/${locale}/privacy`} 
              className="text-blue-600 hover:text-blue-500 underline"
            >
              {t("common.privacyPolicy")}
            </Link>
          </p>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            {t("auth.hasAccount")}{' '}
            <Link
              href={`/${locale}/login`}
              className="text-blue-600 hover:text-blue-500 font-medium"
            >
              {t("auth.signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
