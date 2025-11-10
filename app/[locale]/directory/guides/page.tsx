export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { searchGuides, type GuideSearchParams } from "@/lib/guides/api";
import { GuideFiltersEnhanced } from "@/components/guides-v2/guide-filters-enhanced";
import { GuideResults } from "@/components/guides-v2/guide-results";
import { LoadingSkeleton } from "@/components/guides-v2/loading-skeleton";
import { CountryFilter } from "@/components/directory/country-filter";
import { fetchAvailableCountries } from "@/lib/directory/queries";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";

interface PageProps {
  params: { locale: string };
  searchParams: Record<string, string | string[] | undefined>;
}

function parseSearchParams(
  searchParams: PageProps["searchParams"]
): GuideSearchParams {
  const country =
    typeof searchParams.country === "string" ? searchParams.country : "";

  return {
    country,
    regionId:
      typeof searchParams.region === "string"
        ? searchParams.region
        : undefined,
    cityId:
      typeof searchParams.city === "string" ? searchParams.city : undefined,
    languages:
      typeof searchParams.lang === "string"
        ? searchParams.lang.split(",").filter(Boolean)
        : undefined,
    specialties:
      typeof searchParams.spec === "string"
        ? searchParams.spec.split(",").filter(Boolean)
        : undefined,
    genders:
      typeof searchParams.gender === "string"
        ? searchParams.gender.split(",").filter(Boolean)
        : undefined,
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    priceMin:
      typeof searchParams.min === "string"
        ? Number(searchParams.min)
        : undefined,
    priceMax:
      typeof searchParams.max === "string"
        ? Number(searchParams.max)
        : undefined,
    minRating:
      typeof searchParams.minRating === "string"
        ? Number(searchParams.minRating)
        : undefined,
    verified: searchParams.verified === "true",
    license: searchParams.license === "true",
    sort:
      (searchParams.sort as "featured" | "rating" | "price") || "featured",
    limit: 24,
  };
}

export default async function GuidesV2Page({
  params,
  searchParams,
}: PageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const directoryT = await getTranslations({ locale, namespace: "directory" });

  const filterParams = parseSearchParams(searchParams);

  // Fetch available countries for the selector
  const availableCountries = await fetchAvailableCountries("guides");

  // If no country selected, show country selector
  if (!filterParams.country) {
    return (
      <div className="flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {directoryT("title")}
            </h1>
            <p className="text-sm text-foreground/70 sm:text-base">
              {directoryT("description")}
            </p>
          </div>

          {/* Country selector */}
          <CountryFilter
            countries={availableCountries}
            selectedCountry={undefined}
            locale={locale}
            label="Select a Country"
            placeholder="Choose a country to explore guides"
          />

          <div className="rounded-xl border border-foreground/10 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto max-w-md space-y-3">
              <svg
                className="mx-auto h-16 w-16 text-foreground/20"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-semibold text-foreground">
                Select a Country to Get Started
              </h3>
              <p className="text-sm text-foreground/70">
                Choose a country above to view available guides with instant
                filtering and search.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fetch results server-side
  try {
    const data = await searchGuides(filterParams);

    return (
      <div className="flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {directoryT("title")}
            </h1>
            <p className="text-sm text-foreground/70 sm:text-base">
              {directoryT("description")}
            </p>
          </div>

          {/* Country selector */}
          <CountryFilter
            countries={availableCountries}
            selectedCountry={filterParams.country}
            locale={locale}
            label="Country"
            placeholder="Select country"
          />

          {/* Filters (Client Component) */}
          <GuideFiltersEnhanced facets={data.facets} currentFilters={filterParams} regionOptions={[]} cityOptions={[]} />

          {/* Results (Client Component for infinite scroll) */}
          <Suspense fallback={<LoadingSkeleton />}>
            <GuideResults
              key={JSON.stringify(filterParams)}
              initialResults={data.results}
              initialCursor={data.nextCursor}
              currentFilters={filterParams}
              totalCount={data.facets.total}
              locale={locale}
            />
          </Suspense>
        </div>
      </div>
    );
  } catch (error: any) {
    return (
      <div className="flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Error Loading Guides
          </h1>
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-900">{error.message}</p>
            <p className="mt-4 text-sm text-red-700">
              Please ensure the database migration has been applied.
              <br />
              See: MANUAL_MIGRATION_STEPS.md
            </p>
          </div>
        </div>
      </div>
    );
  }
}
