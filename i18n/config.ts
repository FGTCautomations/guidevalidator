export const locales = ["en"] as const;

export type SupportedLocale = (typeof locales)[number];

export const defaultLocale: SupportedLocale = "en";

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locales.includes(locale as SupportedLocale);
}

export function getDirection(locale: SupportedLocale) {
  return "ltr";
}

export const localeLabels: Record<SupportedLocale, string> = {
  en: "English",
};
