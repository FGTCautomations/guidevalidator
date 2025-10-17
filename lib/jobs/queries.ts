import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCountryName } from "@/lib/utils/locale";
import type {
  JobApplicationSummary,
  JobDetail,
  JobFilters,
  JobListItem,
  JobLocation,
} from "./types";

type JobsRow = {
  id: string;
  title: string;
  description: string;
  agency_id: string;
  country_code?: string | null;
  region_id?: string | null;
  city_id?: string | null;
  specialties?: string[] | null;
  languages?: string[] | null;
  start_date?: string | null;
  end_date?: string | null;
  budget_min_cents?: number | null;
  budget_max_cents?: number | null;
  currency?: string | null;
  status: string;
  created_at: string;
  application_deadline?: string | null;
  agencies?: Array<{
    id: string;
    name: string;
    contact_email?: string | null;
  }> | null;
};

type RegionRow = {
  id: string;
  name: string;
};

type CityRow = {
  id: string;
  name: string;
};

type ApplicationRow = {
  id: string;
  job_id: string;
  guide_id: string;
  cover_letter?: string | null;
  status: string;
  budget_expectation_cents?: number | null;
  available_start_date?: string | null;
  available_end_date?: string | null;
  languages?: string[] | null;
  specialties?: string[] | null;
  created_at: string;
  profiles?: Array<{
    id: string;
    full_name?: string | null;
  }> | null;
};

function applyFilters(query: any, filters: JobFilters) {
  if (filters.country) {
    query = query.eq("country_code", filters.country.toUpperCase());
  }

  if (filters.regionId) {
    query = query.eq("region_id", filters.regionId);
  }

  if (filters.cityId) {
    query = query.eq("city_id", filters.cityId);
  }

  if (filters.status) {
    query = query.eq("status", filters.status);
  } else {
    query = query.eq("status", "open");
  }

  if (filters.specialties && filters.specialties.length > 0) {
    query = query.overlaps("specialties", filters.specialties);
  }

  if (filters.languages && filters.languages.length > 0) {
    query = query.overlaps("languages", filters.languages.map((value) => value.toLowerCase()));
  }

  if (filters.startDateFrom) {
    query = query.gte("start_date", filters.startDateFrom);
  }

  if (filters.startDateTo) {
    query = query.lte("end_date", filters.startDateTo);
  }

  if (typeof filters.budgetMin === "number") {
    const cents = Math.max(0, Math.round(filters.budgetMin * 100));
    query = query.gte("budget_max_cents", cents);
  }

  if (typeof filters.budgetMax === "number") {
    const cents = Math.max(0, Math.round(filters.budgetMax * 100));
    query = query.lte("budget_min_cents", cents);
  }

  if (filters.search) {
    const keyword = `%${filters.search.trim()}%`;
    query = query.or(`title.ilike.${keyword},description.ilike.${keyword}`);
  }

  return query;
}

function resolveAgency(row: JobsRow) {
  if (!row.agencies) {
    return { name: "" };
  }
  const candidate = Array.isArray(row.agencies) ? row.agencies[0] : row.agencies;
  return candidate ?? { name: "" };
}

function buildLocation(
  row: JobsRow,
  regionMap: Map<string, RegionRow>,
  cityMap: Map<string, CityRow>,
  locale?: string
): JobLocation {
  const region = row.region_id ? regionMap.get(row.region_id) ?? null : null;
  const city = row.city_id ? cityMap.get(row.city_id) ?? null : null;

  return {
    countryCode: row.country_code ?? null,
    countryName: row.country_code && locale ? getCountryName(locale as any, row.country_code) ?? row.country_code : row.country_code ?? null,
    regionId: row.region_id ?? null,
    regionName: region?.name ?? null,
    cityId: row.city_id ?? null,
    cityName: city?.name ?? null,
  };
}

function buildBudget(row: JobsRow) {
  return {
    minCents: row.budget_min_cents ?? null,
    maxCents: row.budget_max_cents ?? null,
    currency: row.currency ?? "EUR",
  };
}

