export const dynamic = "force-dynamic";

// Admin API route to toggle ad active status
// POST /api/admin/ads/:id/toggle
// Updated to use service role client for RLS bypass

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { toggleAdActive } from "@/lib/ads/queries";

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

export async function POST(
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

    const body = await request.json();
    const { isActive } = body;

    if (typeof isActive !== "boolean") {
      return NextResponse.json(
        { error: "isActive must be a boolean" },
        { status: 400 }
      );
    }

    // Use service role client to bypass RLS for admin operations
    const supabase = getSupabaseServiceRoleClient();
    const success = await toggleAdActive(id, isActive, supabase);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to toggle ad status" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, isActive });
  } catch (error) {
    console.error("Error toggling ad status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
