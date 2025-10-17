import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { DirectoryFilters, DirectoryListing, DirectorySegment } from "./types";

type GuideRow = {
  profile_id: string;
  headline?: string | null;
  specialties?: string[] | null;
  spoken_languages?: string[] | null;
  hourly_rate_cents?: number | null;
  currency?: string | null;
  gender?: string | null;
  has_liability_insurance?: boolean | null;
  response_time_minutes?: number | null;
  profiles?: Array<{
    id: string;
    full_name?: string | null;
    country_code?: string | null;
    verified?: boolean | null;
    license_verified?: boolean | null;
  }> | null;
  guide_cities?: Array<{
    city_id?: string | null;
    cities?: {
      id?: string | null;
      name?: string | null;
      region_id?: string | null;
      country_code?: string | null;
    } | null;
  }> | null;
  guide_regions?: Array<{
    region_id?: string | null;
    regions?: {
      id?: string | null;
      name?: string | null;
      region_code?: string | null;
      country_code?: string | null;
    } | null;
  }> | null;
};

type GuideRatingsRow = {
  guide_id: string;
  average_service?: string | number | null;
  average_language?: string | number | null;
  average_knowledge?: string | number | null;
  average_fairness?: string | number | null;
  total_reviews?: number | null;
};

type AgencyRow = {
  id: string;
  name: string;
  coverage_summary?: string | null;
  country_code?: string | null;
  verified?: boolean | null;
  featured?: boolean | null;
  languages?: string[] | null;
  specialties?: string[] | null;
};

type LicensingRow = {
  country_code: string;
  guide_license_required: boolean;
  dmc_license_required: boolean;
  transport_license_required: boolean;
  authority_url?: string | null;
};

type Option = {
  value: string;
  label: string;
  meta?: Record<string, unknown>;
};

function fallbackLocation(code?: string | null) {
  if (!code) return "Unknown location";
  return code.toUpperCase();
}

