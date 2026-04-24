import { cookies } from "next/headers";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  type Locale,
} from "@/lib/i18n";

export async function getSavedLocaleFromCookie() {
  const cookieStore = await cookies();
  const savedLocale = cookieStore.get(localeCookieName)?.value;

  if (savedLocale && isLocale(savedLocale)) {
    return savedLocale;
  }

  return null;
}

export async function getFallbackLocale(): Promise<Locale> {
  return (await getSavedLocaleFromCookie()) ?? defaultLocale;
}
