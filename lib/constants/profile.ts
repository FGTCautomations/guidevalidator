export const PROFILE_LANGUAGE_CODES = [
  "en",
  "es",
  "fr",
  "de",
  "it",
  "pt",
  "zh",
  "ja",
  "ko",
  "ar",
  "ru",
  "hi",
  "ur"
] as const;

// Consolidated tour specializations (merged from previous tour types + expertise areas)
export const GUIDE_SPECIALTY_OPTIONS = [
  // Heritage & Culture
  "History & heritage sites",
  "Art & architecture",
  "Religious & pilgrimage tours",
  "Cultural immersion experiences",

  // Food & Lifestyle
  "Food & gastronomy tours",
  "Wine & beverage experiences",
  "Shopping & markets",
  "Nightlife & entertainment",

  // Nature & Adventure
  "Nature & wildlife tours",
  "Adventure & active experiences",
  "Outdoor activities & hiking",
  "Photography tours",

  // Specialized Experiences
  "Wellness & spa retreats",
  "Family-friendly tours",
  "Luxury & VIP experiences",
  "Accessible travel services",
  "Educational workshops & classes"
] as const;

export const ORGANIZATION_SPECIALTY_OPTIONS = [
  "Inbound DMC",
  "Outbound DMC",
  "Corporate travel",
  "MICE",
  "Logistics & transport",
  "Luxury travel",
  "Group travel",
  "Sports & events",
  "Adventure operations",
  "Cruise shore support"
] as const;
