import { redirect } from "next/navigation";

import { LocaleRedirect } from "@/components/locale-redirect";
import { getSavedLocaleFromCookie } from "@/lib/locale-routing";

export default async function RootPage() {
  const savedLocale = await getSavedLocaleFromCookie();

  if (savedLocale) {
    redirect(`/${savedLocale}/login`);
  }

  return <LocaleRedirect target="login" />;
}
