import { redirect } from "next/navigation";

import { LocaleRedirect } from "@/components/locale-redirect";
import { getAuthSession } from "@/lib/get-session";
import { getDashboardPathByRole } from "@/lib/dashboard-path";
import { getSavedLocaleFromCookie } from "@/lib/locale-routing";
import type { Role } from "@prisma/client";

export default async function LoginRedirectPage() {
  // If a logged-in user lands here, skip the /login round-trip and go straight
  // to their dashboard — saves one redirect hop.
  const session = await getAuthSession();

  if (session?.user?.role) {
    redirect(getDashboardPathByRole(session.user.role as Role));
  }

  const savedLocale = await getSavedLocaleFromCookie();

  if (savedLocale) {
    redirect(`/${savedLocale}/login`);
  }

  return <LocaleRedirect target="login" />;
}
