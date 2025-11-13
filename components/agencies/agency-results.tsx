"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  searchAgencies,
  type AgencyResult,
  type AgencySearchParams,
} from "@/lib/agencies/api";
import { ListingCard } from "@/components/directory/listing-card";
import { getLanguageName } from "@/lib/utils/locale";
import type { SupportedLocale } from "@/i18n/config";
import { ClientAdInjector } from "@/components/ads/ClientAdInjector";

interface AgencyResultsProps {
  initialResults: AgencyResult[];
  initialCursor?: string;
  currentFilters: AgencySearchParams;
  totalCount: number;
  locale: SupportedLocale;
}

export function AgencyResults({
  initialResults,
  initialCursor,
  currentFilters,
  totalCount,
  locale,
}: AgencyResultsProps) {
  const [results, setResults] = useState(initialResults);
  const [cursor, setCursor] = useState(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(!!initialCursor);

  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Reset when filters change
  useEffect(() => {
    setResults(initialResults);
    setCursor(initialCursor);
    setHasMore(!!initialCursor);
  }, [initialResults, initialCursor]);

  // Load more results
  const loadMore = useCallback(async () => {
    if (!cursor || isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const data = await searchAgencies({
        ...currentFilters,
        cursor,
      });

      setResults((prev) => [...prev, ...data.results]);
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    } catch (error) {
      console.error("Failed to load more results:", error);
    } finally {
      setIsLoading(false);
    }
  }, [cursor, currentFilters, isLoading, hasMore]);

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, [hasMore, isLoading, loadMore]);

  // Transform agency results to directory listing format
  const transformedResults = results.map((agency) => {
    // Transform language codes to full names
    const languageNames = agency.languages
      .map((code) => {
        const cleanCode = code.replace(/^["']|["']$/g, "").trim();
        return getLanguageName(locale, cleanCode) || cleanCode.toUpperCase();
      })
      .filter(Boolean);

    return {
      id: agency.id,
      name: agency.name,
      headline: undefined,
      location: agency.country_code,
      countryCode: agency.country_code,
      languages: languageNames,
      specialties: agency.specialties,
      verified: false,
      licenseVerified: false,
      hasLiabilityInsurance: false,
      childFriendly: false,
      rating: agency.rating,
      reviewsCount: agency.review_count,
      totalReviews: agency.review_count,
      avgOverallRating: agency.rating,
      hourlyRate: null,
      currency: null,
      avatarUrl: agency.logo_url ?? undefined,
      href: `/${locale}/profiles/agency/${agency.id}`,
      role: "agency" as const,
      websiteUrl: agency.website_url,
    };
  });

  if (results.length === 0) {
    return (
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
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <h3 className="text-lg font-semibold text-foreground">
            No Agencies Found
          </h3>
          <p className="text-sm text-foreground/70">
            Try adjusting your filters or search query to find more agencies.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <p className="text-sm font-medium text-gray-900">
          Showing {results.length} of {totalCount}{" "}
          {totalCount === 1 ? "agency" : "agencies"}
        </p>
        {hasMore && (
          <p className="mt-1 text-xs text-gray-600">
            Scroll down to load more results
          </p>
        )}
      </div>

      {/* Listings grid with ads */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {transformedResults.map((listing, index) => (
          <>
            <ListingCard
              key={listing.id}
              listing={listing}
              actionLabel="View Profile"
            />

            {/* Inject ad after 3rd item (index 2) */}
            {index === 2 && (
              <ClientAdInjector
                position={3}
                listContext="agencies"
                country={currentFilters.country}
              />
            )}

            {/* Inject ad after 10th item (index 9) */}
            {index === 9 && (
              <ClientAdInjector
                position={10}
                listContext="agencies"
                country={currentFilters.country}
              />
            )}
          </>
        ))}
      </div>

      {/* Infinite scroll trigger */}
      {hasMore && (
        <div ref={loadMoreRef} className="py-8 text-center">
          {isLoading ? (
            <div className="flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
              <p className="text-sm text-muted-foreground">
                Loading more agencies...
              </p>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              Scroll for more results
            </div>
          )}
        </div>
      )}

      {!hasMore && results.length > 0 && (
        <div className="rounded-lg border border-foreground/10 bg-white p-6 text-center">
          <p className="text-sm text-muted-foreground">
            ✓ All {results.length} agencies loaded
          </p>
        </div>
      )}
    </div>
  );
}
