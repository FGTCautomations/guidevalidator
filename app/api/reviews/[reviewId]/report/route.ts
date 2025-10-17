import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { reviewId } = params;
    const { reason } = await request.json();

    if (!reason || !reason.trim()) {
      return NextResponse.json({ error: "Report reason is required" }, { status: 400 });
    }

    // Check if review exists
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("id, status")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.status === "reported") {
      return NextResponse.json({ error: "Review has already been reported" }, { status: 400 });
    }

    // Update review status to reported
    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        status: "reported",
        reported_at: new Date().toISOString(),
        reported_by: user.id,
        report_reason: reason.trim(),
      })
      .eq("id", reviewId);

    if (updateError) {
      console.error("Error reporting review:", updateError);
      return NextResponse.json({ error: "Failed to report review" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Report review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
