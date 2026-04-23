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

export async function getRequestLocale() {
  const headerStore = await headers();
  const localeFromHeader = headerStore.get("x-cn-locale");

  if (localeFromHeader) {
    return normalizeLocale(localeFromHeader);
  }

  const cookieStore = await cookies();
  return normalizeLocale(cookieStore.get(localeCookieName)?.value);
}

export async function getServerTranslations(locale?: string | null) {
  const resolvedLocale = locale ? normalizeLocale(locale) : await getRequestLocale();
  const messages = await getDictionary(resolvedLocale);

  return {
    locale: resolvedLocale,
    intlLocale: getIntlLocale(resolvedLocale),
    dir: getDirection(resolvedLocale),
    messages,
    t: createTranslator(messages),
  };
}

export async function getServerTranslator(locale?: Locale | string | null) {
  const { t } = await getServerTranslations(locale);
  return t;
}
