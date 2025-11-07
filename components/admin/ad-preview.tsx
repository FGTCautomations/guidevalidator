"use client";

// AdPreview component - Shows how ad will render in different placements

import type { Ad } from "@/lib/ads/types";
import { BannerAd } from "@/components/ads/BannerAd";
import { NativeCardAd } from "@/components/ads/NativeCardAd";
import { PartnerTiles } from "@/components/ads/PartnerTiles";

interface AdPreviewProps {
  ad: Ad;
}

export function AdPreview({ ad }: AdPreviewProps) {
  return (
    <div className="space-y-4">
      {ad.ad_type === "banner" && <BannerAd ad={ad} />}
      {ad.ad_type === "native_card" && <NativeCardAd ad={ad} />}
      {ad.ad_type === "partner_tile" && <PartnerTiles ads={[ad]} />}

      {/* Preview hints */}
      <div className="rounded-lg bg-blue-50 p-3 text-xs text-blue-900">
        <p className="font-medium">Preview Notes:</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          <li>
            This is a preview of how your ad will appear on the frontend
          </li>
          <li>Actual rendering depends on placement and screen size</li>
          <li>Click tracking is disabled in preview mode</li>
        </ul>
      </div>
    </div>
  );
}
