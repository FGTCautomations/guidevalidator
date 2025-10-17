import type { DirectoryListing, DirectorySegment } from "./types";

const listings: Record<DirectorySegment, DirectoryListing[]> = {
  guides: [
    {
      id: "guide-berlin-1",
      name: "Lina Schneider",
      headline: "Cultural historian | Berlin & Potsdam",
      location: "Berlin, Germany",
      countryCode: "DE",
      city: "Berlin",
      rating: 4.9,
      reviewsCount: 128,
      tags: ["History", "Architecture", "Multilingual"],
      verified: true,
      href: "/profiles/guide/lina-schneider",
    },
    {
      id: "guide-tokyo-1",
      name: "Kenji Nakamura",
      headline: "Licensed guide for Kanto region",
      location: "Tokyo, Japan",
      countryCode: "JP",
      city: "Tokyo",
      rating: 4.8,
      reviewsCount: 92,
      tags: ["Food tours", "Corporate", "English/Japanese"],
      verified: true,
      href: "/profiles/guide/kenji-nakamura",
    },
  ],
  agencies: [
    {
      id: "agency-atlas-1",
      name: "Atlas Travel Group",
      headline: "North America specialists with 24/7 concierge",
      location: "Chicago, United States",
      countryCode: "US",
      city: "Chicago",
      rating: 4.8,
      reviewsCount: 76,
      tags: ["Corporate", "Luxury", "Groups"],
      verified: true,
      href: "/profiles/agency/atlas-travel-group",
    },
  ],
  dmcs: [
    {
      id: "dmc-barcelona-1",
      name: "Catalunya Experiences",
      headline: "Destination management across Barcelona & Girona",
      location: "Barcelona, Spain",
      countryCode: "ES",
      city: "Barcelona",
      rating: 4.7,
      reviewsCount: 54,
      tags: ["Luxury", "Group travel", "Events"],
      verified: true,
      href: "/profiles/dmc/catalunya-experiences",
    },
  ],
  transport: [
    {
      id: "transport-berlin-1",
      name: "Emerald Sprinters",
      headline: "Premium sprinters with bilingual drivers",
      location: "Berlin, Germany",
      countryCode: "DE",
      city: "Berlin",
      rating: 4.6,
      reviewsCount: 37,
      tags: ["Wheelchair accessible", "Airport transfers"],
      verified: true,
      href: "/profiles/transport/emerald-sprinters",
    },
  ],
};

export async function getDirectoryListings(segment: DirectorySegment): Promise<DirectoryListing[]> {
  // In production, replace with Supabase queries + filters.
  return listings[segment] ?? listings.guides;
}

export function listDirectorySegments(): DirectorySegment[] {
  return Object.keys(listings) as DirectorySegment[];
}
