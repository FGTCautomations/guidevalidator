export const dynamic = "force-dynamic";

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { Route } from "next";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchJobs } from "@/lib/jobs/queries";
import type { JobFilters } from "@/lib/jobs/types";
import { JobCard } from "@/components/jobs/job-card";
import { JobFilterControls } from "@/components/jobs/job-filter-controls";
import { getCountryName, getLanguageName } from "@/lib/utils/locale";

export const runtime = "nodejs";

const SPECIALTY_LABELS = [
  "Luxury experiences",
  "Corporate travel",
  "Family friendly",
  "Cultural tours",
  "Adventure",
];

const LANGUAGE_CODES = ["en", "de", "es", "fr", "ar", "ja", "zh", "it", "pt"];

type Option = { value: string; label: string };

type LocationOptions = {
  countries: Option[];
  regions: Option[];
  cities: Option[];
  regionLookup: Map<string, string>;
  cityLookup: Map<string, string>;
};

function resolveFilters(searchParams?: Record<string, string | string[] | undefined>): JobFilters {
  const normalizeArrayParam = (value: string | string[] | undefined) => {
    if (typeof value === "string") {
      return value.split(",").map((item) => item.trim()).filter(Boolean);
    }
    return [];
  };

  const parseNumberParam = (value?: string | string[]) => {
    if (typeof value !== "string") return undefined;
    const numeric = Number.parseFloat(value);
    return Number.isFinite(numeric) ? numeric : undefined;
  };

  return {
    country: typeof searchParams?.country === "string" ? searchParams.country.toUpperCase() : undefined,
    regionId: typeof searchParams?.regionId === "string" ? searchParams.regionId : undefined,
    cityId: typeof searchParams?.cityId === "string" ? searchParams.cityId : undefined,
    status: typeof searchParams?.status === "string" ? (searchParams.status as JobFilters["status"]) : undefined,
    search: typeof searchParams?.search === "string" ? searchParams.search : undefined,
    languages: normalizeArrayParam(searchParams?.languages),
    specialties: normalizeArrayParam(searchParams?.specialties),
    startDateFrom: typeof searchParams?.startDateFrom === "string" ? searchParams.startDateFrom : undefined,
    startDateTo: typeof searchParams?.startDateTo === "string" ? searchParams.startDateTo : undefined,
    budgetMin: parseNumberParam(searchParams?.budgetMin),
    budgetMax: parseNumberParam(searchParams?.budgetMax),
  };
}

async function loadLocationOptions(
  locale: SupportedLocale,
  filters: JobFilters
): Promise<LocationOptions> {
  const supabase = getSupabaseServerClient();

  const [countriesQuery, regionsQuery, citiesQuery] = await Promise.all([
    supabase.from("countries").select("code, name").order("name", { ascending: true }),
    filters.country
      ? supabase
          .from("regions")
          .select("id, name, country_code")
          .eq("country_code", filters.country)
          .order("name", { ascending: true })
      : supabase
          .from("regions")
          .select("id, name, country_code")
          .order("name", { ascending: true })
          .limit(200),
    filters.regionId
      ? supabase
          .from("cities")
          .select("id, name, region_id")
          .eq("region_id", filters.regionId)
          .order("name", { ascending: true })
      : filters.country
      ? supabase
          .from("cities")
          .select("id, name, country_code")
          .eq("country_code", filters.country)
          .order("name", { ascending: true })
          .limit(200)
      : supabase.from("cities").select("id, name").order("name", { ascending: true }).limit(50),
  ]);

  if (countriesQuery.error) {
    console.error("jobs: failed to load countries", countriesQuery.error);
  }
  if (regionsQuery.error) {
    console.error("jobs: failed to load regions", regionsQuery.error);
  }
  if (citiesQuery.error) {
    console.error("jobs: failed to load cities", citiesQuery.error);
  }

  const regionLookup = new Map<string, string>();
  const cityLookup = new Map<string, string>();

  const countries: Option[] = (countriesQuery.data ?? []).map((country: any) => ({
    value: country.code,
    label: getCountryName(locale, country.code) ?? country.name ?? country.code,
  }));

  const regions: Option[] = (regionsQuery.data ?? []).map((region: any) => {
    regionLookup.set(region.id, region.name);
    return { value: region.id, label: region.name };
  });

  const cities: Option[] = (citiesQuery.data ?? []).map((city: any) => {
    cityLookup.set(city.id, city.name);
    return { value: city.id, label: city.name };
  });

  return { countries, regions, cities, regionLookup, cityLookup };
}

