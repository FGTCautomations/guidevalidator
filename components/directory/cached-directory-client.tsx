"use client";

import { useState, useEffect, useMemo } from "react";
import { ListingCard } from "./listing-card";
import { LoadingOverlay } from "./loading-state";
import { EmptyState } from "./empty-state";
import type { DirectoryListing } from "@/lib/directory/types";

interface CachedDirectoryClientProps {
  initialListings: DirectoryListing[];
  countryCode: string;
  selectedLetter: string;
  actionLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

// Global cache to persist across component re-renders
const countryCache = new Map<string, DirectoryListing[]>();

export function CachedDirectoryClient({
  initialListings,
  countryCode,
  selectedLetter,
  actionLabel,
  emptyTitle,
  emptyDescription,
}: CachedDirectoryClientProps) {
  const [isFilteringLetter, setIsFilteringLetter] = useState(false);
  const [prevLetter, setPrevLetter] = useState(selectedLetter);

  // Check if we have cached data for this country
  const [allListings, setAllListings] = useState<DirectoryListing[]>(() => {
    const cached = countryCache.get(countryCode);
    if (cached) {
      console.log(`[Cache] Using cached data for ${countryCode}: ${cached.length} guides`);
      return cached;
    }
    console.log(`[Cache] Caching initial data for ${countryCode}: ${initialListings.length} guides`);
    countryCache.set(countryCode, initialListings);
    return initialListings;
  });

  // Update cache if initial listings change (e.g., filters applied)
  useEffect(() => {
    console.log(`[Cache] Updating cache for ${countryCode}: ${initialListings.length} guides`);
    countryCache.set(countryCode, initialListings);
    setAllListings(initialListings);
  }, [countryCode, initialListings]);

  // Filter by letter (instant - all data is in browser memory)
  const filteredListings = useMemo(() => {
    const startTime = performance.now();

    let filtered: DirectoryListing[];
    if (selectedLetter === "#") {
      filtered = allListings.filter((listing) => {
        const firstChar = listing.name.charAt(0).toUpperCase();
        return !/^[A-Z]$/.test(firstChar);
      });
    } else if (/^[A-Z]$/.test(selectedLetter)) {
      filtered = allListings.filter((listing) => {
        const firstLetter = listing.name.charAt(0).toUpperCase();
        return firstLetter === selectedLetter;
      });
    } else {
      filtered = allListings;
    }

    const duration = performance.now() - startTime;
    console.log(`[Cache] Filtered ${allListings.length} guides to ${filtered.length} for letter '${selectedLetter}' in ${duration.toFixed(2)}ms`);

    return filtered;
  }, [allListings, selectedLetter]);

  // Detect when letter changes from parent
  useEffect(() => {
    if (selectedLetter !== prevLetter) {
      setIsFilteringLetter(true);
      setPrevLetter(selectedLetter);
      // Very brief loading indicator for visual feedback
      setTimeout(() => setIsFilteringLetter(false), 50);
    }
  }, [selectedLetter, prevLetter]);

  if (isFilteringLetter) {
    return (
      <div className="min-h-[200px] relative">
        <LoadingOverlay message={`Filtering guides starting with "${selectedLetter}"...`} />
      </div>
    );
  }

  return (
    <>
      {filteredListings.length === 0 ? (
        <EmptyState
          title={`No guides found starting with "${selectedLetter}"`}
          description="Try selecting a different letter or checking your other filters."
        />
      ) : (
        <>
          {/* Results count */}
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-900">
              {filteredListings.length} {filteredListings.length === 1 ? "guide" : "guides"} found
              {selectedLetter && ` starting with "${selectedLetter}"`}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {allListings.length} total guides cached in browser
            </p>
          </div>

          {/* Listings grid - show ALL guides for the letter */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={{ ...listing, role: "guide" }}
                actionLabel={actionLabel}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
