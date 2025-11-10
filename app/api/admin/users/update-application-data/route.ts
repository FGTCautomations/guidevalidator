export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse request body
    const { userId, userRole, data } = await request.json();

    if (!userId || !userRole || !data) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Use service client for admin operations
    const serviceClient = getSupabaseServiceClient();

    // Update the appropriate table based on user role
    if (userRole === "guide") {
      // Update guides table
      const { error: updateError } = await serviceClient
        .from("guides")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("profile_id", userId);

      if (updateError) {
        console.error("Guide update error:", updateError);
        return NextResponse.json(
          { error: `Failed to update guide data: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else if (["agency", "dmc", "transport"].includes(userRole)) {
      // Get organization_id from profile
      const { data: profileData } = await serviceClient
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (!profileData?.organization_id) {
        return NextResponse.json(
          { error: "User does not have an organization" },
          { status: 400 }
        );
      }

      // Update agencies table
      const { error: updateError } = await serviceClient
        .from("agencies")
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileData.organization_id);

      if (updateError) {
        console.error("Agency update error:", updateError);
        return NextResponse.json(
          { error: `Failed to update agency data: ${updateError.message}` },
          { status: 500 }
        );
      }
    } else {
      return NextResponse.json(
        { error: "Invalid user role for application data update" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Application data updated successfully",
    });
  } catch (error) {
    console.error("Application data update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}
