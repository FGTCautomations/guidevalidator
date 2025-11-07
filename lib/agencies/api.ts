// API client for Agency Search

export interface AgencySearchParams {
  country: string;
  regionId?: string;
  cityId?: string;
  languages?: string[];
  specialties?: string[];
  nicheFocus?: string[];
  q?: string;
  minRating?: number;
  licenseOnly?: boolean;
  sort?: "featured" | "rating";
  cursor?: string;
  limit?: number;
}

export interface AgencyResult {
  id: string;
  name: string;
  logo_url: string | null;
  website_url: string | null;
  country_code: string;
  languages: string[];
  specialties: string[];
  rating: number;
  review_count: number;
}

export interface FacetCount {
  value: string;
  count: number;
}

export interface AgencySearchResponse {
  results: AgencyResult[];
  facets: {
    languages: FacetCount[];
    specialties: FacetCount[];
    total: number;
  };
  nextCursor?: string;
}

export async function searchAgencies(
  params: AgencySearchParams
): Promise<AgencySearchResponse> {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/agencies-search`
  );

  // Build query string
  url.searchParams.set("country", params.country);
  if (params.regionId) url.searchParams.set("region", params.regionId);
  if (params.cityId) url.searchParams.set("city", params.cityId);
  if (params.languages?.length)
    url.searchParams.set("lang", params.languages.join(","));
  if (params.specialties?.length)
    url.searchParams.set("specialties", params.specialties.join(","));
  if (params.nicheFocus?.length)
    url.searchParams.set("nicheFocus", params.nicheFocus.join(","));
  if (params.q) url.searchParams.set("q", params.q);
  if (params.minRating)
    url.searchParams.set("minRating", String(params.minRating));
  if (params.licenseOnly) url.searchParams.set("licenseOnly", "true");
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
    throw new Error(error.error || "Failed to search agencies");
  }

  return response.json();
}
