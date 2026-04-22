import type { Metadata, Viewport } from "next";
import { Exo_2, Rajdhani } from "next/font/google";

import "./globals.css";

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

const metadataBase = (() => {
  try {
    return new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000");
  } catch {
    return new URL("http://localhost:3000");
  }
})();

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${bodyFont.variable} ${headingFont.variable}`}>{children}</body>
    </html>
  );
}
