// API client for Guide Search V2

export interface GuideSearchParams {
  country: string;
  regionId?: string;
  cityId?: string;
  languages?: string[];
  specialties?: string[];
  genders?: string[];
  q?: string;
  priceMin?: number;
  priceMax?: number;
  minRating?: number;
  verified?: boolean;
  license?: boolean;
  sort?: "featured" | "rating" | "price";
  cursor?: string;
  limit?: number;
}

export interface GuideResult {
  id: string;
  name: string;
  headline?: string;
  country_code: string;
  avatar_url?: string;
  languages: string[];
  specialties: string[];
  verified: boolean;
  license_verified: boolean;
  has_liability_insurance: boolean;
  child_friendly: boolean;
  gender?: string;
  price_cents?: number;
  currency?: string;
  rating: number;
  review_count: number;
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface GuideSearchResponse {
  results: GuideResult[];
  facets: {
    languages: FacetCount[];
    specialties: FacetCount[];
    genders: FacetCount[];
    total: number;
  };
  nextCursor?: string;
}

export async function searchGuides(
  params: GuideSearchParams
): Promise<GuideSearchResponse> {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/guides-search`
  );

  // Build query string
  url.searchParams.set("country", params.country);
  if (params.regionId) url.searchParams.set("region", params.regionId);
  if (params.cityId) url.searchParams.set("city", params.cityId);
  if (params.languages?.length)
    url.searchParams.set("lang", params.languages.join(","));
  if (params.specialties?.length)
    url.searchParams.set("spec", params.specialties.join(","));
  if (params.genders?.length)
    url.searchParams.set("gender", params.genders.join(","));
  if (params.q) url.searchParams.set("q", params.q);
  if (params.priceMin) url.searchParams.set("min", String(params.priceMin));
  if (params.priceMax) url.searchParams.set("max", String(params.priceMax));
  if (params.minRating)
    url.searchParams.set("minRating", String(params.minRating));
  if (params.verified) url.searchParams.set("verified", "true");
  if (params.license) url.searchParams.set("license", "true");
  if (params.sort) url.searchParams.set("sort", params.sort);
  if (params.cursor) url.searchParams.set("cursor", params.cursor);
  if (params.limit) url.searchParams.set("limit", String(params.limit));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
    },
    // Disable Next.js caching - Edge Function handles caching
    cache: "no-store",
  });

  if (!response.ok) {
    const error = await response
      .json()
      .catch(() => ({ error: response.statusText }));
    throw new Error(error.error || "Failed to search guides");
  }

  return response.json();
}
