import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupportedLocale } from "@/i18n/config";
import { getCountryName, getLanguageName } from "@/lib/utils/locale";
import { PROFILE_LANGUAGE_CODES } from "@/lib/constants/profile";

type SupabaseClient = ReturnType<typeof getSupabaseServerClient>;

export type CoverageOption = {
  value: string;
  label: string;
};

export type SegmentSelection = {
  languages: string[];
  specialties: string[];
  countries: string[];
  regions: string[];
  cities: string[];
  businessName?: string | null;
  bio?: string | null;
  yearsExperience?: number | null;
  hourlyRateCents?: number | null;
  currency?: string | null;
  avatarUrl?: string | null;
  timezone?: string | null;
  availabilityTimezone?: string | null;
  workingHours?: any | null;
  expertiseAreas?: string[];
  licenseNumber?: string | null;
  licenseAuthority?: string | null;
  licenseProofUrl?: string | null;
  idDocumentUrl?: string | null;
  experienceSummary?: string | null;
  sampleItineraries?: string | null;
  mediaGallery?: string | null;
  availabilityNotes?: string | null;
};

export type CoverageOptionSets = {
  languages: CoverageOption[];
  countries: CoverageOption[];
  regions: CoverageOption[];
  cities: CoverageOption[];
};

async function withClient(client?: SupabaseClient) {
  return client ?? getSupabaseServerClient();
}

export async function loadGuideSegments(profileId: string, client?: SupabaseClient): Promise<SegmentSelection> {
  const supabase = await withClient(client);

  const [{ data: guideRow, error: guideError }, { data: countryRows, error: countryError }, { data: regionRows, error: regionError }, { data: cityRows, error: cityError }] =
    await Promise.all([
      supabase.from("guides").select("spoken_languages, specialties, business_name, bio, years_experience, hourly_rate_cents, currency, avatar_url, timezone, availability_timezone, working_hours, expertise_areas, license_number, license_authority, license_proof_url, id_document_url, experience_summary, sample_itineraries, media_gallery, availability_notes").eq("profile_id", profileId).maybeSingle(),
      supabase.from("guide_countries").select("country_code").eq("guide_id", profileId),
      supabase.from("guide_regions").select("region_id").eq("guide_id", profileId),
      supabase.from("guide_cities").select("city_id").eq("guide_id", profileId),
    ]);

  if (guideError) {
    console.error("loadGuideSegments: guide query failed", guideError);
  }
  if (countryError) {
    console.error("loadGuideSegments: country query failed", countryError);
  }
  if (regionError) {
    console.error("loadGuideSegments: region query failed", regionError);
  }
  if (cityError) {
    console.error("loadGuideSegments: city query failed", cityError);
  }

  return {
    languages: (guideRow?.spoken_languages ?? []) as string[],
    specialties: (guideRow?.specialties ?? []) as string[],
    countries: (countryRows ?? []).map((row: any) => row.country_code as string),
    regions: (regionRows ?? []).map((row: any) => row.region_id as string),
    cities: (cityRows ?? []).map((row: any) => row.city_id as string),
    businessName: guideRow?.business_name ?? null,
    bio: guideRow?.bio ?? null,
    yearsExperience: guideRow?.years_experience ?? null,
    hourlyRateCents: guideRow?.hourly_rate_cents ?? null,
    currency: guideRow?.currency ?? null,
    avatarUrl: guideRow?.avatar_url ?? null,
    timezone: guideRow?.timezone ?? null,
    availabilityTimezone: guideRow?.availability_timezone ?? null,
    workingHours: guideRow?.working_hours ?? null,
  };
}

export async function loadOrganizationSegments(
  agencyId: string,
  type: "agency" | "dmc" | "transport",
  client?: SupabaseClient
): Promise<SegmentSelection> {
  const supabase = await withClient(client);
  const useTransportTables = type === "transport";
  const countryTable = useTransportTables ? "transport_countries" : "dmc_countries";
  const regionTable = useTransportTables ? "transport_regions" : "dmc_regions";
  const cityTable = useTransportTables ? "transport_cities" : "dmc_cities";
  const idColumn = useTransportTables ? "transport_agency_id" : "agency_id";

  const [{ data: agencyRow, error: agencyError }, { data: countryRows, error: countryError }, { data: regionRows, error: regionError }, { data: cityRows, error: cityError }] =
    await Promise.all([
      supabase.from("agencies").select("languages, specialties").eq("id", agencyId).maybeSingle(),
      supabase.from(countryTable).select("country_code").eq(idColumn, agencyId),
      supabase.from(regionTable).select("region_id").eq(idColumn, agencyId),
      supabase.from(cityTable).select("city_id").eq(idColumn, agencyId),
    ]);

  if (agencyError) {
    console.error("loadOrganizationSegments: agency query failed", agencyError);
  }
  if (countryError) {
    console.error("loadOrganizationSegments: country query failed", countryError);
  }
  if (regionError) {
    console.error("loadOrganizationSegments: region query failed", regionError);
  }
  if (cityError) {
    console.error("loadOrganizationSegments: city query failed", cityError);
  }

  return {
    languages: (agencyRow?.languages ?? []) as string[],
    specialties: (agencyRow?.specialties ?? []) as string[],
    countries: (countryRows ?? []).map((row: any) => row.country_code as string),
    regions: (regionRows ?? []).map((row: any) => row.region_id as string),
    cities: (cityRows ?? []).map((row: any) => row.city_id as string),
  };
}

export async function loadCoverageOptions(
  locale: SupportedLocale,
  client?: SupabaseClient
): Promise<CoverageOptionSets> {
  const supabase = await withClient(client);

  const [{ data: countriesData, error: countriesError }, { data: regionsData, error: regionsError }, { data: citiesData, error: citiesError }] = await Promise.all([
    supabase.from("countries").select("code, name").order("name", { ascending: true }),
    supabase.from("regions").select("id, name, country_code").order("name", { ascending: true }).limit(2000),
    supabase.from("cities").select("id, name, country_code").order("name", { ascending: true }).limit(2000),
  ]);

  if (countriesError) {
    console.error("loadCoverageOptions: countries query failed", countriesError);
  }
  if (regionsError) {
    console.error("loadCoverageOptions: regions query failed", regionsError);
  }
  if (citiesError) {
    console.error("loadCoverageOptions: cities query failed", citiesError);
  }

  const languages = PROFILE_LANGUAGE_CODES.map((code) => ({
    value: code,
    label: getLanguageName(locale, code) ?? code,
  }));

  const countries = (countriesData ?? []).map((country: any) => ({
    value: country.code,
    label: getCountryName(locale, country.code) ?? country.name ?? country.code,
  }));

  const regions = (regionsData ?? []).map((region: any) => ({
    value: region.id,
    label: region.country_code ? `${region.name} (${region.country_code})` : region.name,
  }));

  const cities = (citiesData ?? []).map((city: any) => ({
    value: city.id,
    label: city.country_code ? `${city.name} (${city.country_code})` : city.name,
  }));

  return { languages, countries, regions, cities };
}
