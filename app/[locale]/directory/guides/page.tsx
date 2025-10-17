export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { DirectoryTabs } from "@/components/directory/tabs";
import { EmptyState } from "@/components/directory/empty-state";
import { ListingCard } from "@/components/directory/listing-card";
import {
  GuideFilterControls,
  type Option as FilterOption,
} from "@/components/directory/guide-filter-controls";
import { AvailabilityFilter } from "@/components/directory/availability-filter";
import { CollapsibleFilterPanel } from "@/components/directory/collapsible-filter-panel";
import {
  fetchDirectoryListings,
  fetchDirectoryRegionOptions,
  fetchGuideRegionOptions,
  fetchGuideCityOptions,
  fetchGuidePriceBounds,
} from "@/lib/directory/queries";
import { getCountryName, getLanguageName } from "@/lib/utils/locale";
import type { DirectoryFilters, DirectoryListing } from "@/lib/directory/types";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { GUIDE_SPECIALTY_OPTIONS, PROFILE_LANGUAGE_CODES } from "@/lib/constants/profile";

type DirectoryPageProps = {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

function toList(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseNumber(value?: string | null): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function toTitleCase(value: string): string {
  return value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function resolveGuideFilters(searchParams: DirectoryPageProps["searchParams"]): DirectoryFilters {
  const countryParam = typeof searchParams?.country === "string" ? searchParams.country.toUpperCase() : undefined;
  const regionId = typeof searchParams?.region === "string" ? searchParams.region : undefined;
  const cityId = typeof searchParams?.city === "string" ? searchParams.city : undefined;

  const languages = toList(typeof searchParams?.languages === "string" ? searchParams.languages : undefined).map((value) =>
    value.toLowerCase()
  );
  const specialties = toList(typeof searchParams?.specialties === "string" ? searchParams.specialties : undefined).map((value) =>
    value.toLowerCase()
  );
  const genders = toList(typeof searchParams?.gender === "string" ? searchParams.gender : undefined).map((value) =>
    value.toLowerCase()
  );

  const verifiedOnly = searchParams?.verified === "true";
  const licenseVerifiedOnly = searchParams?.license === "true";
  const insuredOnly = searchParams?.insurance === "true";
  const childFriendlyOnly = searchParams?.child === "true";

  const minRate = parseNumber(typeof searchParams?.minRate === "string" ? searchParams.minRate : undefined);
  const maxRate = parseNumber(typeof searchParams?.maxRate === "string" ? searchParams.maxRate : undefined);

  const availableFrom = typeof searchParams?.availableFrom === "string" ? searchParams.availableFrom : undefined;
  const availableTo = typeof searchParams?.availableTo === "string" ? searchParams.availableTo : undefined;

  return {
    country: countryParam,
    region: countryParam,
    regionId,
    cityId,
    languages,
    specialties,
    genders,
    verifiedOnly,
    licenseVerifiedOnly,
    insuredOnly,
    childFriendlyOnly,
    minRate,
    maxRate,
    availableFrom,
    availableTo,
  } satisfies DirectoryFilters;
}

function ensureOption(options: FilterOption[], value: string | undefined, fallbackLabel?: string): FilterOption[] {
  if (!value) {
    return options;
  }
  if (options.some((option) => option.value === value)) {
    return options;
  }
  return [...options, { value, label: fallbackLabel ?? value }];
}

function buildLanguageOptions(locale: SupportedLocale): FilterOption[] {
  return PROFILE_LANGUAGE_CODES.map((code) => ({
    value: code,
    label: getLanguageName(locale, code) ?? code.toUpperCase(),
  })).sort((a, b) => a.label.localeCompare(b.label));
}

function buildSpecialtyOptions(): FilterOption[] {
  return GUIDE_SPECIALTY_OPTIONS.map((value) => ({
    value: value.toLowerCase().replace(/\s+/g, "-"),
    label: value,
  }));
}

function buildGenderOptions(
  listings: DirectoryListing[],
  selected: string[]
): FilterOption[] {
  const values = new Set<string>(selected.map((value) => value.toLowerCase()));
  listings.forEach((listing) => {
    if (listing.gender) {
      values.add(listing.gender.toLowerCase());
    }
  });
  return Array.from(values)
    .map((value) => ({
      value,
      label: toTitleCase(value),
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
}

export default async function GuideDirectoryPage({ params, searchParams }: DirectoryPageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const directoryT = await getTranslations({ locale, namespace: "directory" });
  const profileT = await getTranslations({ locale, namespace: "profile" });

  const filters = resolveGuideFilters(searchParams);

  const [rawListings, countryOptions, regionOptionsRaw, cityOptionsRaw, priceBounds] = await Promise.all([
    fetchDirectoryListings("guides", filters),
    fetchDirectoryRegionOptions(),
    fetchGuideRegionOptions(filters.country),
    fetchGuideCityOptions({ regionId: filters.regionId, countryCode: filters.country }),
    fetchGuidePriceBounds(),
  ]);

  const listings = rawListings.map((listing) => {
    const countryLabel = listing.countryCode
      ? getCountryName(locale, listing.countryCode) ?? listing.countryCode
      : listing.location;
    const locationLabel = listing.city ? `${listing.city}, ${countryLabel}` : countryLabel;
    const languages = listing.languages?.map((code) => getLanguageName(locale, code) ?? code.toUpperCase());
    const specialties = (listing.specialties ?? listing.tags ?? []).map((value) => toTitleCase(value.replace(/[-_]/g, " ")));

    return {
      ...listing,
      location: locationLabel,
      languages,
      specialties,
      href: `/${locale}${listing.href}`,
    };
  });

  const languageOptions = buildLanguageOptions(locale);
  const specialtyOptions = buildSpecialtyOptions();
  const genderOptions = buildGenderOptions(listings, filters.genders ?? []);

  const regionOptions = ensureOption(regionOptionsRaw, filters.regionId);
  const cityOptions = ensureOption(
    cityOptionsRaw,
    filters.cityId,
    listings.find((listing) => listing.cityId === filters.cityId)?.city ?? undefined
  );

  const controlLabels = {
    country: directoryT("filters.region"),
    region: directoryT("filters.region"),
    city: directoryT("filters.city"),
    languages: directoryT("filters.languages"),
    specialties: directoryT("filters.specialties"),
    genders: "Gender",
    verified: directoryT("filters.verified"),
    license: profileT("guide.verified"),
    insurance: "Liability insurance",
    childFriendly: "Child friendly",
    price: directoryT("filters.priceRange"),
    priceReset: "Reset",
  } as const;

  const navTabs = [
    { key: "guides", label: directoryT("tabs.guides"), href: `/${locale}/directory/guides` },
    { key: "agencies", label: directoryT("tabs.agencies"), href: `/${locale}/directory?tab=agencies` },
    { key: "dmcs", label: directoryT("tabs.dmcs"), href: `/${locale}/directory?tab=dmcs` },
    { key: "transport", label: directoryT("tabs.transport"), href: `/${locale}/directory?tab=transport` },
  ];

  const activeFilters: string[] = [];

  if (filters.country) {
    const countryLabel = countryOptions.find((option) => option.value === filters.country)?.label ?? filters.country;
    activeFilters.push(`${controlLabels.country}: ${countryLabel}`);
  }

  if (filters.regionId) {
    const regionLabel = regionOptions.find((option) => option.value === filters.regionId)?.label ?? filters.regionId;
    activeFilters.push(`${controlLabels.region}: ${regionLabel}`);
  }

  if (filters.cityId) {
    const cityLabel = cityOptions.find((option) => option.value === filters.cityId)?.label ?? filters.cityId;
    activeFilters.push(`${controlLabels.city}: ${cityLabel}`);
  }

  if (filters.languages && filters.languages.length > 0) {
    const labels = filters.languages
      .map((value) => languageOptions.find((option) => option.value === value.toLowerCase())?.label ?? value)
      .filter(Boolean);
    if (labels.length > 0) {
      activeFilters.push(`${controlLabels.languages}: ${labels.join(", ")}`);
    }
  }

  if (filters.specialties && filters.specialties.length > 0) {
    const labels = filters.specialties
      .map((value) => specialtyOptions.find((option) => option.value === value.toLowerCase())?.label ?? toTitleCase(value))
      .filter(Boolean);
    if (labels.length > 0) {
      activeFilters.push(`${controlLabels.specialties}: ${labels.join(", ")}`);
    }
  }

  if (filters.genders && filters.genders.length > 0) {
    const labels = filters.genders
      .map((value) => genderOptions.find((option) => option.value === value.toLowerCase())?.label ?? toTitleCase(value))
      .filter(Boolean);
    if (labels.length > 0) {
      activeFilters.push(`${controlLabels.genders}: ${labels.join(", ")}`);
    }
  }

  if (filters.verifiedOnly) {
    activeFilters.push(controlLabels.verified);
  }

  if (filters.licenseVerifiedOnly) {
    activeFilters.push(controlLabels.license);
  }

  if (filters.insuredOnly) {
    activeFilters.push(controlLabels.insurance);
  }

  if (filters.childFriendlyOnly) {
    activeFilters.push(controlLabels.childFriendly);
  }

  if (typeof filters.minRate === "number" || typeof filters.maxRate === "number") {
    const min = filters.minRate ?? priceBounds?.min;
    const max = filters.maxRate ?? priceBounds?.max;
    if (typeof min === "number" || typeof max === "number") {
      const minLabel = typeof min === "number" ? Math.round(min) : 0;
      const maxLabel = typeof max === "number" ? Math.round(max) : undefined;
      const rangeText = typeof maxLabel === "number" ? `${minLabel} - ${maxLabel}` : `${minLabel}+`;
      activeFilters.push(`${controlLabels.price}: ${rangeText}`);
    }
  }

  const showEmpty = listings.length === 0;
  const actionLabel = directoryT("actions.guide");

  const panelFilters: Array<{ key: string; label: string }> = [
    { key: "country", label: controlLabels.country },
    { key: "region", label: controlLabels.region },
    { key: "city", label: controlLabels.city },
    { key: "languages", label: controlLabels.languages },
    { key: "specialties", label: controlLabels.specialties },
    { key: "genders", label: controlLabels.genders },
    { key: "verified", label: controlLabels.verified },
    { key: "license", label: controlLabels.license },
    { key: "insurance", label: controlLabels.insurance },
    { key: "child", label: controlLabels.childFriendly },
    { key: "price", label: controlLabels.price },
  ];

  return (
    <div className="flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {directoryT("title")}
          </h1>
          <p className="text-sm text-foreground/70 sm:text-base">{directoryT("description")}</p>
        </div>
        <DirectoryTabs tabs={navTabs} activeKey="guides" />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6">
        {/* Results Summary */}
        <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {showEmpty ? "No guides found" : `${listings.length} ${listings.length === 1 ? 'guide' : 'guides'} found`}
            </p>
            {activeFilters.length > 0 && (
              <p className="mt-1 text-xs text-gray-600">
                {activeFilters.length} filter{activeFilters.length !== 1 ? 's' : ''} applied
              </p>
            )}
          </div>
        </div>

        {/* Collapsible Filters */}
        <CollapsibleFilterPanel
          title="Filter Guides"
          subtitle="Find the perfect guide for your needs"
          activeFiltersCount={activeFilters.length}
        >
          <div className="space-y-6">
            {/* Availability Search */}
            <AvailabilityFilter
              labels={{
                title: "Search by Availability",
                startDate: "Available From",
                endDate: "Available To",
                search: "Search",
                clear: "Clear",
              }}
            />

            {/* Other Filters */}
            <div className="border-t pt-6">
              <GuideFilterControls
                countries={countryOptions}
                regions={regionOptions}
                cities={cityOptions}
                languageOptions={languageOptions}
                specialtyOptions={specialtyOptions}
                genderOptions={genderOptions}
                priceBounds={priceBounds}
                labels={controlLabels}
              />
            </div>
          </div>
        </CollapsibleFilterPanel>

        {/* Results */}
        {showEmpty ? (
          <EmptyState title={directoryT("empty.heading")} description={directoryT("empty.body")} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard key={listing.id} listing={{...listing, role: "guide"}} actionLabel={actionLabel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}


