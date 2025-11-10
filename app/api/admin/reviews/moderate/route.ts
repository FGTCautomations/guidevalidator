export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendReviewApprovedEmail, sendReviewRejectedEmail } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    console.log("[Moderate API] Request received");
    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Moderate API] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Moderate API] User authenticated:", user.id);

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse request body
    const { reviewId, action, notes } = await request.json();

    if (!reviewId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    // Fetch the review
    console.log("[Moderate API] Fetching review:", reviewId);
    const { data: review, error: fetchError } = await supabase
      .from("reviews")
      .select("*")
      .eq("id", reviewId)
      .single();

    if (fetchError || !review) {
      console.log("[Moderate API] Review not found:", fetchError);
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    console.log("[Moderate API] Review found, updating status to:", action);
    // Update review status
    const newStatus = action === "approve" ? "approved" : "rejected";
    const { error: updateError } = await supabase
      .from("reviews")
      .update({
        status: newStatus,
        moderation_notes: notes || null,
        moderated_at: new Date().toISOString(),
        moderated_by: user.id,
      })
      .eq("id", reviewId);

    if (updateError) {
      console.error("[Moderate API] Failed to update review status:", updateError);
      return NextResponse.json({ error: "Failed to update review status" }, { status: 500 });
    }

    console.log("[Moderate API] Review status updated successfully");

    // Send email notifications
    try {
      console.log("[Moderate API] Fetching profiles for email notification");
      // Fetch reviewer and reviewee profiles
      const { data: reviewerProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", review.reviewer_id)
        .maybeSingle();

      console.log("[Moderate API] Reviewer profile:", reviewerProfile);

      // Fetch reviewee profile based on type
      let revieweeProfile: any = null;
      if (review.reviewee_type === "guide") {
        console.log("[Moderate API] Fetching guide reviewee from profiles");
        const { data } = await supabase
          .from("profiles")
          .select("full_name, email")
          .eq("id", review.reviewee_id)
          .maybeSingle();
        revieweeProfile = data;
      } else {
        console.log("[Moderate API] Fetching agency reviewee from agencies");
        const { data } = await supabase
          .from("agencies")
          .select("name, contact_email")
          .eq("id", review.reviewee_id)
          .maybeSingle();
        revieweeProfile = data;
      }

      console.log("[Moderate API] Reviewee profile:", revieweeProfile);

      if (reviewerProfile && revieweeProfile) {
        const revieweeName = revieweeProfile.full_name || revieweeProfile.name || "User";
        const reviewerName = reviewerProfile.full_name || "Anonymous";
        const revieweeEmail = revieweeProfile.contact_email || revieweeProfile.email;
        const reviewerEmail = reviewerProfile.email;

        if (action === "approve") {
          await sendReviewApprovedEmail({
            revieweeEmail,
            revieweeName,
            reviewerName,
            overallRating: review.overall_rating,
            title: review.title,
            locale: review.locale || "en",
          });
        } else {
          await sendReviewRejectedEmail({
            reviewerEmail,
            reviewerName,
            revieweeName,
            reason: notes,
            locale: review.locale || "en",
          });
        }
      }
    } catch (emailError) {
      console.error("Failed to send moderation notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: `Review ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Review moderation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
