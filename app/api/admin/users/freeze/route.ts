export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const serviceClient = getSupabaseServiceClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const { data: adminProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!adminProfile || !["admin", "super_admin"].includes(adminProfile.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    const { userId, userType, reason } = await request.json();

    if (!userId || !userType || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[Admin] Freezing account: ${userId} (${userType}) by ${user.id}`);
    console.log(`[Admin] Reason: ${reason}`);

    // Ban the user account in Supabase Auth
    // Use a very long ban duration (876000 hours = 100 years)
    const { error: banError } = await serviceClient.auth.admin.updateUserById(userId, {
      ban_duration: "876000h", // ~100 years
    });

    if (banError) {
      console.error("[Admin] Error banning user:", banError);
      return NextResponse.json({ error: "Failed to freeze account in auth system" }, { status: 500 });
    }

    // Update the profile/agency status to indicate frozen
    if (userType === "guides") {
      // For guides, update the profile
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          // We'll use a custom field to track freeze status
          // Or we can add a new column, but for now let's use rejection_reason
          rejection_reason: `FROZEN: ${reason} (Frozen on ${new Date().toISOString()} by admin ${user.id})`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[Admin] Error updating profile:", updateError);
        // Rollback the ban
        await serviceClient.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });
        return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
      }
    } else {
      // For agencies/DMCs/transport, update the agencies table
      // First, get the organization_id from the profile
      const { data: profileData } = await serviceClient
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (!profileData?.organization_id) {
        console.error("[Admin] User does not have an organization_id");
        // Rollback the ban
        await serviceClient.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });
        return NextResponse.json({ error: "User does not have an organization" }, { status: 400 });
      }

      const { error: updateError } = await serviceClient
        .from("agencies")
        .update({
          rejection_reason: `FROZEN: ${reason} (Frozen on ${new Date().toISOString()} by admin ${user.id})`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileData.organization_id);

      if (updateError) {
        console.error("[Admin] Error updating agency:", updateError);
        // Rollback the ban
        await serviceClient.auth.admin.updateUserById(userId, {
          ban_duration: "none",
        });
        return NextResponse.json({ error: "Failed to update agency" }, { status: 500 });
      }
    }

    console.log(`[Admin] Account frozen successfully: ${userId}`);

    // TODO: Send email notification to user about account freeze

    return NextResponse.json({
      success: true,
      message: "Account frozen successfully",
    });
  } catch (error) {
    console.error("[Admin] Error freezing account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
