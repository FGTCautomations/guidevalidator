export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, reason } = await request.json();

    // Verify user is deleting their own account
    if (user.id !== userId) {
      return NextResponse.json(
        { error: "You can only delete your own account" },
        { status: 403 }
      );
    }

    // Call the soft delete function from the database
    const { data, error } = await supabase.rpc("soft_delete_account", {
      p_user_id: userId,
      p_reason: reason || null,
    });

    if (error) {
      console.error("Delete error:", error);
      return NextResponse.json(
        { error: "Failed to delete account" },
        { status: 500 }
      );
    }

    // Log the DSAR request
    await supabase.from("dsar_requests").insert({
      user_id: userId,
      request_type: "delete",
      status: "completed",
      requested_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      notes: reason || "Self-service account deletion",
    });

    // Sign out the user
    await supabase.auth.signOut();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
