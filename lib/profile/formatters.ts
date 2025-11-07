import { getCountryName, getLanguageName } from "@/lib/utils/locale";
import type { GuideProfile } from "@/lib/profile/queries";

export function formatGuideProfile(profile: GuideProfile, locale: string) {
  return {
    ...profile,
    countryLabel: profile.countryCode ? getCountryName(locale, profile.countryCode) : undefined,
    languageLabels: profile.languages.map((language) => {
      // Strip quotes from the language code (data issue from import)
      const cleanLanguage = language.replace(/^["']|["']$/g, '').trim();
      return getLanguageName(locale, cleanLanguage) ?? cleanLanguage;
    }),
  };
}
