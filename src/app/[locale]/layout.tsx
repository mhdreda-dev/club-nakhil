import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Club Nakhil",
  description: "Club Nakhil",
};

export default function LocaleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
