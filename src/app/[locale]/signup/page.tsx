import { redirect } from "next/navigation";

import { PremiumSignupForm } from "@/components/auth/premium-signup-form";
import { getAuthSession } from "@/lib/auth";
import { getDashboardPathByRole } from "@/lib/dashboard-path";
import { normalizeLocale } from "@/lib/i18n";

export default async function SignupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const resolvedLocale = normalizeLocale(locale);
  const session = await getAuthSession();

  if (session?.user?.role) {
    redirect(getDashboardPathByRole(session.user.role));
  }

  return <PremiumSignupForm locale={resolvedLocale} />;
}
