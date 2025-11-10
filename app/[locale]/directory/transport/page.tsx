export const dynamic = "force-dynamic";

import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { searchTransport, type TransportSearchParams } from "@/lib/transport/api";
import { TransportFilters } from "@/components/transport/transport-filters";
import { TransportResults } from "@/components/transport/transport-results";
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
): TransportSearchParams {
  const country =
    typeof searchParams.country === "string" ? searchParams.country : "";

  return {
    country,
    languages:
      typeof searchParams.lang === "string"
        ? searchParams.lang.split(",").filter(Boolean)
        : undefined,
    serviceTypes:
      typeof searchParams.serviceTypes === "string"
        ? searchParams.serviceTypes.split(",").filter(Boolean)
        : undefined,
    q: typeof searchParams.q === "string" ? searchParams.q : undefined,
    minRating:
      typeof searchParams.minRating === "string"
        ? Number(searchParams.minRating)
        : undefined,
    licenseOnly: searchParams.licenseOnly === "true",
    sort: (searchParams.sort as "featured" | "rating") || "featured",
    limit: 24,
  };
}

export default async function TransportPage({
  params,
  searchParams,
}: PageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const filterParams = parseSearchParams(searchParams);

  const availableCountries = await fetchAvailableCountries("transport");

  if (!filterParams.country) {
    return (
      <div className="flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Transport Providers Directory
            </h1>
            <p className="text-sm text-foreground/70 sm:text-base">
              Find trusted transport providers worldwide
            </p>
          </div>

          <CountryFilter
            countries={availableCountries}
            selectedCountry={undefined}
            locale={locale}
            label="Select a Country"
            placeholder="Choose a country to explore transport providers"
          />

          <div className="rounded-xl border border-foreground/10 bg-white p-12 text-center shadow-sm">
            <div className="mx-auto max-w-md space-y-3">
              <h3 className="text-lg font-semibold text-foreground">
                Select a Country to Get Started
              </h3>
              <p className="text-sm text-foreground/70">
                Choose a country above to view available transport providers
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    const data = await searchTransport(filterParams);

    return (
      <div className="flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Transport Providers Directory
            </h1>
            <p className="text-sm text-foreground/70 sm:text-base">
              Find trusted transport providers worldwide
            </p>
          </div>

          <CountryFilter
            countries={availableCountries}
            selectedCountry={filterParams.country}
            locale={locale}
            label="Country"
            placeholder="Select country"
          />

          <TransportFilters facets={data.facets} currentFilters={filterParams} />

          <Suspense fallback={<LoadingSkeleton />}>
            <TransportResults
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
            Error Loading Transport Providers
          </h1>
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center">
            <p className="text-red-900">{error.message}</p>
          </div>
        </div>
      </div>
    );
  }
}
