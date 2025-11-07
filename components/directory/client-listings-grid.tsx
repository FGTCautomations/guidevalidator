"use client";

import { useMemo, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { ListingCard } from "./listing-card";
import { LoadingOverlay } from "./loading-state";
import { EmptyState } from "./empty-state";
import type { DirectoryListing } from "@/lib/directory/types";

interface ClientListingsGridProps {
  allListings: DirectoryListing[];
  actionLabel: string;
  emptyTitle: string;
  emptyDescription: string;
}

const ITEMS_PER_PAGE = 50; // Show 50 guides at a time

export function ClientListingsGrid({
  allListings,
  actionLabel,
  emptyTitle,
  emptyDescription,
}: ClientListingsGridProps) {
  const searchParams = useSearchParams();
  const [isFiltering, setIsFiltering] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const letter = searchParams.get("letter")?.toUpperCase() || "A";

  // Filter listings by selected letter (fast client-side filtering)
  const filteredListings = useMemo(() => {
    if (letter === "#") {
      // Show names starting with numbers or special characters
      return allListings.filter((listing) => {
        const firstChar = listing.name.charAt(0).toUpperCase();
        return !/^[A-Z]$/.test(firstChar);
      });
    } else if (/^[A-Z]$/.test(letter)) {
      // Show names starting with specific letter
      return allListings.filter((listing) => {
        const firstLetter = listing.name.charAt(0).toUpperCase();
        return firstLetter === letter;
      });
    }
    return allListings;
  }, [allListings, letter]);

  // Reset visible count when letter changes
  useEffect(() => {
    setIsFiltering(true);
    setVisibleCount(ITEMS_PER_PAGE); // Reset to first page
    const timer = setTimeout(() => setIsFiltering(false), 150);
    return () => clearTimeout(timer);
  }, [letter]);

  // Only show the first N items for performance
  const displayedListings = useMemo(() => {
    return filteredListings.slice(0, visibleCount);
  }, [filteredListings, visibleCount]);

  const hasMore = visibleCount < filteredListings.length;

  const loadMore = () => {
    setVisibleCount(prev => Math.min(prev + ITEMS_PER_PAGE, filteredListings.length));
  };

  if (isFiltering) {
    return (
      <div className="min-h-[200px] relative">
        <LoadingOverlay message={`Loading guides starting with "${letter}"...`} />
      </div>
    );
  }

  if (filteredListings.length === 0) {
    return (
      <EmptyState
        title={`No guides found starting with "${letter}"`}
        description="Try selecting a different letter or checking your other filters."
      />
    );
  }

  return (
    <>
      {/* Results count */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-900">
          Showing {displayedListings.length} of {filteredListings.length} {filteredListings.length === 1 ? "guide" : "guides"}
          {letter && ` starting with "${letter}"`}
        </p>
      </div>

      {/* Listings grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {displayedListings.map((listing) => (
          <ListingCard
            key={listing.id}
            listing={{ ...listing, role: "guide" }}
            actionLabel={actionLabel}
          />
        ))}
      </div>

      {/* Load More button */}
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={loadMore}
            className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            Load More ({filteredListings.length - visibleCount} remaining)
          </button>
        </div>
      )}
    </>
  );
}
