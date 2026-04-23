import type { Metadata, Viewport } from "next";
import { Cairo, Exo_2, Rajdhani } from "next/font/google";

import "./globals.css";

import { TranslationsProvider } from "@/components/providers/translations-provider";
import { getServerTranslations } from "@/lib/server-translations";

const bodyFont = Exo_2({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const headingFont = Rajdhani({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-heading",
  display: "swap",
});

const arabicFont = Cairo({
  subsets: ["arabic"],
  variable: "--font-arabic",
  display: "swap",
});

const metadataBase = process.env.NEXTAUTH_URL
  ? new URL(process.env.NEXTAUTH_URL)
  : new URL("http://localhost:3000");

export const metadata: Metadata = {
  title: {
    default: "Club Nakhil · Coach Rabah",
    template: "%s | Club Nakhil",
  },
  description:
    "Official private training platform for Club Nakhil kickboxing — Coach Rabah.",
  applicationName: "Club Nakhil",
  metadataBase,
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"],
    apple: [{ url: "/club-nakhil-logo.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "Club Nakhil · Coach Rabah",
    description: "Official kickboxing training platform of Club Nakhil.",
    images: ["/club-nakhil-logo.svg"],
  },
};

export const viewport: Viewport = {
  themeColor: "#05070c",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { locale, dir, messages } = await getServerTranslations();

  return (
    <html lang={locale} dir={dir} suppressHydrationWarning>
      <body
        className={[
          bodyFont.variable,
          headingFont.variable,
          arabicFont.variable,
          locale === "ar" ? "cn-rtl" : "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <TranslationsProvider locale={locale} dictionary={messages}>
          {children}
        </TranslationsProvider>
      </body>
    </html>
  );
}
