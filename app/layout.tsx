import type { Metadata } from "next";
import { ReactNode } from "react";
import { Inter } from "next/font/google";
import { getLocale } from "next-intl/server";
import "./globals.css";
import "@/styles/anti-scraping.css";
import { AppProviders } from "./providers";
import { defaultLocale, getDirection, isSupportedLocale, type SupportedLocale } from "@/i18n/config";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Guide Validator",
  description:
    "Marketplace connecting verified tour guides with agencies, DMCs, and transport partners.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const requestLocale = await getLocale();
  const locale: SupportedLocale = isSupportedLocale(requestLocale)
    ? requestLocale
    : defaultLocale;
  const direction = getDirection(locale);

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body className={`${inter.variable} antialiased bg-background text-foreground`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

