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

    console.log(`[Admin] DELETING account: ${userId} (${userType}) by ${user.id}`);
    console.warn(`[Admin] This is a PERMANENT action!`);

    // Step 1: Delete from the appropriate table first (will cascade delete related records)
    if (userType === "guides") {
      // Delete guide record
      const { error: guideError } = await supabase
        .from("guides")
        .delete()
        .eq("profile_id", userId);

      if (guideError) {
        console.error("[Admin] Error deleting guide:", guideError);
        return NextResponse.json({ error: "Failed to delete guide record" }, { status: 500 });
      }

      // Delete profile record
      const { error: profileError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        console.error("[Admin] Error deleting profile:", profileError);
        return NextResponse.json({ error: "Failed to delete profile record" }, { status: 500 });
      }
    } else {
      // Delete agency/DMC/transport record
      const { error: agencyError } = await supabase
        .from("agencies")
        .delete()
        .eq("id", userId);

      if (agencyError) {
        console.error("[Admin] Error deleting agency:", agencyError);
        return NextResponse.json({ error: "Failed to delete agency record" }, { status: 500 });
      }
    }

    // Step 2: Delete the user from Supabase Auth
    // This should be done last to ensure we can still access auth if needed
    const { error: deleteAuthError } = await serviceClient.auth.admin.deleteUser(userId);

    if (deleteAuthError) {
      console.error("[Admin] Error deleting auth user:", deleteAuthError);
      // This is not critical as the database records are already deleted
      // The auth record will become orphaned but harmless
      console.warn("[Admin] Database records deleted but auth record remains");
    }

    console.log(`[Admin] Account deleted successfully: ${userId}`);

    // Step 3: Refresh materialized views to update directory
    try {
      if (userType === "guides") {
        const { error: refreshError } = await supabase.rpc("refresh_guides_view");
        if (refreshError) {
          console.error("[Admin] Error refreshing guides view:", refreshError);
        } else {
          console.log("[Admin] Guides materialized view refreshed");
        }
      } else {
        // Refresh appropriate view based on user type
        const refreshFunction =
          userType === "agencies" ? "refresh_agencies_view" :
          userType === "dmcs" ? "refresh_dmcs_view" :
          userType === "transport" ? "refresh_transport_view" :
          null;

        if (refreshFunction) {
          const { error: refreshError } = await supabase.rpc(refreshFunction);
          if (refreshError) {
            console.error(`[Admin] Error refreshing ${userType} view:`, refreshError);
          } else {
            console.log(`[Admin] ${userType} materialized view refreshed`);
          }
        }
      }
    } catch (refreshError) {
      console.error("[Admin] Error refreshing materialized view:", refreshError);
      // Don't fail the request if view refresh fails - deletion succeeded
    }

    // TODO: Send email notification to user about account deletion
    // TODO: Archive user data for compliance/legal requirements

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("[Admin] Error deleting account:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