async function fetchLicensingMap(codes: Array<string | null | undefined>): Promise<Map<string, LicensingRow>> {
  const unique = Array.from(new Set(codes.filter((value): value is string => Boolean(value))));
  if (unique.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("country_licensing_rules")
    .select(
      "country_code, guide_license_required, dmc_license_required, transport_license_required, authority_url"
    )
    .in("country_code", unique);

  if (error || !data) {
    if (error) {
      console.error("Failed to fetch licensing rules", error);
    }
    return new Map();
  }

  return data.reduce((map, row) => {
    map.set(row.country_code, row as LicensingRow);
    return map;
  }, new Map<string, LicensingRow>());
}

function applyLicensing(listings: DirectoryListing[], map: Map<string, LicensingRow>, segment: DirectorySegment) {
  listings.forEach((listing) => {
    if (!listing.countryCode) return;
    const rule = map.get(listing.countryCode);
    if (!rule) return;

    switch (segment) {
      case "guides":
        if (rule.guide_license_required) {
          listing.licenseRequired = true;
          listing.licenseAuthorityUrl = rule.authority_url ?? undefined;
        }
        break;
      case "agencies":
        break;
      case "dmcs":
        if (rule.dmc_license_required) {
          listing.licenseRequired = true;
          listing.licenseAuthorityUrl = rule.authority_url ?? undefined;
        }
        break;
      case "transport":
        if (rule.transport_license_required) {
          listing.licenseRequired = true;
          listing.licenseAuthorityUrl = rule.authority_url ?? undefined;
        }
        break;
      default:
        break;
    }
  });
}

function average(values: number[]): number | undefined {
  if (values.length === 0) {
    return undefined;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

async function resolveGuideLocationIds(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  filters: DirectoryFilters
): Promise<string[] | null> {
  const sets: Array<Set<string>> = [];

  if (filters.regionId) {
    const { data, error } = await supabase
      .from("guide_regions")
      .select("guide_id")
      .eq("region_id", filters.regionId);

    if (error) {
      console.error("Failed to fetch guide regions", error);
      return [];
    }

    sets.push(new Set((data ?? []).map((row) => row.guide_id).filter((value): value is string => Boolean(value))));
  }

  if (filters.cityId) {
    const { data, error } = await supabase
      .from("guide_cities")
      .select("guide_id")
      .eq("city_id", filters.cityId);

    if (error) {
      console.error("Failed to fetch guide cities", error);
      return [];
    }

    sets.push(new Set((data ?? []).map((row) => row.guide_id).filter((value): value is string => Boolean(value))));
  } else if (filters.city) {
    const { data: cityMatches, error: cityError } = await supabase
      .from("cities")
      .select("id")
      .ilike("name", `%${filters.city}%`)
      .limit(50);

    if (cityError) {
      console.error("Failed to resolve city name", cityError);
      return [];
    }

    const cityIds = (cityMatches ?? [])
      .map((row) => row.id)
      .filter((value): value is string => Boolean(value));

    if (cityIds.length > 0) {
      const { data: guideCityRows, error: guideCityError } = await supabase
        .from("guide_cities")
        .select("guide_id")
        .in("city_id", cityIds);

      if (guideCityError) {
        console.error("Failed to fetch guides for city names", guideCityError);
        return [];
      }

      sets.push(new Set((guideCityRows ?? []).map((row) => row.guide_id).filter((value): value is string => Boolean(value))));
    } else {
      return [];
    }
  }

  if (sets.length === 0) {
    return null;
  }

  let intersection = sets[0];
  for (const candidate of sets.slice(1)) {
    intersection = new Set([...intersection].filter((id) => candidate.has(id)));
    if (intersection.size === 0) {
      break;
    }
  }

  return Array.from(intersection);
}

async function fetchGuideRatingsMap(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  guideIds: string[]
): Promise<Map<string, { rating?: number; reviews?: number }>> {
  if (guideIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("guide_ratings_summary")
    .select(
      "guide_id, average_service, average_language, average_knowledge, average_fairness, total_reviews"
    )
    .in("guide_id", guideIds);

  if (error || !data) {
    if (error) {
      console.error("Failed to fetch guide ratings", error);
    }
    return new Map();
  }

  return data.reduce((map, row) => {
    const numericValues = [
      row.average_service,
      row.average_language,
      row.average_knowledge,
      row.average_fairness,
    ]
      .map((value) => {
        if (value === null || value === undefined) {
          return undefined;
        }
        const numeric = typeof value === "number" ? value : Number(value);
        return Number.isFinite(numeric) ? numeric : undefined;
      })
      .filter((value): value is number => value !== undefined);

    const rating = average(numericValues);
    map.set(row.guide_id, {
      rating,
      reviews: row.total_reviews ?? 0,
    });
    return map;
  }, new Map<string, { rating?: number; reviews?: number }>());
}

/**
 * Fetch review ratings from profile_ratings view
 */
async function fetchProfileRatingsMap(
  supabase: ReturnType<typeof getSupabaseServerClient>,
  profileIds: string[]
): Promise<Map<string, { avgOverallRating?: number | null; totalReviews?: number }>> {
  if (profileIds.length === 0) {
    return new Map();
  }

  const { data, error } = await supabase
    .from("profile_ratings")
    .select("reviewee_id, avg_overall_rating, total_reviews")
    .in("reviewee_id", profileIds);

  if (error || !data) {
    if (error) {
      console.error("Failed to fetch profile ratings", error);
    }
    return new Map();
  }

  return data.reduce((map, row) => {
    map.set(row.reviewee_id, {
      avgOverallRating: row.avg_overall_rating ?? null,
      totalReviews: row.total_reviews ?? 0,
    });
    return map;
  }, new Map<string, { avgOverallRating?: number | null; totalReviews?: number }>());
}

function computeGuideFeaturedScore(listing: DirectoryListing): number {
  let score = 0;
  if (listing.licenseVerified) {
    score += 1;
  }
  if (listing.verified) {
    score += 0.5;
  }
  if (listing.hasLiabilityInsurance) {
    score += 0.25;
  }
  if (listing.childFriendly) {
    score += 0.1;
  }
  return Number(score.toFixed(3));
}

export async function fetchDirectoryListings(
  segment: DirectorySegment,
  filters: DirectoryFilters = {}
): Promise<DirectoryListing[]> {
  const supabase = getSupabaseServerClient();

  if (segment === "guides") {
    const locationIds = await resolveGuideLocationIds(supabase, filters);
    if (locationIds !== null && locationIds.length === 0) {
      return [];
    }

    let query = supabase
      .from("guides")
      .select(
        `profile_id, headline, specialties, spoken_languages, hourly_rate_cents, currency, gender,
         has_liability_insurance, response_time_minutes, avatar_url,
         profiles!inner(id, full_name, country_code, verified, license_verified),
         guide_cities:guide_cities(city_id, cities(id, name, region_id, country_code)),
         guide_regions:guide_regions(region_id, regions(id, name, region_code, country_code))`
      )
      .order("license_verified", { ascending: false, referencedTable: "profiles" })
      .limit(200);

    const countryCode = (filters.country ?? filters.region)?.toUpperCase();
    if (countryCode) {
      query = query.eq("profiles.country_code", countryCode);
    }

    if (locationIds && locationIds.length > 0) {
      query = query.in("profile_id", locationIds);
    }

    if (filters.languages && filters.languages.length > 0) {
      query = query.contains(
        "spoken_languages",
        filters.languages.map((value) => value.toLowerCase())
      );
    }

    if (filters.specialties && filters.specialties.length > 0) {
      query = query.contains(
        "specialties",
        filters.specialties.map((value) => value.toLowerCase())
      );
    }

    if (filters.genders && filters.genders.length > 0) {
      query = query.in(
        "gender",
        filters.genders.map((value) => value.toLowerCase())
      );
    }

    if (filters.verifiedOnly) {
      query = query.eq("profiles.verified", true);
    }

    if (filters.licenseVerifiedOnly) {
      query = query.eq("profiles.license_verified", true);
    }

    if (filters.insuredOnly) {
      query = query.eq("has_liability_insurance", true);
    }

    if (filters.childFriendlyOnly) {
      query = query.contains("specialties", ["family-friendly"]);
    }

    if (typeof filters.minRate === "number") {
      query = query.gte("hourly_rate_cents", Math.round(filters.minRate * 100));
    }

    if (typeof filters.maxRate === "number") {
      query = query.lte("hourly_rate_cents", Math.round(filters.maxRate * 100));
    }

    const { data, error } = await query;

    if (error) {
      console.error("Failed to fetch guides", error);
      return [];
    }

    const rows = (data ?? []) as GuideRow[];
    if (rows.length === 0) {
      return [];
    }

    let profileIds = rows.map((row) => row.profile_id);

    // Filter by availability if date range is provided
    if (filters.availableFrom && filters.availableTo) {
      // Find guides who have blocked times during the requested period
      const { data: blockedSlots } = await supabase
        .from("availability_slots")
        .select("guide_id")
        .in("guide_id", profileIds)
        .or(
          `and(starts_at.lte.${filters.availableTo}T23:59:59,ends_at.gte.${filters.availableFrom}T00:00:00)`
        );

      // Remove guides with blocked times from the results
      const blockedGuideIds = new Set((blockedSlots || []).map((slot) => slot.guide_id));
      profileIds = profileIds.filter((id) => !blockedGuideIds.has(id));

      // If no guides available, return early
      if (profileIds.length === 0) {
        return [];
      }
    }

    const [ratingsMap, profileRatingsMap] = await Promise.all([
      fetchGuideRatingsMap(supabase, profileIds),
      fetchProfileRatingsMap(supabase, profileIds),
    ]);

    // Filter rows to match filtered profileIds (after availability filtering)
    const filteredRows = rows.filter((row) => profileIds.includes(row.profile_id));

    const listings = filteredRows.map<DirectoryListing>((row) => {
      const profileEntry = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles ?? null;
      const ratingInfo = ratingsMap.get(row.profile_id);
      const profileRatingInfo = profileRatingsMap.get(row.profile_id);
      const countryCodeValue = profileEntry?.country_code?.toUpperCase() ?? countryCode ?? null;

      const cityEntry = row.guide_cities?.find((entry) => entry?.cities?.name);
      const cityName = cityEntry?.cities?.name ?? null;
      const cityId = cityEntry?.cities?.id ?? cityEntry?.city_id ?? null;

      const regionEntry = row.guide_regions?.find((entry) => entry?.regions?.id || entry?.region_id);
      const regionId = regionEntry?.regions?.id ?? regionEntry?.region_id ?? null;

      const childFriendly = (row.specialties ?? []).some(
        (value) => value?.toLowerCase() === "family-friendly"
      );

      const hourlyRateCents = row.hourly_rate_cents ?? null;
      const hourlyRate = hourlyRateCents !== null ? Number((hourlyRateCents / 100).toFixed(2)) : null;

      const listing: DirectoryListing = {
        id: row.profile_id,
        name: profileEntry?.full_name ?? "Guide",
        headline: row.headline ?? undefined,
        location: cityName
          ? `${cityName}${countryCodeValue ? `, ${countryCodeValue}` : ""}`
          : fallbackLocation(countryCodeValue),
        countryCode: countryCodeValue,
        regionId: regionId ?? null,
        cityId: cityId ?? null,
        city: cityName ?? null,
        rating: ratingInfo?.rating,
        reviewsCount: ratingInfo?.reviews,
        languages: row.spoken_languages ?? undefined,
        specialties: row.specialties ?? undefined,
        tags: row.specialties ?? undefined,
        verified: Boolean(profileEntry?.verified),
        licenseVerified: Boolean(profileEntry?.license_verified),
        hasLiabilityInsurance: Boolean(row.has_liability_insurance ?? false),
        childFriendly,
        gender: row.gender ?? null,
        hourlyRateCents,
        hourlyRate,
        currency: row.currency ?? null,
        responseTimeMinutes: row.response_time_minutes ?? null,
        featuredScore: 0,
        href: `/profiles/guide/${row.profile_id}`,
        avatarUrl: undefined,
        // Review system fields
        avgOverallRating: profileRatingInfo?.avgOverallRating ?? null,
        totalReviews: profileRatingInfo?.totalReviews ?? 0,
      };

      listing.featuredScore = computeGuideFeaturedScore(listing);

      return listing;
    });

    // Sort: Featured profiles first (by score), then alphabetically by name
    listings.sort((a, b) => {
      // Primary sort: Featured score (higher is better)
      const aFeatured = a.featuredScore ?? 0;
      const bFeatured = b.featuredScore ?? 0;

      if (aFeatured > 0 || bFeatured > 0) {
        const featuredDiff = bFeatured - aFeatured;
        if (featuredDiff !== 0) {
          return featuredDiff;
        }
      }

      // Secondary sort: Alphabetically by name
      return a.name.localeCompare(b.name);
    });

    const licensingMap = await fetchLicensingMap(listings.map((listing) => listing.countryCode));
    applyLicensing(listings, licensingMap, segment);

    return listings;
  }

  const agencyType = segment === "agencies" ? "agency" : segment === "dmcs" ? "dmc" : "transport";
  const hrefBase =
    segment === "agencies"
      ? "/profiles/agency"
      : segment === "dmcs"
      ? "/profiles/dmc"
      : "/profiles/transport";

  let query = supabase
    .from("agencies")
    .select("id, name, coverage_summary, country_code, verified, featured, languages, specialties")
    .eq("type", agencyType)
    .order("featured", { ascending: false })
    .order("verified", { ascending: false })
    .order("name", { ascending: true })
    .limit(50);

  if (filters.region) {
    query = query.eq("country_code", filters.region);
  }

  if (filters.city) {
    const normalized = `%${filters.city}%`;
    query = query.or(`coverage_summary.ilike.${normalized},name.ilike.${normalized}`);
  }

  if (filters.verifiedOnly) {
    query = query.eq("verified", true);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Failed to fetch ${segment}`, error);
    return [];
  }

  const rows = (data ?? []) as AgencyRow[];

  // Fetch profile ratings for all agencies
  const profileRatingsMap = await fetchProfileRatingsMap(
    supabase,
    rows.map((row) => row.id)
  );

  const listings = rows.map<DirectoryListing>((row) => {
    const countryCode = row.country_code ?? null;
    const profileRatingInfo = profileRatingsMap.get(row.id);

    return {
      id: row.id,
      name: row.name,
      headline: row.coverage_summary ?? undefined,
      location: fallbackLocation(countryCode),
      countryCode,
      regionId: null,
      cityId: null,
      city: null,
      rating: undefined,
      reviewsCount: undefined,
      languages: row.languages ?? undefined,
      specialties: row.specialties ?? undefined,
      tags: row.specialties ?? undefined,
      verified: row.verified ?? false,
      licenseVerified: undefined,
      hasLiabilityInsurance: undefined,
      childFriendly: undefined,
      gender: null,
      hourlyRateCents: null,
      hourlyRate: null,
      currency: null,
      responseTimeMinutes: null,
      featuredScore: row.featured ? 1 : 0,
      href: `${hrefBase}/${row.id}`,
      // Review system fields
      avgOverallRating: profileRatingInfo?.avgOverallRating ?? null,
      totalReviews: profileRatingInfo?.totalReviews ?? 0,
    } satisfies DirectoryListing;
  });

  // Sort: Featured profiles first (by score), then alphabetically by name
  listings.sort((a, b) => {
    // Primary sort: Featured score (higher is better)
    const aFeatured = a.featuredScore ?? 0;
    const bFeatured = b.featuredScore ?? 0;

    if (aFeatured > 0 || bFeatured > 0) {
      const featuredDiff = bFeatured - aFeatured;
      if (featuredDiff !== 0) {
        return featuredDiff;
      }
    }

    // Secondary sort: Alphabetically by name
    return a.name.localeCompare(b.name);
  });

  const licensingMap = await fetchLicensingMap(listings.map((listing) => listing.countryCode));
  applyLicensing(listings, licensingMap, segment);

  return listings;
}

export async function fetchDirectoryRegionOptions(): Promise<Option[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("countries")
    .select("code, name")
    .order("name", { ascending: true })
    .limit(200);

  if (error || !data) {
    if (error) {
      console.error("Failed to fetch region options", error);
    }
    return [];
  }

  return data
    .filter((row): row is { code: string; name: string | null } => Boolean(row.code))
    .map((row) => ({
      value: row.code,
      label: row.name ?? row.code,
      meta: { countryCode: row.code },
    }))
    .filter((option, index, array) => array.findIndex((item) => item.value === option.value) === index);
}

export async function fetchDirectoryCityOptions(region?: string): Promise<Option[]> {
  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("cities")
    .select("name, country_code")
    .order("name", { ascending: true })
    .limit(200);

  if (region) {
    query = query.eq("country_code", region);
  }

  const { data, error } = await query;

  if (error || !data) {
    if (error) {
      console.error("Failed to fetch city options", error);
    }
    return [];
  }

  const seen = new Set<string>();
  const options: Option[] = [];

  data.forEach((row) => {
    const name = row.name?.trim();
    if (!name) return;
    const key = name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    options.push({ value: name, label: name, meta: { countryCode: row.country_code } });
  });

  return options.slice(0, 200);
}

export async function fetchGuideRegionOptions(countryCode?: string): Promise<Option[]> {
  if (!countryCode) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from("regions")
    .select("id, name, region_code")
    .eq("country_code", countryCode)
    .order("name", { ascending: true });

  if (error || !data) {
    if (error) {
      console.error("Failed to fetch regions for country", error);
    }
    return [];
  }

  return data
    .filter((row) => row.id)
    .map((row) => ({
      value: row.id as string,
      label: row.name ?? row.region_code ?? "Region",
      meta: { regionCode: row.region_code, countryCode },
    }));
}

export async function fetchGuideCityOptions(params: {
  regionId?: string;
  countryCode?: string;
}): Promise<Option[]> {
  const { regionId, countryCode } = params;
  if (!regionId && !countryCode) {
    return [];
  }

  const supabase = getSupabaseServerClient();
  let query = supabase
    .from("cities")
    .select("id, name, region_id, country_code")
    .order("name", { ascending: true })
    .limit(200);

  if (regionId) {
    query = query.eq("region_id", regionId);
  } else if (countryCode) {
    query = query.eq("country_code", countryCode);
  }

  const { data, error } = await query;

  if (error || !data) {
    if (error) {
      console.error("Failed to fetch city cascade options", error);
    }
    return [];
  }

  return data
    .filter((row) => row.id && row.name)
    .map((row) => ({
      value: row.id as string,
      label: row.name as string,
      meta: { regionId: row.region_id, countryCode: row.country_code },
    }));
}

export async function fetchGuidePriceBounds(): Promise<{ min: number; max: number } | null> {
  const supabase = getSupabaseServerClient();

  const [minResult, maxResult] = await Promise.all([
    supabase
      .from("guides")
      .select("hourly_rate_cents")
      .not("hourly_rate_cents", "is", null)
      .order("hourly_rate_cents", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("guides")
      .select("hourly_rate_cents")
      .not("hourly_rate_cents", "is", null)
      .order("hourly_rate_cents", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (minResult.error) {
    console.error("Failed to fetch minimum guide rate", minResult.error);
  }
  if (maxResult.error) {
    console.error("Failed to fetch maximum guide rate", maxResult.error);
  }

  const minCents = minResult.data?.hourly_rate_cents;
  const maxCents = maxResult.data?.hourly_rate_cents;

  if (minCents === null || minCents === undefined || maxCents === null || maxCents === undefined) {
    return null;
  }

  return {
    min: Number((minCents / 100).toFixed(2)),
    max: Number((maxCents / 100).toFixed(2)),
  };
}
