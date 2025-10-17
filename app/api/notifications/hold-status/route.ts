import { NextRequest, NextResponse } from "next/server";
import {
  sendHoldRequestNotification,
  sendHoldAcceptedNotification,
  sendHoldDeclinedNotification,
} from "@/lib/notifications/hold-notifications";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

/**
 * API Route to handle hold status notifications
 * Called by Supabase webhook or trigger
 */
export async function POST(request: NextRequest) {
  try {
    const { holdId, status, type } = await request.json();

    if (!holdId) {
      return NextResponse.json({ error: "Hold ID required" }, { status: 400 });
    }

    // Fetch hold details with requester and target profiles
    const { data: hold, error } = await supabaseAdmin
      .from("availability_holds")
      .select(`
        id,
        requester_id,
        target_id,
        starts_at,
        ends_at,
        status,
        message,
        job_reference,
        expires_at,
        requester:profiles!availability_holds_requester_id_fkey(
          full_name,
          email
        ),
        target:profiles!availability_holds_target_id_fkey(
          full_name,
          email
        )
      `)
      .eq("id", holdId)
      .single();

    if (error || !hold) {
      console.error("Error fetching hold:", error);
      return NextResponse.json({ error: "Hold not found" }, { status: 404 });
    }

    const requester = Array.isArray(hold.requester) ? hold.requester[0] : hold.requester;
    const target = Array.isArray(hold.target) ? hold.target[0] : hold.target;

    const notificationData = {
      holdId: hold.id,
      requesterId: hold.requester_id,
      requesterName: requester?.full_name || "Unknown",
      requesterEmail: requester?.email,
      targetId: hold.target_id,
      targetName: target?.full_name || "Unknown",
      targetEmail: target?.email,
      startsAt: hold.starts_at,
      endsAt: hold.ends_at,
      message: hold.message,
      jobReference: hold.job_reference,
      expiresAt: hold.expires_at,
    };

    let result;

    // Send appropriate notification based on status/type
    switch (type || status) {
      case "request":
      case "pending":
        result = await sendHoldRequestNotification(notificationData);
        break;
      case "accepted":
        result = await sendHoldAcceptedNotification(notificationData);
        break;
      case "declined":
        result = await sendHoldDeclinedNotification(notificationData);
        break;
      default:
        return NextResponse.json(
          { error: "Invalid notification type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("Error processing hold notification:", error);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
