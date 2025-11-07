"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Route } from "next";
import { useState, useTransition, useEffect, useCallback } from "react";
import type { DMCSearchParams, FacetCount } from "@/lib/dmcs/api";
import { getLanguageName } from "@/lib/utils/language-names";

interface DMCFiltersProps {
  facets: {
    languages: FacetCount[];
    specializations: FacetCount[];
    services: FacetCount[];
    total: number;
  };
  currentFilters: DMCSearchParams;
}

export function DMCFilters({
  facets,
  currentFilters,
}: DMCFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Local state for debounced search
  const [searchQuery, setSearchQuery] = useState(currentFilters.q || "");
  const [debouncedQ, setDebouncedQ] = useState(currentFilters.q || "");

  // Local state for pending checkbox selections
  const [pendingLanguages, setPendingLanguages] = useState<Set<string>>(
    () => new Set(currentFilters.languages || [])
  );
  const [pendingSpecializations, setPendingSpecializations] = useState<Set<string>>(
    () => new Set(currentFilters.specializations || [])
  );
  const [pendingServices, setPendingServices] = useState<Set<string>>(
    () => new Set(currentFilters.services || [])
  );

  // Sync pending state with URL changes
  useEffect(() => {
    setPendingLanguages(new Set(currentFilters.languages || []));
    setPendingSpecializations(new Set(currentFilters.specializations || []));
    setPendingServices(new Set(currentFilters.services || []));
  }, [currentFilters.languages, currentFilters.specializations, currentFilters.services]);

  // Debounce search input
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

      params.delete("cursor");

      startTransition(() => {
        const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
        router.replace(url as Route, { scroll: false });
      });
    },
    [pathname, router, searchParams]
  );

  const toggleLocalFilter = (filterType: 'languages' | 'specializations' | 'services', value: string) => {
    if (filterType === 'languages') {
      const updated = new Set(pendingLanguages);
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      setPendingLanguages(updated);
    } else if (filterType === 'specializations') {
      const updated = new Set(pendingSpecializations);
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      setPendingSpecializations(updated);
    } else if (filterType === 'services') {
      const updated = new Set(pendingServices);
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      setPendingServices(updated);
    }
  };

  const applyPendingFilters = () => {
    const params = new URLSearchParams(searchParams?.toString());

    if (pendingLanguages.size > 0) {
      params.set("lang", Array.from(pendingLanguages).join(","));
    } else {
      params.delete("lang");
    }

    if (pendingSpecializations.size > 0) {
      params.set("specializations", Array.from(pendingSpecializations).join(","));
    } else {
      params.delete("specializations");
    }

    if (pendingServices.size > 0) {
      params.set("services", Array.from(pendingServices).join(","));
    } else {
      params.delete("services");
    }

    params.delete("cursor");

    startTransition(() => {
      const url = params.toString() ? `${pathname}?${params.toString()}` : pathname;
      router.replace(url as Route, { scroll: false });
    });
  };

  const clearAllFilters = () => {
    const params = new URLSearchParams();
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
    setPendingSpecializations(new Set());
    setPendingServices(new Set());
  };

  const hasActiveFilters =
    currentFilters.q ||
    currentFilters.languages?.length ||
    currentFilters.specializations?.length ||
    currentFilters.services?.length ||
    currentFilters.minRating;

  const hasPendingChanges =
    pendingLanguages.size !== (currentFilters.languages?.length || 0) ||
    pendingSpecializations.size !== (currentFilters.specializations?.length || 0) ||
    pendingServices.size !== (currentFilters.services?.length || 0) ||
    !setsEqual(pendingLanguages, new Set(currentFilters.languages || [])) ||
    !setsEqual(pendingSpecializations, new Set(currentFilters.specializations || [])) ||
    !setsEqual(pendingServices, new Set(currentFilters.services || []));

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">Filters</h2>
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="text-sm font-medium text-red-600 hover:text-red-700"
            disabled={isPending}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          Search
        </label>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search DMCs..."
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
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
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

      {/* Specializations */}
      {facets.specializations && facets.specializations.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Specializations ({facets.specializations.length})
          </label>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {facets.specializations.map((spec) => {
              const isSelected = pendingSpecializations.has(spec.value);
              return (
                <label
                  key={spec.value}
                  className="inline-flex items-center gap-2 text-sm text-foreground/70 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLocalFilter("specializations", spec.value)}
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

      {/* Services */}
      {facets.services && facets.services.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Services ({facets.services.length})
          </label>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {facets.services.map((service) => {
              const isSelected = pendingServices.has(service.value);
              return (
                <label
                  key={service.value}
                  className="inline-flex items-center gap-2 text-sm text-foreground/70 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLocalFilter("services", service.value)}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                  />
                  {service.value} ({service.count})
                </label>
              );
            })}
          </div>
        </div>
      )}

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

      {/* Apply Filters Button */}
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

function setsEqual<T>(a: Set<T>, b: Set<T>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
