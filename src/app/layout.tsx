import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: {
    default: "Club Nakhil · Coach Rabah",
    template: "%s | Club Nakhil",
  },
  description:
    "Official private training platform for Club Nakhil kickboxing — Coach Rabah.",
  applicationName: "Club Nakhil",
  themeColor: "#05070c",
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
