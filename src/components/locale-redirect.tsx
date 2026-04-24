import {
  defaultLocale,
  localeCookieName,
  localeStorageKey,
  locales,
  type Locale,
} from "@/lib/i18n";

type LocaleRedirectProps = {
  fallbackLocale?: Locale;
  target?: "root" | "login" | "signup";
};

function buildTargetPath(locale: Locale, target: NonNullable<LocaleRedirectProps["target"]>) {
  if (target === "root") {
    return `/${locale}`;
  }

  return `/${locale}/${target}`;
}

export function LocaleRedirect({
  fallbackLocale = defaultLocale,
  target = "root",
}: LocaleRedirectProps) {
  const fallbackPath = buildTargetPath(fallbackLocale, target);
  const inlineScript = `
    (function () {
      try {
        var storedLocale = window.localStorage.getItem(${JSON.stringify(localeStorageKey)});
        var supportedLocales = ${JSON.stringify(locales)};
        var resolvedLocale = supportedLocales.indexOf(storedLocale) >= 0 ? storedLocale : ${JSON.stringify(fallbackLocale)};
        document.cookie = ${JSON.stringify(
          `${localeCookieName}=`,
        )} + resolvedLocale + '; path=/; max-age=31536000; samesite=lax';
        window.location.replace(${JSON.stringify(
          target === "root" ? "/" : "",
        )} + '/' + resolvedLocale + ${JSON.stringify(target === "root" ? "" : `/${target}`)});
      } catch (error) {
        window.location.replace(${JSON.stringify(fallbackPath)});
      }
    })();
  `;

  return (
    <main className="flex min-h-screen items-center justify-center bg-club-background text-club-text-soft">
      <script dangerouslySetInnerHTML={{ __html: inlineScript }} />
      <noscript>
        <meta httpEquiv="refresh" content={`0;url=${fallbackPath}`} />
      </noscript>
      <p className="text-sm">Redirecting...</p>
    </main>
  );
}
