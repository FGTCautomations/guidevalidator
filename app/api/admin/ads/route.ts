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
    return NextResponse.json(ads);
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

    const body: CreateAdInput = await request.json();

    // Validate required fields
    if (!body.advertiser_name || !body.ad_type || !body.placement || !body.start_at || !body.end_at) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate date range
    if (new Date(body.end_at) <= new Date(body.start_at)) {
      return NextResponse.json(
        { error: "end_at must be after start_at" },
        { status: 400 }
      );
    }

    const ad = await createAd(body, user.id);

    if (!ad) {
      return NextResponse.json(
        { error: "Failed to create ad" },
        { status: 500 }
      );
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