async function loadLocationMaps(supabase: SupabaseClient, rows: JobsRow[]) {
  const regionIds = Array.from(
    new Set(rows.map((row) => row.region_id).filter((value): value is string => Boolean(value)))
  );
  const cityIds = Array.from(
    new Set(rows.map((row) => row.city_id).filter((value): value is string => Boolean(value)))
  );

  const [regionQuery, cityQuery] = await Promise.all([
    regionIds.length > 0
      ? supabase.from("regions").select("id, name").in("id", regionIds)
      : Promise.resolve({ data: [] as RegionRow[], error: null }),
    cityIds.length > 0
      ? supabase.from("cities").select("id, name").in("id", cityIds)
      : Promise.resolve({ data: [] as CityRow[], error: null }),
  ]);

  const regionMap = new Map<string, RegionRow>();
  if (!regionQuery.error && Array.isArray(regionQuery.data)) {
    for (const region of regionQuery.data as RegionRow[]) {
      regionMap.set(region.id, region);
    }
  }

  const cityMap = new Map<string, CityRow>();
  if (!cityQuery.error && Array.isArray(cityQuery.data)) {
    for (const city of cityQuery.data as CityRow[]) {
      cityMap.set(city.id, city);
    }
  }

  return { regionMap, cityMap };
}

function mapJobRow(
  row: JobsRow,
  maps: { regionMap: Map<string, RegionRow>; cityMap: Map<string, CityRow> },
  locale?: string
): JobListItem {
  const agency = resolveAgency(row);

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    agencyId: row.agency_id,
    agencyName: agency?.name ?? "",
    location: buildLocation(row, maps.regionMap, maps.cityMap, locale),
    specialties: row.specialties ?? [],
    languages: row.languages ?? [],
    startDate: row.start_date ?? null,
    endDate: row.end_date ?? null,
    budget: buildBudget(row),
    contactEmail: (agency && 'contact_email' in agency) ? agency.contact_email ?? null : null,
    status: row.status,
    createdAt: row.created_at,
    href: `/jobs/${row.id}`,
  };
}

export async function fetchJobs(filters: JobFilters = {}, locale?: string): Promise<JobListItem[]> {
  const supabase = getSupabaseServerClient();

  let query: any = supabase
    .from("jobs")
    .select(
      `id, title, description, agency_id, country_code, region_id, city_id, specialties, languages, start_date, end_date, budget_min_cents, budget_max_cents, currency, status, created_at, application_deadline, agencies:agencies!inner(id, name, contact_email)`
    )
    .order("created_at", { ascending: false })
    .limit(200);

  query = applyFilters(query, filters);

  const { data, error } = await query;

  if (error || !Array.isArray(data)) {
    if (error) {
      console.error("Failed to fetch jobs", error);
    }
    return [];
  }

  const rows = data as JobsRow[];
  const maps = await loadLocationMaps(supabase, rows);

  return rows.map((row) => mapJobRow(row, maps, locale));
}

export async function fetchJobDetail(jobId: string, locale?: string): Promise<JobDetail | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("jobs")
    .select(
      `id, title, description, agency_id, country_code, region_id, city_id, specialties, languages, start_date, end_date, budget_min_cents, budget_max_cents, currency, status, created_at, application_deadline, agencies:agencies(id, name, contact_email)`
    )
    .eq("id", jobId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch job detail", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const row = data as JobsRow;
  const maps = await loadLocationMaps(supabase, [row]);
  const base = mapJobRow(row, maps, locale);

  return {
    ...base,
    applicationDeadline: row.application_deadline ?? null,
  };
}

export async function fetchJobApplications(jobId: string): Promise<JobApplicationSummary[]> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("job_applications")
    .select(
      `id, job_id, guide_id, cover_letter, status, budget_expectation_cents, available_start_date, available_end_date, languages, specialties, created_at, profiles:guide_id(id, full_name)`
    )
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  if (error || !Array.isArray(data)) {
    if (error) {
      console.error("Failed to fetch job applications", error);
    }
    return [];
  }

  return (data as ApplicationRow[]).map((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles ?? null;

    const application: JobApplicationSummary = {
      id: row.id,
      jobId: row.job_id,
      guideId: row.guide_id,
      guideName: profile?.full_name ?? null,
      guideHeadline: null,
      status: (row.status ?? "pending") as JobApplicationSummary["status"],
      coverLetter: row.cover_letter ?? null,
      submittedAt: row.created_at,
      budgetExpectationCents: row.budget_expectation_cents ?? null,
      availabilityStart: row.available_start_date ?? null,
      availabilityEnd: row.available_end_date ?? null,
      languages: row.languages ?? [],
      specialties: row.specialties ?? [],
    };

    return application;
  });
}
