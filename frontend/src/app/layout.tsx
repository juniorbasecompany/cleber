import type { Metadata } from "next";
import { getLocale } from "next-intl/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Valora",
  description: "Frontend web app for the Valora system."
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const locale = await getLocale();

  return (
    <html lang={locale}>
      <body>{children}</body>
    </html>
  );
}
