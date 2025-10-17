import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, isSupportedLocale } from "./config";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locale && isSupportedLocale(locale) ? locale : defaultLocale;

  return {
    locale: resolvedLocale,
    messages: (await import(`../messages/${resolvedLocale}.json`)).default,
  };
});
