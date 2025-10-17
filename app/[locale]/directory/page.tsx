export const dynamic = "force-dynamic";
export const revalidate = 0; // Disabled caching for testing

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { DirectoryTabs } from "@/components/directory/tabs";
import { EmptyState } from "@/components/directory/empty-state";
import { ListingCard } from "@/components/directory/listing-card";
import { FilterControls } from "@/components/directory/filter-controls";
import { CopyProtection } from "@/components/profile/copy-protection";
import { CollapsibleFilterPanel } from "@/components/directory/collapsible-filter-panel";
import {
  fetchDirectoryListings,
  fetchDirectoryRegionOptions,
  fetchDirectoryCityOptions,
} from "@/lib/directory/queries";
import { getCountryName, getLanguageName } from "@/lib/utils/locale";
import type { DirectoryFilters, DirectorySegment } from "@/lib/directory/types";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";

const FALLBACK_REGION_CODES = ["DE", "ES", "FR", "IT", "PT", "JP", "CN", "AT", "GR", "US"];
const STATIC_LANGUAGE_CODES = ["en", "de", "es", "fr", "it", "pt", "ja", "zh"];
const STATIC_SPECIALTY_CODES = ["cultural", "luxury", "mice", "events", "airport-transfer", "vip"];

type DirectoryPageProps = {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
};

const DEFAULT_TAB: DirectorySegment = "guides";
const TAB_ORDER: DirectorySegment[] = ["guides", "agencies", "dmcs", "transport"];

function resolveFilters(searchParams: DirectoryPageProps["searchParams"]): DirectoryFilters {
  const region = typeof searchParams?.region === "string" ? searchParams.region.toUpperCase() : undefined;
  const city = typeof searchParams?.city === "string" ? searchParams.city.trim() : undefined;
  const languages = typeof searchParams?.languages === "string"
    ? searchParams.languages.split(",").map((language) => language.trim().toLowerCase()).filter(Boolean)
    : [];
  const specialties = typeof searchParams?.specialties === "string"
    ? searchParams.specialties.split(",").map((specialty) => specialty.trim().toLowerCase()).filter(Boolean)
    : [];
  const verifiedOnly = searchParams?.verified === "true";

  return {
    region,
    city,
    languages,
    specialties,
    verifiedOnly,
  };
}

export default async function DirectoryPage({ params, searchParams }: DirectoryPageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "directory" });

  const tabParam = searchParams?.tab;
  const activeTab = (typeof tabParam === "string" ? tabParam : DEFAULT_TAB) as DirectorySegment;

  if (activeTab === "guides") {
    const paramsForRedirect = new URLSearchParams();
    Object.entries(searchParams ?? {}).forEach(([key, value]) => {
      if (key === "tab") return;
      if (Array.isArray(value)) {
        value.forEach((entry) => {
          if (entry) {
            paramsForRedirect.append(key, entry);
          }
        });
      } else if (value) {
        paramsForRedirect.set(key, value);
      }
    });
    const search = paramsForRedirect.toString();
    const target = search ? `/${locale}/directory/guides?${search}` : `/${locale}/directory/guides`;
    redirect(target);
  }

  const filters = resolveFilters(searchParams);

  const [baseListings, regionOptionsRaw, cityOptionsRaw] = await Promise.all([
    fetchDirectoryListings(activeTab, filters),
    fetchDirectoryRegionOptions(),
    fetchDirectoryCityOptions(filters.region),
  ]);

  const listings = baseListings.map((listing) => {
    const countryLabel = listing.countryCode
      ? getCountryName(locale, listing.countryCode) ?? listing.countryCode.toUpperCase()
      : listing.location;
    const locationLabel = listing.city ? `${listing.city}, ${countryLabel}` : countryLabel;
    const languages = listing.languages?.map((code) => getLanguageName(locale, code) ?? code.toUpperCase());
    const specialties = (listing.specialties ?? listing.tags ?? []).map((value) =>
      value.replace(/[-_]/g, " ").replace(/\b\w/g, (match) => match.toUpperCase())
    );

    return {
      ...listing,
      location: locationLabel,
      languages,
      specialties,
      href: `/${locale}${listing.href}`,
    };
  });

  const showEmpty = listings.length === 0;

  const navTabs = TAB_ORDER.map((key) => ({
    key,
    label: t(`tabs.${key}`),
    href: key === "guides" ? `/${locale}/directory/guides` : `/${locale}/directory?tab=${key}`,
  }));

  const actionLabels: Record<DirectorySegment, string> = {
    guides: t("actions.guide"),
    agencies: t("actions.agency"),
    dmcs: t("actions.dmc"),
    transport: t("actions.transport"),
  };

  const regionLabel = filters.region ? getCountryName(locale, filters.region) ?? filters.region : undefined;
  const languageFilters = filters.languages ?? [];
  const languageLabels = languageFilters
    .map((code) => getLanguageName(locale, code) ?? code.toUpperCase())
    .filter(Boolean);

  const fallbackRegionOptions = FALLBACK_REGION_CODES.map((code) => ({
    value: code,
    label: getCountryName(locale, code) ?? code,
  }));

  const regionOptions = regionOptionsRaw.length > 0 ? regionOptionsRaw : fallbackRegionOptions;
  const cityOptions = cityOptionsRaw.length > 0
    ? cityOptionsRaw
    : filters.city
      ? [{ value: filters.city, label: filters.city }]
      : [];

  const dynamicLanguageCodes = new Set<string>(STATIC_LANGUAGE_CODES);
  baseListings.forEach((listing) => {
    (listing.languages ?? []).forEach((code) => {
      if (code) {
        dynamicLanguageCodes.add(code.toLowerCase());
      }
    });
  });

  const dynamicSpecialtyCodes = new Set<string>(STATIC_SPECIALTY_CODES);
  baseListings.forEach((listing) => {
    (listing.specialties ?? listing.tags ?? []).forEach((value) => {
      if (value) {
        dynamicSpecialtyCodes.add(value.toLowerCase());
      }
    });
  });

  const languageOptions = Array.from(dynamicLanguageCodes)
    .sort((a, b) => a.localeCompare(b))
    .map((code) => ({
      value: code,
      label: getLanguageName(locale, code) ?? code.toUpperCase(),
    }));

  const specialtyOptions = Array.from(dynamicSpecialtyCodes)
    .sort((a, b) => a.localeCompare(b))
    .map((value) => ({
      value,
      label: value.replace(/[-_]/g, ' ').replace(/\b\w/g, (match) => match.toUpperCase()),
    }));

