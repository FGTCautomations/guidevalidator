"use client";

// PartnerTiles component - Grid of partner/sponsor tiles
// Shows 3-4 partner logos with one-liner and CTA

import { useState } from "react";
import Image from "next/image";
import type { Ad } from "@/lib/ads/types";

interface PartnerTilesProps {
  ads: Ad[];
  className?: string;
}

export function PartnerTiles({ ads, className = "" }: PartnerTilesProps) {
  // Filter out invalid ads
  const validAds = ads.filter((ad) => ad.image_url && ad.headline);

  if (validAds.length === 0) {
    return null;
  }

  return (
    <section
      className={`rounded-2xl bg-brand-bg p-6 sm:p-8 ${className}`}
      aria-labelledby="partner-tiles-heading"
    >
      {/* Section header */}
      <div className="mb-6 text-center">
        <h2
          id="partner-tiles-heading"
          className="font-roboto text-lg font-bold text-brand-ink sm:text-xl"
        >
          Sponsored Partners
        </h2>
        <p className="font-inter mt-1 text-sm text-foreground/70">
          Trusted travel partners and sponsors
        </p>
      </div>

      {/* Partner grid */}
      <div
        className={`grid gap-4 ${
          validAds.length === 1
            ? "grid-cols-1"
            : validAds.length === 2
              ? "grid-cols-1 sm:grid-cols-2"
              : validAds.length === 3
                ? "grid-cols-1 sm:grid-cols-3"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
        }`}
      >
        {validAds.map((ad) => (
          <PartnerTile key={ad.id} ad={ad} />
        ))}
      </div>
    </section>
  );
}

interface PartnerTileProps {
  ad: Ad;
}

function PartnerTile({ ad }: PartnerTileProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = async () => {
    try {
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

  if (imageError || !ad.image_url) {
    return null;
  }

  const content = (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-foreground/10 bg-white p-4 text-center shadow-sm transition-all hover:scale-105 hover:shadow-md">
      {/* Logo */}
      <div className="relative h-16 w-16">
        <Image
          src={ad.image_url}
          alt={ad.advertiser_name}
          fill
          className="object-contain"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>

      {/* Headline (one-liner) */}
      {ad.headline && (
        <h3 className="font-roboto text-sm font-semibold text-brand-ink">
          {ad.headline}
        </h3>
      )}

      {/* Description (optional) */}
      {ad.description && (
        <p className="font-inter text-xs text-foreground/70 line-clamp-2">
          {ad.description}
        </p>
      )}

      {/* CTA */}
      {ad.target_url && (
        <span className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-brand-primary/90">
          {ad.cta_label || "Learn More"}
        </span>
      )}

      {/* Sponsored badge */}
      <span className="text-[10px] uppercase tracking-wide text-foreground/50">
        Sponsored
      </span>
    </div>
  );

  if (ad.target_url) {
    return (
      <a
        href={ad.target_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        aria-label={`Sponsored: ${ad.headline || ad.advertiser_name}`}
      >
        {content}
      </a>
    );
  }

  return content;
}
