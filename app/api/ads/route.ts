// API route for ad selection
// GET /api/ads?placement=homepage_mid&country=XX

import { NextRequest, NextResponse } from "next/server";
import { selectAd } from "@/lib/ads/queries";
import type { AdPlacement } from "@/lib/ads/types";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const placement = searchParams.get("placement") as AdPlacement;
    const country = searchParams.get("country") || undefined;
    const listContext = searchParams.get("listContext") as "guides" | "dmcs" | "transport" | "agencies" | undefined;

    if (!placement) {
      return NextResponse.json(
        { error: "Placement parameter is required" },
        { status: 400 }
      );
    }

    // Validate placement
    const validPlacements: AdPlacement[] = ["homepage_mid", "listings", "sidebar", "footer"];
    if (!validPlacements.includes(placement)) {
      return NextResponse.json(
        { error: "Invalid placement value" },
        { status: 400 }
      );
    }

    const ad = await selectAd({ placement, country, listContext });

    // Return empty object if no ad found (conditional rendering)
    if (!ad) {
      return NextResponse.json({});
    }

    return NextResponse.json(ad);
  } catch (error) {
    console.error("Error in ads route:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
