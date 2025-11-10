export const dynamic = "force-dynamic";

// API route for ad click tracking
// POST /api/ads/click

import { NextRequest, NextResponse } from "next/server";
import { logAdClick } from "@/lib/ads/queries";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { adId, page, country } = body;

    if (!adId) {
      return NextResponse.json(
        { error: "adId is required" },
        { status: 400 }
      );
    }

    const success = await logAdClick(adId, country, page);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to log click" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error logging ad click:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
