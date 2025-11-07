// AdSlot component - Conditional ad rendering (renders nothing if no ad matches)
// Server Component for SSR ad selection

import { selectAd } from "@/lib/ads/queries";
import type { AdSlotProps } from "@/lib/ads/types";
import { BannerAd } from "./BannerAd";
import { NativeCardAd } from "./NativeCardAd";
import { PartnerTiles } from "./PartnerTiles";

export async function AdSlot({
  placement,
  country,
  listContext,
  className,
}: AdSlotProps) {
  // Select ad using weighted rotation
  const ad = await selectAd({ placement, country, listContext });

  // Debug logging
  console.log(`[AdSlot] placement=${placement}, country=${country}, ad=`, ad ? `Found: ${ad.advertiser_name}` : 'No ad found');

  // If no ad matches criteria, render nothing (no empty space)
  if (!ad) {
    return null;
  }

  // Render appropriate component based on ad type
  switch (ad.ad_type) {
    case "banner":
      return <BannerAd ad={ad} className={className} placement={placement} />;
    case "native_card":
      return <NativeCardAd ad={ad} className={className} />;
    case "partner_tile":
      return <PartnerTiles ads={[ad]} className={className} />;
    default:
      return null;
  }
}
