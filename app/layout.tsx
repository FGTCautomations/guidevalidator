import type { Metadata } from "next";
import { ReactNode } from "react";
import { getLocale } from "next-intl/server";
import { Roboto, Inter } from "next/font/google";
import Script from "next/script";
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
      <head>
        {/* Google Tag Manager */}
        <Script id="google-tag-manager" strategy="beforeInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-53RBKD2M');`}
        </Script>
      </head>
      <body className={`font-sans antialiased bg-background text-foreground ${roboto.variable} ${inter.variable}`}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-53RBKD2M"
            height="0"
            width="0"
            style={{ display: 'none', visibility: 'hidden' }}
          />
        </noscript>
        {/* Google Analytics */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-GB6WLL3JHB"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GB6WLL3JHB');
          `}
        </Script>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}

