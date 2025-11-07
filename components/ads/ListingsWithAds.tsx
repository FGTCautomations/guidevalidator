// ListingsWithAds component - Injects native sponsored ads into listing grids
// Server Component that conditionally renders ads at positions 3 and 10

import { selectAd } from "@/lib/ads/queries";
import { ListingCard } from "@/components/directory/listing-card";
import { NativeCardAd } from "./NativeCardAd";
import type { DirectoryListing } from "@/lib/directory/types";

interface ListingsWithAdsProps {
  listings: DirectoryListing[];
  listContext: "guides" | "dmcs" | "transport" | "agencies";
  country?: string;
}

export async function ListingsWithAds({
  listings,
  listContext,
  country,
}: ListingsWithAdsProps) {
  // Try to fetch sponsored ads for listings placement
  const ad1 = await selectAd({ placement: "listings", country, listContext });
  const ad2 = await selectAd({ placement: "listings", country, listContext });

  // Build the listings array with ads injected at positions 3 and 10
  const listingsWithAds: Array<{ type: "listing" | "ad"; data: any; key: string }> = [];

  listings.forEach((listing, index) => {
    // Add the listing
    listingsWithAds.push({
      type: "listing",
      data: listing,
      key: `listing-${listing.id}`,
    });

    // Inject ad after position 3 (index 2)
    if (index === 2 && ad1) {
      listingsWithAds.push({
        type: "ad",
        data: ad1,
        key: `ad-${ad1.id}-1`,
      });
    }

    // Inject ad after position 10 (index 9)
    if (index === 9 && ad2) {
      listingsWithAds.push({
        type: "ad",
        data: ad2,
        key: `ad-${ad2.id}-2`,
      });
    }
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {listingsWithAds.map((item) => {
        if (item.type === "listing") {
          return (
            <ListingCard
              key={item.key}
              listing={item.data}
              actionLabel="View Profile"
            />
          );
        } else {
          return <NativeCardAd key={item.key} ad={item.data} />;
        }
      })}
    </div>
  );
}
