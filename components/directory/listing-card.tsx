import Link from "next/link";
import type { Route } from "next";
import Image from "next/image";

import type { DirectoryListing } from "@/lib/directory/types";
import { StarRating } from "@/components/ui/star-rating";

type ListingCardProps = {
  listing: DirectoryListing;
  actionLabel: string;
};

export function ListingCard({ listing, actionLabel }: ListingCardProps) {
  const languages = listing.languages ?? [];
  const specialties = listing.specialties ?? listing.tags ?? [];

  // Extract locale from the listing.href (format: /en/profiles/... or /es/profiles/...)
  const localeMatch = listing.href.match(/^\/([a-z]{2})\//);
  const locale = localeMatch ? localeMatch[1] : 'en';

  // Check if profile is featured (premium subscription)
  const isFeatured = listing.isFeatured || (listing.featuredScore && listing.featuredScore > 0);

  return (
    <article className={`flex flex-col gap-2 rounded-[var(--radius-xl)] border p-4 shadow-sm contact-protected ${
      isFeatured
        ? "border-yellow-400 bg-gradient-to-br from-yellow-50 to-white ring-2 ring-yellow-400/20"
        : "border-foreground/10 bg-white/80"
    }`}>
      {isFeatured && (
        <div className="mb-2 flex items-center gap-2">
          <svg className="h-4 w-4 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-semibold uppercase tracking-wide text-yellow-700">
            Featured
          </span>
        </div>
      )}
      <div className="flex items-start gap-3">
        {listing.avatarUrl ? (
          <div className="flex-shrink-0">
            <Image
              src={listing.avatarUrl}
              alt={listing.name}
              width={48}
              height={48}
              className="rounded-full object-cover"
            />
          </div>
        ) : null}
        <div className="flex-1 flex items-start justify-between gap-3">
          <div className="space-y-0.5">
            <h3 className="text-base font-semibold text-foreground">{listing.name}</h3>
            {listing.headline ? (
              <p className="text-xs text-foreground/70">{listing.headline}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-2">
          {listing.verified ? (
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
              Verified
            </span>
          ) : null}
          {!listing.profileCompleted && listing.profileCompletionPercentage && listing.profileCompletionPercentage < 100 ? (
            <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-orange-700">
              Incomplete Profile ({listing.profileCompletionPercentage}%)
            </span>
          ) : null}
          {listing.licenseRequired ? (
            listing.licenseAuthorityUrl ? (
              <a
                href={listing.licenseAuthorityUrl}
                target="_blank"
                rel="noreferrer"
                className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary hover:bg-secondary/20"
              >
                License required
              </a>
            ) : (
              <span className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
                License required
              </span>
            )
          ) : null}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/70">
        <span>{listing.location}</span>
        {/* Legacy rating display (from guide_ratings_summary) */}
        {typeof listing.rating === "number" && !listing.avgOverallRating ? (
          <span>{`\u2605 ${listing.rating.toFixed(1)} (${listing.reviewsCount ?? 0})`}</span>
        ) : null}
        {/* New review system rating display */}
        {listing.avgOverallRating ? (
          <div className="flex items-center gap-1">
            <StarRating
              rating={listing.avgOverallRating}
              readonly
              size="sm"
              showValue={false}
            />
            <span className="text-xs font-medium text-foreground">
              {listing.avgOverallRating.toFixed(1)}
            </span>
            <span className="text-xs text-foreground/60">
              ({listing.totalReviews ?? 0})
            </span>
          </div>
        ) : null}
      </div>
      {languages.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {languages.map((language, index) => (
            <span
              key={`${language}-${index}`}
              className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary"
            >
              {language}
            </span>
          ))}
        </div>
      ) : null}
      {specialties.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {specialties.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-foreground/5 px-2 py-0.5 text-xs font-medium text-foreground/70"
            >
              {chip}
            </span>
          ))}
        </div>
      ) : null}
      <div className="flex justify-end gap-2 mt-1">
        <Link
          href={`/${locale}/availability/${listing.id}?role=${listing.role || "guide"}` as Route}
          className="rounded-full border border-blue-500 px-3 py-1.5 text-xs font-semibold text-blue-500 transition hover:bg-blue-500 hover:text-white"
        >
          View Calendar
        </Link>
        <Link
          href={listing.href as Route}
          className="rounded-full border border-secondary px-3 py-1.5 text-xs font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
        >
          {actionLabel}
        </Link>
      </div>
    </article>
  );
}
