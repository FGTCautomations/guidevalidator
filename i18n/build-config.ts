/**
 * Build Configuration for i18n
 * Optimizes build time by prioritizing high-traffic locales
 */

import { type SupportedLocale } from "./config";

// Locales to pre-generate at build time (high-traffic)
export const priorityLocales: SupportedLocale[] = ["en"];

// Locales to generate on-demand (lower traffic)
export const onDemandLocales: SupportedLocale[] = [];

/**
 * Check if a locale should be pre-rendered at build time
 */
export function shouldPrerender(locale: SupportedLocale): boolean {
  return priorityLocales.includes(locale);
}

/**
 * Get locales for static generation based on environment
 */
export function getStaticGenLocales(): SupportedLocale[] {
  // Only generate English
  return ["en"];
}

/**
 * ISR (Incremental Static Regeneration) configuration
 */
export const isrConfig = {
  // Revalidate pages every 1 hour (3600 seconds)
  revalidate: 3600,

  // Enable on-demand revalidation
  onDemandRevalidation: true,
} as const;