const activeFilters: string[] = [];
  if (regionLabel) {
    activeFilters.push(`${t("filters.region")}: ${regionLabel}`);
  }
  if (filters.city) {
    activeFilters.push(`${t("filters.city")}: ${filters.city}`);
  }
  if (languageLabels.length > 0) {
    activeFilters.push(`${t("filters.languages")}: ${languageLabels.join(", ")}`);
  }
  if (filters.specialties && filters.specialties.length > 0) {
    const specialtyLabelMap = new Map(specialtyOptions.map((option) => [option.value, option.label]));
    const specialtyLabels = filters.specialties
      .map((value) => specialtyLabelMap.get(value) ?? value.replace(/[-_]/g, " ").replace(/\b\w/g, (match) => match.toUpperCase()))
      .filter(Boolean);
    if (specialtyLabels.length > 0) {
      activeFilters.push(`${t("filters.specialties")}: ${specialtyLabels.join(", ")}`);
    }
  }
  if (filters.verifiedOnly) {
    activeFilters.push(t("filters.verified"));
  }

    return (
    <div className="flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24 contact-protected">
      <CopyProtection />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-sm text-foreground/70 sm:text-base">{t("description")}</p>
        </div>
        <DirectoryTabs tabs={navTabs} activeKey={activeTab} />
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6">
        {/* Results Summary */}
        <div className="flex items-center justify-between rounded-lg bg-white p-4 shadow-sm">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {showEmpty ? `No ${activeTab} found` : `${listings.length} ${activeTab === 'agencies' ? 'agencies' : activeTab === 'dmcs' ? 'DMCs' : 'transport companies'} found`}
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
          title={`Filter ${activeTab === 'agencies' ? 'Agencies' : activeTab === 'dmcs' ? 'DMCs' : 'Transport Companies'}`}
          subtitle={`Find the perfect ${activeTab === 'agencies' ? 'agency' : activeTab === 'dmcs' ? 'DMC' : 'transport provider'} for your needs`}
          activeFiltersCount={activeFilters.length}
        >
          <FilterControls
            locale={locale}
            labels={{
              region: t("filters.region"),
              city: t("filters.city"),
              languages: t("filters.languages"),
              specialties: t("filters.specialties"),
              verified: t("filters.verified"),
            }}
            regionOptions={regionOptions}
            cityOptions={cityOptions}
            languageOptions={languageOptions}
            specialtyOptions={specialtyOptions}
          />
        </CollapsibleFilterPanel>

        {/* Results */}
        {showEmpty ? (
          <EmptyState title={t("empty.heading")} description={t("empty.body")} />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                actionLabel={actionLabels[activeTab] ?? actionLabels[DEFAULT_TAB]}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}













