import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendHoldAcceptedEmail, sendHoldDeclinedEmail } from "@/lib/email/resend";

/**
 * POST /api/holds/[id]/respond - Respond to a hold request (accept/decline)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[Hold Response API] Request received for hold:", params.id);
    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { action, responseMessage } = body;

    console.log("[Hold Response API] Action:", action);

    // Validate action
    if (!["accepted", "declined"].includes(action)) {
      return NextResponse.json(
        { error: "Invalid action. Must be 'accepted' or 'declined'" },
        { status: 400 }
      );
    }

    // Fetch the hold
    const { data: hold, error: fetchError } = await supabase
      .from("availability_holds")
      .select("*")
      .eq("id", params.id)
      .single();

    if (fetchError || !hold) {
      console.log("[Hold Response API] Hold not found:", fetchError);
      return NextResponse.json({ error: "Hold not found" }, { status: 404 });
    }

    // Verify user is the holdee
    if (hold.holdee_id !== user.id) {
      console.log("[Hold Response API] User is not the holdee");
      return NextResponse.json(
        { error: "You are not authorized to respond to this hold" },
        { status: 403 }
      );
    }

    // Check if hold is still pending
    if (hold.status !== "pending") {
      return NextResponse.json(
        { error: `Hold has already been ${hold.status}` },
        { status: 400 }
      );
    }

    // Check if hold has expired
    if (new Date(hold.expires_at) < new Date()) {
      // Auto-expire the hold
      await supabase
        .from("availability_holds")
        .update({ status: "expired", updated_at: new Date().toISOString() })
        .eq("id", params.id);

      return NextResponse.json(
        { error: "This hold has expired" },
        { status: 400 }
      );
    }

    // If accepting, check for conflicts again
    if (action === "accepted") {
      const { data: conflicts } = await supabase
        .from("availability_holds")
        .select("id")
        .eq("holdee_id", user.id)
        .eq("status", "accepted")
        .neq("id", params.id)
        .lte("start_date", hold.end_date)
        .gte("end_date", hold.start_date);

      if (conflicts && conflicts.length > 0) {
        return NextResponse.json(
          { error: "Cannot accept: conflicts with another accepted hold" },
          { status: 409 }
        );
      }
    }

    // Update the hold
    const { data: updatedHold, error: updateError } = await supabase
      .from("availability_holds")
      .update({
        status: action,
        response_message: responseMessage || null,
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.id)
      .select()
      .single();

    if (updateError) {
      console.error("[Hold Response API] Error updating hold:", updateError);
      return NextResponse.json(
        { error: "Failed to update hold" },
        { status: 500 }
      );
    }

    console.log("[Hold Response API] Hold updated successfully");

    // Send email notification to requester
    try {
      // Get requester contact info
      const { data: requesterOrg } = await supabase
        .from("agencies")
        .select("name, contact_email")
        .eq("id", hold.requester_id)
        .single();

      // Get holdee name
      const { data: holdeeProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      if (requesterOrg?.contact_email && holdeeProfile) {
        const emailPayload = {
          requesterEmail: requesterOrg.contact_email,
          requesterName: requesterOrg.name,
          holdeeName: holdeeProfile.full_name || "User",
          startDate: hold.start_date,
          endDate: hold.end_date,
          responseMessage,
        };

        if (action === "accepted") {
          await sendHoldAcceptedEmail(emailPayload);
        } else {
          await sendHoldDeclinedEmail(emailPayload);
        }
      }
    } catch (emailError) {
      console.error("[Hold Response API] Error sending email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      hold: updatedHold,
      message: `Hold ${action} successfully`,
    });
  } catch (error: any) {
    console.error("[Hold Response API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
