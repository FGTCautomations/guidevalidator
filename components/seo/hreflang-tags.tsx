/**
 * Hreflang Tags Component
 * Generates alternate language links for SEO
 * https://developers.google.com/search/docs/specialty/international/localized-versions
 */

import { locales, type SupportedLocale } from "@/i18n/config";

interface HreflangTagsProps {
  currentLocale: SupportedLocale;
  pathname: string;
}

export function HreflangTags({ currentLocale, pathname }: HreflangTagsProps) {
  // Remove locale prefix from pathname to get the base path
  const pathSegments = pathname.split("/").filter(Boolean);
  const basePath = pathSegments.slice(1).join("/"); // Remove first segment (locale)

  // Map locale codes to hreflang values
  const hreflangMap: Record<SupportedLocale, string> = {
    en: "en",
  };

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://guidevalidator.com";

  return (
    <>
      {/* Generate alternate links for all locales */}
      {locales.map((locale) => {
        const url = `${baseUrl}/${locale}${basePath ? `/${basePath}` : ""}`;
        return (
          <link
            key={locale}
            rel="alternate"
            hrefLang={hreflangMap[locale]}
            href={url}
          />
        );
      })}

      {/* x-default should point to default language (English) */}
      <link
        rel="alternate"
        hrefLang="x-default"
        href={`${baseUrl}/en${basePath ? `/${basePath}` : ""}`}
      />

      {/* Canonical URL pointing to current language version */}
      <link
        rel="canonical"
        href={`${baseUrl}/${currentLocale}${basePath ? `/${basePath}` : ""}`}
      />
    </>
  );
}
