import { cache } from "react";

import { cookies, headers } from "next/headers";

import { getDictionary } from "@/lib/dictionaries";
import {
  createTranslator,
  getDirection,
  getIntlLocale,
  localeCookieName,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n";

// One header + cookie read per request, regardless of how many server components
// resolve the locale. The root layout, member layout, and page all call into
// this — without dedupe each one re-reads the request stores.
export const getRequestLocale = cache(async () => {
  const headerStore = await headers();
  const localeFromHeader = headerStore.get("x-cn-locale");

  if (localeFromHeader) {
    return normalizeLocale(localeFromHeader);
  }

  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(localeCookieName)?.value);
});

// Resolve + dictionary load shared across the whole request tree. The default
// (no explicit locale) call is the hot path; an explicit locale still resolves
// independently because cache() keys on arguments.
export const getServerTranslations = cache(async (locale?: string | null) => {
  const resolvedLocale = locale ? normalizeLocale(locale) : await getRequestLocale();
  const messages = await getDictionary(resolvedLocale);

  return {
    locale: resolvedLocale,
    intlLocale: getIntlLocale(resolvedLocale),
    dir: getDirection(resolvedLocale),
    messages,
    t: createTranslator(messages),
  };
});

export async function getServerTranslator(locale?: Locale | string | null) {
  const { t } = await getServerTranslations(locale);
  return t;
}
