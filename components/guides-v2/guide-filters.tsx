"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Route } from "next";
import { useState, useTransition, useEffect, useCallback } from "react";
import type { GuideSearchParams, FacetCount } from "@/lib/guides/api";

interface GuideFiltersProps {
  facets: {
    languages: FacetCount[];
    specialties: FacetCount[];
    total: number;
  };
  currentFilters: GuideSearchParams;
}

export function GuideFilters({
  facets,
  currentFilters,
}: GuideFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for debounced search
  const [searchQuery, setSearchQuery] = useState(currentFilters.q || "");
  const [debouncedQ, setDebouncedQ] = useState(currentFilters.q || "");

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

  const toggleArrayFilter = (key: string, value: string) => {
    const current =
      (currentFilters[key as keyof GuideSearchParams] as string[] | undefined) ||
      [];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    updateFilter(key, updated.length > 0 ? updated : undefined);
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
  };

  const hasActiveFilters =
    currentFilters.q ||
    currentFilters.languages?.length ||
    currentFilters.specialties?.length ||
    currentFilters.genders?.length ||
    currentFilters.verified ||
    currentFilters.license ||
    currentFilters.minRating ||
    currentFilters.priceMin ||
    currentFilters.priceMax;

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
          placeholder="Search by name or license number..."
          className="w-full rounded-md border border-foreground/20 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {searchQuery !== debouncedQ && (
          <p className="mt-1 text-xs text-foreground/60">Searching...</p>
        )}
      </div>

      {/* Languages */}
      {facets.languages && facets.languages.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Languages ({facets.languages.length})
          </label>
          <div className="flex max-h-48 flex-wrap gap-2 overflow-y-auto">
            {facets.languages.map((lang) => (
              <button
                key={lang.value}
                onClick={() => toggleArrayFilter("languages", lang.value)}
                disabled={isPending}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  currentFilters.languages?.includes(lang.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {lang.value} ({lang.count})
              </button>
            ))}
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
            {facets.specialties.map((spec) => (
              <button
                key={spec.value}
                onClick={() => toggleArrayFilter("specialties", spec.value)}
                disabled={isPending}
                className={`rounded-full px-3 py-1 text-sm transition ${
                  currentFilters.specialties?.includes(spec.value)
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {spec.value} ({spec.count})
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Verification toggles */}
      <div className="space-y-2">
        <label className="mb-2 block text-sm font-medium text-foreground">
          Verification
        </label>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={currentFilters.verified || false}
              onChange={(e) => updateFilter("verified", e.target.checked)}
              disabled={isPending}
              className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
            />
            <span className="text-sm text-foreground/70">Verified only</span>
          </label>
          <label className="flex items-center gap-2">
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

      {/* Sort */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Sort by
        </label>
        <select
          value={currentFilters.sort || "featured"}
          onChange={(e) => updateFilter("sort", e.target.value)}
          disabled={isPending}
          className="w-full rounded-md border border-foreground/20 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        >
          <option value="featured">Featured (Best Match)</option>
          <option value="rating">Highest Rated</option>
          <option value="price">Lowest Price</option>
        </select>
      </div>

      {/* Loading indicator & results count */}
      <div className="flex items-center justify-between border-t pt-4 text-sm">
        <span className="text-foreground/70">
          {facets.total} {facets.total === 1 ? "guide" : "guides"} found
        </span>
        {isPending && (
          <span className="text-primary">Updating results...</span>
        )}
      </div>
    </div>
  );
}
