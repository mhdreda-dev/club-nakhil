import { redirect } from "next/navigation";

import { LocaleRedirect } from "@/components/locale-redirect";
import { getSavedLocaleFromCookie } from "@/lib/locale-routing";

export default async function SignupRedirectPage() {
  const savedLocale = await getSavedLocaleFromCookie();

  if (savedLocale) {
    redirect(`/${savedLocale}/signup`);
  }

  return <LocaleRedirect target="signup" />;
}