export default async function JobsPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "jobs" });
  const filters = resolveFilters(searchParams);

  const supabase = getSupabaseServerClient();

  const [
    { data: { user } },
    jobs,
    locationData,
  ] = await Promise.all([
    supabase.auth.getUser(),
    fetchJobs(filters, locale),
    loadLocationOptions(locale, filters),
  ]);

  let profileRole: string | null = null;
  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profileRole = profileRow?.role ?? null;
  }

  const { countries, regions, cities, regionLookup, cityLookup } = locationData;

  const statusOptions = [
    { value: "open", label: t("filters.options.status.open") },
    { value: "draft", label: t("filters.options.status.draft") },
    { value: "closed", label: t("filters.options.status.closed") },
    { value: "filled", label: t("filters.options.status.filled") },
  ];

  const languageOptions = LANGUAGE_CODES.map((code) => ({
    value: code,
    label: getLanguageName(locale, code) ?? code.toUpperCase(),
  }));

  const specialtyOptions = SPECIALTY_LABELS.map((label) => ({ value: label, label }));

  const canPostJob = profileRole ? ["agency", "dmc"].includes(profileRole) : false;
  const isAuthenticated = Boolean(user);
  const localeHrefPrefix = `/${locale}`;

  const postJobHref = !isAuthenticated
    ? `${localeHrefPrefix}/auth/sign-in?redirect=${encodeURIComponent(`${localeHrefPrefix}/jobs/create`)}`
    : canPostJob
      ? `${localeHrefPrefix}/jobs/create`
      : `${localeHrefPrefix}/pricing`;

  const postJobLabel = !isAuthenticated
    ? t("cta.signIn")
    : canPostJob
      ? t("cta.post")
      : t("cta.upgrade");

  const postJobNote = !isAuthenticated
    ? t("cta.postNoteUnauth")
    : canPostJob
      ? null
      : t("cta.postNoteUnauthorized");

  const activeFilters: string[] = [];

  if (filters.country) {
    activeFilters.push(
      `${t("filters.country")}: ${getCountryName(locale, filters.country) ?? filters.country}`
    );
  }

  if (filters.regionId) {
    const regionName = regionLookup.get(filters.regionId) ?? filters.regionId;
    activeFilters.push(`${t("filters.region")}: ${regionName}`);
  }

  if (filters.cityId) {
    const cityName = cityLookup.get(filters.cityId) ?? filters.cityId;
    activeFilters.push(`${t("filters.city")}: ${cityName}`);
  }

  if (filters.languages && filters.languages.length > 0) {
    const labels = filters.languages
      .map((language) => getLanguageName(locale, language) ?? language.toUpperCase())
      .filter(Boolean)
      .join(", "

      );
    if (labels) {
      activeFilters.push(`${t("filters.languages")}: ${labels}`);
    }
  }

  if (filters.specialties && filters.specialties.length > 0) {
    activeFilters.push(`${t("filters.specialties")}: ${filters.specialties.join(", ")}`);
  }

  if (filters.status && filters.status !== "open") {
    const statusLabel = statusOptions.find((option) => option.value === filters.status)?.label ?? filters.status;
    activeFilters.push(`${t("filters.status")}: ${statusLabel}`);
  }

  if (filters.search) {
    activeFilters.push(`${t("filters.search")}: "${filters.search}"`);
  }

  if (filters.startDateFrom || filters.startDateTo) {
    const parts: string[] = [];
    if (filters.startDateFrom) {
      parts.push(`${t("filters.startDateFromLabel")}: ${filters.startDateFrom}`);
    }
    if (filters.startDateTo) {
      parts.push(`${t("filters.startDateToLabel")}: ${filters.startDateTo}`);
    }
    activeFilters.push(parts.join(" | "));
  }

  if (typeof filters.budgetMin === "number" || typeof filters.budgetMax === "number") {
    const parts: string[] = [];
    if (typeof filters.budgetMin === "number") {
      parts.push(`${t("filters.budgetMin")}: ${filters.budgetMin}`);
    }
    if (typeof filters.budgetMax === "number") {
      parts.push(`${t("filters.budgetMax")}: ${filters.budgetMax}`);
    }
    activeFilters.push(parts.join(" | "));
  }

  return (
    <div className="flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-3">
          <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
            {t("badge")}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
          <p className="text-sm text-foreground/70 sm:text-base">{t("description")}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={postJobHref as Route}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md"
            >
              {postJobLabel}
            </Link>
            <Link
              href={`${localeHrefPrefix}/contact` as Route}
              className="rounded-full border border-secondary px-5 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
            >
              {t("cta.contact")}
            </Link>
          </div>
          {postJobNote ? (
            <p className="text-xs text-foreground/60">{postJobNote}</p>
          ) : null}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[320px_1fr]">
        <aside className="space-y-4">
          <JobFilterControls
            labels={{
              search: t("filters.search"),
              country: t("filters.country"),
              region: t("filters.region"),
              city: t("filters.city"),
              languages: t("filters.languages"),
              specialties: t("filters.specialties"),
              status: t("filters.status"),
              startDateFrom: t("filters.startDateFrom"),
              startDateTo: t("filters.startDateTo"),
              budgetMin: t("filters.budgetMin"),
              budgetMax: t("filters.budgetMax"),
              clear: t("filters.clear"),
            }}
            countryOptions={countries}
            regionOptions={regions}
            cityOptions={cities}
            languageOptions={languageOptions}
            specialtyOptions={specialtyOptions}
            statusOptions={statusOptions}
          />
        </aside>
        <section className="space-y-6">
          {activeFilters.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs text-foreground/70">
              {activeFilters.map((chip) => (
                <span key={chip} className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                  {chip}
                </span>
              ))}
            </div>
          ) : null}

          {jobs.length === 0 ? (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-[var(--radius-xl)] border border-dashed border-foreground/15 bg-white/60 p-12 text-center">
              <h2 className="text-lg font-semibold text-foreground">{t("empty.title")}</h2>
              <p className="max-w-md text-sm text-foreground/70">{t("empty.description")}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} ctaLabel={t("card.cta")} localeHrefPrefix={localeHrefPrefix} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
