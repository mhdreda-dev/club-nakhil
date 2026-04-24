"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  createTranslator,
  getDirection,
  isLocale,
  localeCookieName,
  localeStorageKey,
  normalizeLocale,
  type Dictionary,
  type Direction,
  type Locale,
  type MessageKey,
  type TranslationValues,
} from "@/lib/i18n";

type TranslationsContextValue = {
  locale: Locale;
  dir: Direction;
  dictionary: Dictionary;
  t: (key: MessageKey, values?: TranslationValues) => string;
  setLocale: (locale: Locale) => void;
  localeOptions: Array<{ code: Locale; label: string; nativeName: string }>;
};

const TranslationsContext = createContext<TranslationsContextValue | null>(null);

type TranslationsProviderProps = {
  children: ReactNode;
  locale: Locale;
  dictionary: Dictionary;
};

export function TranslationsProvider({
  children,
  locale: initialLocale,
  dictionary,
}: TranslationsProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [locale, setLocaleState] = useState(initialLocale);

  useEffect(() => {
    setLocaleState(initialLocale);
  }, [initialLocale]);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = getDirection(locale);
    document.body.classList.toggle("cn-rtl", locale === "ar");
  }, [locale]);

  const setLocale = useCallback(
    (nextLocale: Locale) => {
      const resolvedLocale = normalizeLocale(nextLocale);
      const queryString = searchParams.toString();
      const currentPathname = pathname ?? "/";
      const pathSegments = currentPathname.split("/");
      const hasLocaleSegment = Boolean(pathSegments[1] && isLocale(pathSegments[1]));
      let nextPath = currentPathname;

      document.cookie = `${localeCookieName}=${resolvedLocale}; path=/; max-age=31536000; samesite=lax`;
      window.localStorage.setItem(localeStorageKey, resolvedLocale);

      setLocaleState(resolvedLocale);
      document.documentElement.lang = resolvedLocale;
      document.documentElement.dir = getDirection(resolvedLocale);
      document.body.classList.toggle("cn-rtl", resolvedLocale === "ar");

      if (hasLocaleSegment) {
        pathSegments[1] = resolvedLocale;
        nextPath = pathSegments.join("/") || "/";
      } else if (currentPathname === "/") {
        nextPath = `/${resolvedLocale}/login`;
      }

      const nextHref = queryString ? `${nextPath}?${queryString}` : nextPath;

      startTransition(() => {
        if (hasLocaleSegment || currentPathname === "/") {
          router.push(nextHref);
          return;
        }

        router.refresh();
      });
    },
    [pathname, router, searchParams],
  );

  const value = useMemo<TranslationsContextValue>(() => {
    const t = createTranslator(dictionary);

    return {
      locale,
      dir: getDirection(locale),
      dictionary,
      t,
      setLocale,
      localeOptions: [
        {
          code: "en",
          label: "EN",
          nativeName: t("locale.english"),
        },
        {
          code: "fr",
          label: "FR",
          nativeName: t("locale.french"),
        },
        {
          code: "ar",
          label: "AR",
          nativeName: t("locale.arabic"),
        },
      ],
    };
  }, [dictionary, locale, setLocale]);

  return (
    <TranslationsContext.Provider value={value}>
      {children}
    </TranslationsContext.Provider>
  );
}

export function useTranslations() {
  const context = useContext(TranslationsContext);

  if (!context) {
    throw new Error("useTranslations must be used within a TranslationsProvider");
  }

  return context;
}
