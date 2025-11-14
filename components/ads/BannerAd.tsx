"use client";

// BannerAd component - Responsive banner ad with brand styling
// Includes click tracking and accessibility features

import { useState } from "react";
import Image from "next/image";
import type { Ad } from "@/lib/ads/types";

interface BannerAdProps {
  ad: Ad;
  className?: string;
  placement?: string;
}

export function BannerAd({ ad, className = "", placement }: BannerAdProps) {
  const [imageError, setImageError] = useState(false);

  const handleClick = async () => {
    try {
      // Log click asynchronously (don't block navigation)
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

  // If image failed to load or no image URL, don't render
  if (imageError || !ad.image_url) {
    return null;
  }

  const content = (
    <div
      className={`relative overflow-hidden rounded-2xl bg-brand-bg shadow-sm transition-shadow hover:shadow-md ${className}`}
    >
      {/* Sponsored badge */}
      <div className="absolute left-2 top-2 z-10 rounded-lg bg-brand-neutral/90 px-2 py-1 text-xs font-medium text-brand-ink">
        Sponsored
      </div>

      {/* Banner image */}
      <div className={`relative w-full ${
        placement === 'sidebar'
          ? 'aspect-[300/600]'
          : 'aspect-[728/90] sm:aspect-[970/250] md:aspect-[728/90]'
      }`}>
        <Image
          src={ad.image_url}
          alt={ad.headline || `${ad.advertiser_name} advertisement`}
          fill
          sizes={placement === 'sidebar' ? '300px' : '(max-width: 768px) 100vw, (max-width: 1200px) 970px, 728px'}
          className="object-contain"
          onError={() => setImageError(true)}
          loading="lazy"
          quality={90}
        />
      </div>

      {/* Optional headline/description overlay */}
      {(ad.headline || ad.description) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-brand-ink/80 to-transparent p-4 text-white">
          {ad.headline && (
            <h3 className="font-roboto text-sm font-bold sm:text-base">
              {ad.headline}
            </h3>
          )}
          {ad.description && (
            <p className="font-inter mt-1 text-xs sm:text-sm">
              {ad.description}
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Wrap in link if target_url provided
  if (ad.target_url) {
    return (
      <a
        href={ad.target_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
        aria-label={`Sponsored: ${ad.headline || ad.advertiser_name}`}
      >
        {content}
      </a>
    );
  }

  return content;
}
