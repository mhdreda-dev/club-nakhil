import 'server-only';

import { defaultLocale, normalizeLocale } from "@/lib/i18n";
import type { Dictionary } from "@/lib/i18n";

const dictionaries = {
  en: () => import("@/messages/en.json").then((module) => module.default),
  fr: () => import("@/messages/fr.json").then((module) => module.default),
  ar: () => import("@/messages/ar.json").then((module) => module.default),
};

export const getDictionary = async (locale?: string | null): Promise<Dictionary> => {
  const resolvedLocale = normalizeLocale(locale);
  const loader = dictionaries[resolvedLocale] ?? dictionaries[defaultLocale];

  return loader();
};

export type { Dictionary };
