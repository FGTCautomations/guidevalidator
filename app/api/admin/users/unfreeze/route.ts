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

    const { userId, userType } = await request.json();

    if (!userId || !userType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    console.log(`[Admin] Unfreezing account: ${userId} (${userType}) by ${user.id}`);

    // Check if this profile has an auth account
    const { data: authUser, error: authCheckError } = await serviceClient.auth.admin.getUserById(userId);

    if (!authCheckError && authUser?.user) {
      // Unban the user account in Supabase Auth (only if auth account exists)
      const { error: unbanError } = await serviceClient.auth.admin.updateUserById(userId, {
        ban_duration: "none",
      });

      if (unbanError) {
        console.error("[Admin] Error unbanning user:", unbanError);
        return NextResponse.json({ error: "Failed to unfreeze account in auth system" }, { status: 500 });
      }
      console.log(`[Admin] Auth account unbanned: ${userId}`);
    } else {
      console.log(`[Admin] No auth account found for ${userId}, skipping auth unban (profile-only account)`);
    }

    // Clear the freeze status from profile/agency
    if (userType === "guides") {
      // For guides, check if rejection_reason starts with "FROZEN:"
      const { data: profile } = await supabase
        .from("profiles")
        .select("rejection_reason")
        .eq("id", userId)
        .single();

      if (profile && profile.rejection_reason?.startsWith("FROZEN:")) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({
            rejection_reason: null, // Clear the freeze reason
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error("[Admin] Error updating profile:", updateError);
          return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
        }
      }
    } else {
      // For agencies/DMCs/transport
      // First, get the organization_id from the profile
      const { data: profileData } = await serviceClient
        .from("profiles")
        .select("organization_id")
        .eq("id", userId)
        .single();

      if (!profileData?.organization_id) {
        console.error("[Admin] User does not have an organization_id");
        return NextResponse.json({ error: "User does not have an organization" }, { status: 400 });
      }

      const { data: agency } = await serviceClient
        .from("agencies")
        .select("rejection_reason")
        .eq("id", profileData.organization_id)
        .single();

      if (agency && agency.rejection_reason?.startsWith("FROZEN:")) {
        const { error: updateError } = await serviceClient
          .from("agencies")
          .update({
            rejection_reason: null, // Clear the freeze reason
            updated_at: new Date().toISOString(),
          })
          .eq("id", profileData.organization_id);

        if (updateError) {
          console.error("[Admin] Error updating agency:", updateError);
          return NextResponse.json({ error: "Failed to update agency" }, { status: 500 });
        }
      }
    }

    console.log(`[Admin] Account unfrozen successfully: ${userId}`);

    // TODO: Send email notification to user about account unfreeze

    return NextResponse.json({
      success: true,
      message: "Account unfrozen successfully",
    });
  } catch (error) {
    console.error("[Admin] Error unfreezing account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
