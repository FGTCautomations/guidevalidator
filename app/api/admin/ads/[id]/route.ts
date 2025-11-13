export const dynamic = "force-dynamic";

// Admin API routes for individual ad management
// GET /api/admin/ads/:id - Get single ad
// PUT /api/admin/ads/:id - Update ad
// DELETE /api/admin/ads/:id - Delete ad

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getAdById, updateAd, deleteAd } from "@/lib/ads/queries";
import type { UpdateAdInput } from "@/lib/ads/types";

async function checkAdminAccess() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { authorized: false, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin = profile && ["admin", "super_admin"].includes(profile.role);

  return { authorized: isAdmin, user };
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized } = await checkAdminAccess();

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ad ID" }, { status: 400 });
    }

    const ad = await getAdById(id);

    if (!ad) {
      return NextResponse.json({ error: "Ad not found" }, { status: 404 });
    }

    return NextResponse.json(ad);
  } catch (error) {
    console.error("Error fetching ad:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized } = await checkAdminAccess();

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ad ID" }, { status: 400 });
    }

    const body: any = await request.json();

    // Extract list_context if present (not part of ad table)
    const list_context = body.list_context;

    // Remove list_context from body as it's not in ads table
    const { list_context: _, ...adData } = body;

    // Validate date range if both provided
    if (adData.start_at && adData.end_at) {
      if (new Date(adData.end_at) <= new Date(adData.start_at)) {
        return NextResponse.json(
          { error: "end_at must be after start_at" },
          { status: 400 }
        );
      }
    }

    const ad = await updateAd({ ...adData, id } as UpdateAdInput);

    if (!ad) {
      return NextResponse.json(
        { error: "Failed to update ad" },
        { status: 500 }
      );
    }

    // Update sponsored_listings if list_context is provided and placement includes "listings"
    if (list_context && adData.placement?.includes("listings")) {
      const { getSupabaseServiceRoleClient } = await import("@/lib/supabase/server");
      const supabase = getSupabaseServiceRoleClient();

      // Delete existing sponsored_listings for this ad
      await supabase.from("sponsored_listings").delete().eq("ad_id", id);

      // Create new entries for positions 3 and 10
      const { error: sponsoredError } = await supabase
        .from("sponsored_listings")
        .insert([
          { ad_id: id, list_context, insert_after: 3 },
          { ad_id: id, list_context, insert_after: 10 }
        ]);

      if (sponsoredError) {
        console.error("Error updating sponsored listings:", sponsoredError);
        // Don't fail the request, ad was updated successfully
      }
    } else if (!adData.placement?.includes("listings")) {
      // If placement no longer includes "listings", remove sponsored_listings
      const { getSupabaseServiceRoleClient } = await import("@/lib/supabase/server");
      const supabase = getSupabaseServiceRoleClient();
      await supabase.from("sponsored_listings").delete().eq("ad_id", id);
    }

    return NextResponse.json(ad);
  } catch (error) {
    console.error("Error updating ad:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { authorized } = await checkAdminAccess();

    if (!authorized) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid ad ID" }, { status: 400 });
    }

    const success = await deleteAd(id);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete ad" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting ad:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
