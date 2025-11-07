"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import type { Route } from "next";
import { useState, useTransition, useEffect, useCallback } from "react";
import type { TransportSearchParams, FacetCount } from "@/lib/transport/api";
import { getLanguageName } from "@/lib/utils/language-names";

interface TransportFiltersProps {
  facets: {
    languages: FacetCount[];
    serviceTypes: FacetCount[];
    total: number;
  };
  currentFilters: TransportSearchParams;
}

export function TransportFilters({
  facets,
  currentFilters,
}: TransportFiltersProps) {
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
  const [pendingServiceTypes, setPendingServiceTypes] = useState<Set<string>>(
    () => new Set(currentFilters.serviceTypes || [])
  );

  // Sync pending state with URL changes
  useEffect(() => {
    setPendingLanguages(new Set(currentFilters.languages || []));
    setPendingServiceTypes(new Set(currentFilters.serviceTypes || []));
  }, [currentFilters.languages, currentFilters.serviceTypes]);

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

  const toggleLocalFilter = (filterType: 'languages' | 'serviceTypes', value: string) => {
    if (filterType === 'languages') {
      const updated = new Set(pendingLanguages);
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      setPendingLanguages(updated);
    } else if (filterType === 'serviceTypes') {
      const updated = new Set(pendingServiceTypes);
      if (updated.has(value)) {
        updated.delete(value);
      } else {
        updated.add(value);
      }
      setPendingServiceTypes(updated);
    }
  };

  const applyPendingFilters = () => {
    const params = new URLSearchParams(searchParams?.toString());

    if (pendingLanguages.size > 0) {
      params.set("lang", Array.from(pendingLanguages).join(","));
    } else {
      params.delete("lang");
    }

    if (pendingServiceTypes.size > 0) {
      params.set("serviceTypes", Array.from(pendingServiceTypes).join(","));
    } else {
      params.delete("serviceTypes");
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
    setPendingServiceTypes(new Set());
  };

  const hasActiveFilters =
    currentFilters.q ||
    currentFilters.languages?.length ||
    currentFilters.serviceTypes?.length ||
    currentFilters.minRating;

  const hasPendingChanges =
    pendingLanguages.size !== (currentFilters.languages?.length || 0) ||
    pendingServiceTypes.size !== (currentFilters.serviceTypes?.length || 0) ||
    !setsEqual(pendingLanguages, new Set(currentFilters.languages || [])) ||
    !setsEqual(pendingServiceTypes, new Set(currentFilters.serviceTypes || []));

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
          placeholder="Search transport providers..."
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

      {/* Service Types */}
      {facets.serviceTypes && facets.serviceTypes.length > 0 && (
        <div>
          <label className="mb-2 block text-sm font-medium text-foreground">
            Service Types ({facets.serviceTypes.length})
          </label>
          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {facets.serviceTypes.map((type) => {
              const isSelected = pendingServiceTypes.has(type.value);
              return (
                <label
                  key={type.value}
                  className="inline-flex items-center gap-2 text-sm text-foreground/70 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleLocalFilter("serviceTypes", type.value)}
                    disabled={isPending}
                    className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                  />
                  {type.value} ({type.count})
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
