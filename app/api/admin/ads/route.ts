export const dynamic = "force-dynamic";

// Admin API routes for ads management
// GET /api/admin/ads - List all ads
// POST /api/admin/ads - Create new ad

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { getAllAds, createAd } from "@/lib/ads/queries";
import type { CreateAdInput } from "@/lib/ads/types";

async function checkAdminAccess() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, user: null };
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile && ["admin", "super_admin"].includes(profile.role);

  return { authorized: isAdmin, user };
}

export async function GET() {
  try {
    const { authorized } = await checkAdminAccess();

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Use service role client to bypass RLS and show all ads (active and inactive)
    const supabase = getSupabaseServiceRoleClient();
    const ads = await getAllAds(supabase);

    // Fetch sponsored_listings for each ad to get list_context
    const adsWithContext = await Promise.all(
      ads.map(async (ad) => {
        const { data: sponsoredListings } = await supabase
          .from("sponsored_listings")
          .select("list_context")
          .eq("ad_id", ad.id)
          .limit(1)
          .maybeSingle();

        return {
          ...ad,
          list_context: sponsoredListings?.list_context || null,
        };
      })
    );

    return NextResponse.json(adsWithContext);
  } catch (error) {
    console.error("Error fetching ads:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { authorized, user } = await checkAdminAccess();

    if (!authorized || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body: any = await request.json();

    // Extract list_context if present (not part of ad table)
    const list_context = body.list_context;

    // Remove list_context from body as it's not in ads table
    const { list_context: _, ...adData } = body;

    // Validate required fields
    if (!adData.advertiser_name || !adData.ad_type || !adData.placement || !adData.start_at || !adData.end_at) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(adData.end_at) <= new Date(adData.start_at)) {
      return NextResponse.json(
        { error: "end_at must be after start_at" },
        { status: 400 }
      );
    }

    const ad = await createAd(adData as CreateAdInput, user.id);

    if (!ad) {
      return NextResponse.json(
        { error: "Failed to create ad" },
        { status: 500 }
      );
    }

    // If list_context is provided and placement includes "listings", create sponsored_listings entry
    if (list_context && adData.placement.includes("listings")) {
      const supabase = getSupabaseServiceRoleClient();

      // Create entries for positions 3 and 10
      const { error: sponsoredError } = await supabase
        .from("sponsored_listings")
        .insert([
          { ad_id: ad.id, list_context, insert_after: 3 },
          { ad_id: ad.id, list_context, insert_after: 10 }
        ]);

      if (sponsoredError) {
        console.error("Error creating sponsored listings:", sponsoredError);
        // Don't fail the request, ad was created successfully
      }
    }

    return NextResponse.json(ad, { status: 201 });
  } catch (error) {
    console.error("Error creating ad:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
