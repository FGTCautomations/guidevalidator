export const locales = [
  "en",
  "es",
  "fr",
  "de",
  "zh-Hans",
  "hi",
  "ur",
  "ar",
  "ko",
  "ja",
  "ru"
] as const;

export type SupportedLocale = (typeof locales)[number];

export const defaultLocale: SupportedLocale = "en";

export function isSupportedLocale(locale: string): locale is SupportedLocale {
  return locales.includes(locale as SupportedLocale);
}

const rtlLocales: SupportedLocale[] = ["ar", "ur"];

export function getDirection(locale: SupportedLocale) {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}

export const localeLabels: Record<SupportedLocale, string> = {
  en: "English",
  es: "Espan\u00f1ol",
  fr: "Fran\u00e7ais",
  de: "Deutsch",
  "zh-Hans": "Chinese (Simplified)",
  hi: "Hindi",
  ur: "Urdu",
  ar: "Arabic",
  ko: "Korean",
  ja: "Japanese",
  ru: "Russian",
};
