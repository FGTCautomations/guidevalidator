export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { ReviewSubmission } from "@/lib/reviews/types";
import { sendReviewSubmittedEmail } from "@/lib/email/resend";

export async function POST(request: NextRequest) {
  try {
    console.log("[API] POST /api/reviews - Request received");

    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[API] No user found - unauthorized");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[API] User authenticated:", user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile) {
      console.log("[API] Profile not found for user:", user.id, profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    console.log("[API] Profile found. Role:", profile.role);

    // Parse request body
    const body = (await request.json()) as ReviewSubmission;
    console.log("[API] Request body parsed:", {
      revieweeId: body.revieweeId,
      revieweeType: body.revieweeType,
      overallRating: body.overallRating,
      hasTitle: !!body.title,
      hasComment: !!body.comment,
    });

    // Validate required fields
    if (!body.revieweeId || !body.revieweeType || !body.overallRating || !body.title || !body.comment) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Validate overall rating
    if (body.overallRating < 1 || body.overallRating > 5) {
      return NextResponse.json({ error: "Overall rating must be between 1 and 5" }, { status: 400 });
    }

    // Validate category ratings if provided
    const categoryRatings = [
      body.serviceRating,
      body.communicationRating,
      body.valueRating,
      body.professionalismRating,
      body.paymentSpeedRating,
      body.trustRating,
      body.clarityRating,
      body.supportRating,
    ].filter((r) => r !== undefined);

    for (const rating of categoryRatings) {
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        return NextResponse.json({ error: "All ratings must be between 1 and 5" }, { status: 400 });
      }
    }

    // Check if user is trying to review themselves
    if (user.id === body.revieweeId) {
      return NextResponse.json({ error: "Cannot review yourself" }, { status: 400 });
    }

    // Validate review direction
    const reviewerType = profile.role;
    const isValidDirection =
      (["agency", "dmc", "transport"].includes(reviewerType) && body.revieweeType === "guide") ||
      (reviewerType === "guide" && ["agency", "dmc", "transport"].includes(body.revieweeType));

    if (!isValidDirection) {
      return NextResponse.json(
        { error: "Invalid review direction. Agencies can only review guides and vice versa." },
        { status: 400 }
      );
    }

    // Check if user has already reviewed this profile
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("reviewer_id", user.id)
      .eq("reviewee_id", body.revieweeId)
      .maybeSingle();

    if (existingReview) {
      return NextResponse.json(
        { error: "You have already submitted a review for this user" },
        { status: 400 }
      );
    }

    // Create review
    console.log("[API] Creating review with data:", {
      reviewer_id: user.id,
      reviewee_id: body.revieweeId,
      reviewer_type: reviewerType,
      reviewee_type: body.revieweeType,
      overall_rating: body.overallRating,
    });

    const { data: review, error: insertError } = await supabase
      .from("reviews")
      .insert({
        reviewer_id: user.id,
        reviewee_id: body.revieweeId,
        reviewer_type: reviewerType,
        reviewee_type: body.revieweeType,
        overall_rating: body.overallRating,
        service_rating: body.serviceRating || null,
        communication_rating: body.communicationRating || null,
        value_rating: body.valueRating || null,
        professionalism_rating: body.professionalismRating || null,
        payment_speed_rating: body.paymentSpeedRating || null,
        trust_rating: body.trustRating || null,
        clarity_rating: body.clarityRating || null,
        support_rating: body.supportRating || null,
        title: body.title.trim(),
        comment: body.comment.trim(),
        job_reference: body.jobReference || null,
        booking_reference: body.bookingReference || null,
        locale: body.locale || "en",
        status: "pending",
      })
      .select()
      .single();

    if (insertError) {
      console.error("[API] Error creating review:", insertError);
      console.error("[API] Error details:", {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
      });
      return NextResponse.json({
        error: "Failed to create review",
        details: insertError.message
      }, { status: 500 });
    }

    console.log("[API] Review created successfully:", review.id);

    // Send email notification to reviewee
    try {
      const { data: reviewerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .maybeSingle();

      const tableName = body.revieweeType === "guide" ? "profiles" : "agencies";
      const { data: revieweeProfile } = await supabase
        .from(tableName)
        .select("full_name, name, contact_email")
        .eq("id", body.revieweeId)
        .maybeSingle();

      if (revieweeProfile && reviewerProfile) {
        const revieweeEmail = (revieweeProfile as any).contact_email || user.email;
        const revieweeName = revieweeProfile.full_name || (revieweeProfile as any).name || "User";
        const reviewerName = reviewerProfile.full_name || "Anonymous";

        await sendReviewSubmittedEmail({
          revieweeEmail,
          revieweeName,
          reviewerName,
          overallRating: body.overallRating,
          locale: body.locale || "en",
        });
      }
    } catch (emailError) {
      console.error("Failed to send review notification email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, reviewId: review.id }, { status: 201 });
  } catch (error) {
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(request.url);

    const revieweeId = searchParams.get("revieweeId");
    const status = searchParams.get("status") || "approved";
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = parseInt(searchParams.get("offset") || "0");

    if (!revieweeId) {
      return NextResponse.json({ error: "revieweeId is required" }, { status: 400 });
    }

    // Fetch reviews
    let query = supabase
      .from("reviews")
      .select(
        `
        *,
        reviewer:reviewer_id(id, full_name, avatar_url),
        reviewee:reviewee_id(id, full_name, avatar_url)
      `
      )
      .eq("reviewee_id", revieweeId)
      .eq("status", status)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: reviews, error } = await query;

    if (error) {
      console.error("Error fetching reviews:", error);
      return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
    }

    // Fetch total count
    const { count } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("reviewee_id", revieweeId)
      .eq("status", status);

    return NextResponse.json({
      reviews,
      total: count || 0,
      limit,
      offset,
    });
  } catch (error) {
    console.error("Review fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
