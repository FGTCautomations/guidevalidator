import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * POST - Create or update a response to a review
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { reviewId } = params;

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const { response } = await request.json();
    if (!response || !response.trim()) {
      return NextResponse.json({ error: "Response text is required" }, { status: 400 });
    }

    // Fetch the review to verify it exists and is approved
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("reviewee_id, status")
      .eq("id", reviewId)
      .maybeSingle();

    if (reviewError || !review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    if (review.status !== "approved") {
      return NextResponse.json(
        { error: "Can only respond to approved reviews" },
        { status: 400 }
      );
    }

    // Check if user is the reviewee
    if (review.reviewee_id !== user.id) {
      return NextResponse.json(
        { error: "Only the reviewee can respond to reviews" },
        { status: 403 }
      );
    }

    // Check if response already exists
    const { data: existingResponse } = await supabase
      .from("review_responses")
      .select("id")
      .eq("review_id", reviewId)
      .maybeSingle();

    if (existingResponse) {
      // Update existing response
      const { error: updateError } = await supabase
        .from("review_responses")
        .update({ response: response.trim() })
        .eq("id", existingResponse.id);

      if (updateError) {
        console.error("Failed to update response:", updateError);
        return NextResponse.json(
          { error: "Failed to update response" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Response updated successfully",
      });
    } else {
      // Create new response
      const { error: insertError } = await supabase
        .from("review_responses")
        .insert({
          review_id: reviewId,
          responder_id: user.id,
          response: response.trim(),
        });

      if (insertError) {
        console.error("Failed to create response:", insertError);
        return NextResponse.json(
          { error: "Failed to create response" },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Response submitted successfully",
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("Review response error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET - Fetch response for a review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { reviewId: string } }
) {
  try {
    const supabase = getSupabaseServerClient();
    const { reviewId } = params;

    const { data: response, error } = await supabase
      .from("review_responses")
      .select("*, responder:responder_id(id, full_name)")
      .eq("review_id", reviewId)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch response:", error);
      return NextResponse.json({ error: "Failed to fetch response" }, { status: 500 });
    }

    if (!response) {
      return NextResponse.json({ response: null });
    }

    const responder = Array.isArray(response.responder)
      ? response.responder[0]
      : response.responder;

    return NextResponse.json({
      response: {
        id: response.id,
        reviewId: response.review_id,
        responderId: response.responder_id,
        responderName: responder?.full_name || "Unknown",
        response: response.response,
        createdAt: response.created_at,
        updatedAt: response.updated_at,
      },
    });
  } catch (error) {
    console.error("Review response fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
