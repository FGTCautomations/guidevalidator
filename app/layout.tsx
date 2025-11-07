import type { Metadata } from "next";
import { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { Roboto, Inter } from "next/font/google";
import "./globals.css";
import "@/styles/anti-scraping.css";
import { AppProviders } from "./providers";
import { defaultLocale, getDirection, isSupportedLocale, type SupportedLocale } from "@/i18n/config";

// Brand fonts
const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-roboto-stack",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-inter-stack",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Find Verified Tour Guides, DMCs & Travel Agencies Worldwide | GuideValidator",
  description:
    "Discover verified tour guides, travel agencies, DMCs, and transportation partners — all in one place. Join the world's trusted marketplace for verified travel professionals.",
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
      <body className={`font-sans antialiased bg-background text-foreground ${roboto.variable} ${inter.variable}`}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

