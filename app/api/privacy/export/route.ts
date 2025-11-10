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

    const { userId } = await request.json();

    // Verify user is requesting their own data
    if (user.id !== userId) {
      return NextResponse.json(
        { error: "You can only export your own data" },
        { status: 403 }
      );
    }

    // Call the export function from the database
    const { data, error } = await supabase.rpc("export_user_data", {
      p_user_id: userId,
    });

    if (error) {
      console.error("Export error:", error);
      return NextResponse.json(
        { error: "Failed to export data" },
        { status: 500 }
      );
    }

    // Log the DSAR request
    await supabase.from("dsar_requests").insert({
      user_id: userId,
      request_type: "export",
      status: "completed",
      requested_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      notes: "Self-service data export",
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Export API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
