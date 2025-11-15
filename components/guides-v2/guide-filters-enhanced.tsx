"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Route } from "next";
import { useState, useTransition, useEffect, useCallback, useMemo } from "react";
import type { GuideSearchParams, FacetCount } from "@/lib/guides/api";
import { getLanguageName } from "@/lib/utils/language-names";

interface GuideFiltersProps {
  facets: {
    languages: FacetCount[];
    specialties: FacetCount[];
    genders: FacetCount[];
    total: number;
  };
  currentFilters: GuideSearchParams;
  regionOptions: Array<{ value: string; label: string }>;
  cityOptions: Array<{ value: string; label: string }>;
}

export function GuideFiltersEnhanced({
  facets,
  currentFilters,
  regionOptions,
  cityOptions,
}: GuideFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for debounced search
  const [searchQuery, setSearchQuery] = useState(currentFilters.q || "");
  const [debouncedQ, setDebouncedQ] = useState(currentFilters.q || "");

  // Local state for pending checkbox selections (before navigation)
  const [pendingLanguages, setPendingLanguages] = useState<Set<string>>(
    () => new Set(currentFilters.languages || [])
  );
  const [pendingSpecialties, setPendingSpecialties] = useState<Set<string>>(
    () => new Set(currentFilters.specialties || [])
  );
  const [pendingGenders, setPendingGenders] = useState<Set<string>>(
    () => new Set(currentFilters.genders || [])
  );

  // Price range state
  const [maxPrice, setMaxPrice] = useState(currentFilters.priceMax || 500);

  // Sync pending state with URL changes
  useEffect(() => {
    setPendingLanguages(new Set(currentFilters.languages || []));
    setPendingSpecialties(new Set(currentFilters.specialties || []));
    setPendingGenders(new Set(currentFilters.genders || []));
  }, [currentFilters.languages, currentFilters.specialties, currentFilters.genders]);

  // Debounce search input (400ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQ(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Update URL when debounced query changes
  useEffect(() => {
    if (debouncedQ !== currentFilters.q) {
      updateFilter("q", debouncedQ || undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const updateFilter = useCallback(
    (
      key: string,
      value: string | string[] | boolean | number | undefined
    ) => {
      const params = new URLSearchParams(searchParams?.toString());

      if (
        value === undefined ||
        value === false ||
        value === "" ||
        (Array.isArray(value) && value.length === 0)
      ) {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else if (typeof value === "boolean") {
        params.set(key, value ? "true" : "false");
      } else {
        params.set(key, String(value));
      }

      // Reset cursor when filters change
      params.delete("cursor");

      startTransition(() => {
        const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(url as Route, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const toggleLocalFilter = (filterType: 'languages' | 'specialties' | 'genders', value: string) => {
    if (filterType === 'languages') {
      const updated = new Set(pendingLanguages);
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      setPendingLanguages(updated);
    } else if (filterType === 'specialties') {
      const updated = new Set(pendingSpecialties);
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      setPendingSpecialties(updated);
    } else if (filterType === 'genders') {
      const updated = new Set(pendingGenders);
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      setPendingGenders(updated);
    }
  };

  const applyPendingFilters = () => {
    const params = new URLSearchParams(searchParams?.toString());

    // Apply all pending filters
    if (pendingLanguages.size > 0) {
      params.set("lang", Array.from(pendingLanguages).join(","));
    } else {
      params.delete("lang");
    }

    if (pendingSpecialties.size > 0) {
      params.set("spec", Array.from(pendingSpecialties).join(","));
    } else {
      params.delete("spec");
    }

    if (pendingGenders.size > 0) {
      params.set("gender", Array.from(pendingGenders).join(","));
    } else {
      params.delete("gender");
    }

    params.delete("cursor");

    startTransition(() => {
      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(url as Route, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
    // Keep only country
    if (currentFilters.country) {
      params.set("country", currentFilters.country);
    }
    startTransition(() => {
      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(url as Route, { scroll: false });
    });
    setSearchQuery("");
    setDebouncedQ("");
    setPendingLanguages(new Set());
    setPendingSpecialties(new Set());
    setPendingGenders(new Set());
    setMaxPrice(500);
  };

  const hasActiveFilters =
    currentFilters.q ||
    currentFilters.languages?.length ||
    currentFilters.specialties?.length ||
    currentFilters.genders?.length ||
    currentFilters.verified ||
    currentFilters.license ||
    currentFilters.minRating ||
    currentFilters.priceMax ||
    currentFilters.regionId ||
    currentFilters.cityId;

  const hasPendingChanges =
    pendingLanguages.size !== (currentFilters.languages?.length || 0) ||
    pendingSpecialties.size !== (currentFilters.specialties?.length || 0) ||
    pendingGenders.size !== (currentFilters.genders?.length || 0) ||
    !setsEqual(pendingLanguages, new Set(currentFilters.languages || [])) ||
    !setsEqual(pendingSpecialties, new Set(currentFilters.specialties || [])) ||
    !setsEqual(pendingGenders, new Set(currentFilters.genders || []));

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      {/* Header with clear button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm font-medium text-red-600 hover:text-red-700"
            disabled={isPending}
          >
            Clear All Filters
          </button>
        )}
      </div>

      {/* Search bar */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Search
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name or license number (e.g., NGUYEN or 101100116)"
          className="w-full rounded-md border border-foreground/20 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {searchQuery !== debouncedQ ? (
          <p className="mt-1 text-xs text-foreground/60">Searching...</p>
        ) : (
          <p className="mt-1 text-xs text-foreground/50">
            💡 Tip: Search without accents (NGUYEN) or use license numbers
          </p>
        )}
      </div>

      {/* Region & City */}
      {(regionOptions.length > 0 || cityOptions.length > 0) && (
        <div className="grid gap-4 sm:grid-cols-2">
          {regionOptions.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                Region
              </label>
              <select
                value={currentFilters.regionId || ""}
                onChange={(e) => {
                  updateFilter("region", e.target.value || undefined);
                  updateFilter("city", undefined); // Clear city when region changes
                }}
                disabled={isPending}
                className="w-full rounded-md border border-foreground/20 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Regions</option>
                {regionOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {cityOptions.length > 0 && (
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">
                City
              </label>
              <select
                value={currentFilters.cityId || ""}
                onChange={(e) => updateFilter("city", e.target.value || undefined)}
                disabled={isPending}
                className="w-full rounded-md border border-foreground/20 px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="">All Cities</option>
                {cityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Languages */}
      {facets.languages && facets.languages.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Languages ({facets.languages.length})
          </label>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {facets.languages.map((lang) => {
              const isSelected = pendingLanguages.has(lang.value);
              return (
                <label
                  key={lang.value}
                  className="inline-flex items-center gap-2 text-sm text-foreground/70 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLocalFilter("languages", lang.value)}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                  />
                  {getLanguageName(lang.value)} ({lang.count})
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Specialties */}
      {facets.specialties && facets.specialties.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Specialties ({facets.specialties.length})
          </label>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {facets.specialties.map((spec) => {
              const isSelected = pendingSpecialties.has(spec.value);
              return (
                <label
                  key={spec.value}
                  className="inline-flex items-center gap-2 text-sm text-foreground/70 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLocalFilter("specialties", spec.value)}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                  />
                  {spec.value} ({spec.count})
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Genders */}
      {facets.genders && facets.genders.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Gender
          </label>
          <div className="flex flex-wrap gap-4">
            {facets.genders.map((gender) => {
              const isSelected = pendingGenders.has(gender.value);
              return (
                <label
                  key={gender.value}
                  className="inline-flex items-center gap-2 text-sm text-foreground/70 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLocalFilter("genders", gender.value)}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                  />
                  {gender.value.charAt(0).toUpperCase() + gender.value.slice(1)} ({gender.count})
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Verification toggles */}
      <div className="space-y-2">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Verification
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentFilters.verified || false}
              onChange={(e) => updateFilter("verified", e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-foreground/70">Verified only</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={currentFilters.license || false}
              onChange={(e) => updateFilter("license", e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-foreground/70">Licensed only</span>
          </label>
        </div>
      </div>

      {/* Rating filter */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Minimum Rating
        </label>
        <div className="flex gap-2">
          {[5, 4, 3].map((rating) => (
            <button
              key={rating}
              onClick={() =>
                updateFilter(
                  "minRating",
                  currentFilters.minRating === rating ? undefined : rating
                )
              }
              disabled={isPending}
              className={`rounded-full px-3 py-1 text-sm transition ${
                currentFilters.minRating === rating
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {rating}+ ⭐
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Max Price per Day
        </label>
        <div className="space-y-3">
          <input
            type="range"
            min={0}
            max={500}
            step={10}
            value={maxPrice}
            onChange={(e) => setMaxPrice(Number(e.target.value))}
            onMouseUp={() => updateFilter("max", maxPrice > 0 ? maxPrice : undefined)}
            onTouchEnd={() => updateFilter("max", maxPrice > 0 ? maxPrice : undefined)}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-foreground/60">
            <span>$0</span>
            <span className="font-medium text-foreground">${maxPrice}</span>
            <span>$500</span>
          </div>
        </div>
      </div>

      {/* Apply Filters Button (only show if there are pending changes) */}
      {hasPendingChanges && (
        <div className="border-t border-foreground/10 pt-4">
          <button
            onClick={applyPendingFilters}
            disabled={isPending}
            className="w-full rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? "Applying..." : "Apply Filters"}
          </button>
        </div>
      )}
    </div>
  );
}

// Helper function to compare sets
function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
