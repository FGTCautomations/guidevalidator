"use client";

// NativeCardAd component - Matches listing card UI with "Sponsored" badge
// Inherits styling from listing cards for seamless integration

import { useState } from "react";
import Image from "next/image";
import type { Ad } from "@/lib/ads/types";

interface NativeCardAdProps {
  ad: Ad;
  className?: string;
}

export function NativeCardAd({ ad, className = "" }: NativeCardAdProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = async () => {
    try {
      // Log click asynchronously
      fetch("/api/ads/click", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adId: ad.id,
          page: window.location.pathname,
        }),
      }).catch((err) => console.error("Failed to log ad click:", err));
    } catch (error) {
      console.error("Error logging ad click:", error);
    }
  };

  // If no headline or description, don't render
  if (!ad.headline && !ad.description) {
    return null;
  }

  const content = (
    <article
      className={`flex flex-col gap-2 rounded-[var(--radius-xl)] border border-brand-primary/30 bg-gradient-to-br from-brand-bg to-white p-4 shadow-sm ring-2 ring-brand-primary/20 transition-shadow hover:shadow-md ${className}`}
    >
      {/* Sponsored badge - prominent like Featured badge */}
      <div className="mb-2 flex items-center gap-2">
        <svg
          className="h-4 w-4 text-brand-primary"
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
        <span className="text-xs font-semibold uppercase tracking-wide text-brand-primary">
          Sponsored
        </span>
      </div>

      <div className="flex items-start gap-3">
        {/* Logo/Image */}
        {ad.image_url && !imageError && (
          <div className="flex-shrink-0">
            <Image
              src={ad.image_url}
              alt={ad.advertiser_name}
              width={48}
              height={48}
              className="rounded-full object-cover"
              onError={() => setImageError(true)}
              loading="lazy"
            />
          </div>
        )}

        <div className="flex-1 space-y-0.5">
          {/* Headline */}
          {ad.headline && (
            <h3 className="font-roboto text-base font-semibold text-brand-ink">
              {ad.headline}
            </h3>
          )}

          {/* Advertiser name (subtitle) */}
          <p className="font-inter text-xs text-foreground/70">
            {ad.advertiser_name}
          </p>
        </div>
      </div>

      {/* Description */}
      {ad.description && (
        <p className="font-inter text-sm text-foreground/80">
          {ad.description}
        </p>
      )}

      {/* CTA Button */}
      {ad.target_url && (
        <div className="mt-2 flex justify-end">
          <span className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-4 py-2 text-sm font-medium text-white transition-all hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2">
            {ad.cta_label || "Learn More"}
          </span>
        </div>
      )}
    </article>
  );

  // Wrap in link if target_url provided
  if (ad.target_url) {
    return (
      <a
        href={ad.target_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block"
        aria-label={`Sponsored: ${ad.headline || ad.advertiser_name}`}
      >
        {content}
      </a>
    );
  }

  return content;
}
