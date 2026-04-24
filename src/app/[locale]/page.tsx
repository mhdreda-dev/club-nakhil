import { redirect } from "next/navigation";

import { getAuthSession } from "@/lib/auth";
import { getDashboardPathByRole } from "@/lib/dashboard-path";
import { normalizeLocale } from "@/lib/i18n";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const session = await getAuthSession();
  const resolvedLocale = normalizeLocale(locale);

  if (session?.user?.role) {
    redirect(getDashboardPathByRole(session.user.role));
  }

  redirect(`/${resolvedLocale}/login`);
}
