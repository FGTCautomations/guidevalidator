export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendHoldRequestedEmail } from "@/lib/email/resend";

/**
 * POST /api/holds - Create a new availability hold request
 */
export async function POST(request: NextRequest) {
  try {
    console.log("[Holds API] POST request received");
    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      console.log("[Holds API] Unauthorized - no user");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[Holds API] User authenticated:", user.id);

    // Get user's profile to check role and organization
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !["agency", "dmc", "transport"].includes(profile.role)) {
      console.log("[Holds API] Forbidden - user is not agency/dmc/transport");
      return NextResponse.json(
        { error: "Only agencies, DMCs, and transport companies can request holds" },
        { status: 403 }
      );
    }

    if (!profile.organization_id) {
      console.log("[Holds API] Forbidden - no organization_id");
      return NextResponse.json(
        { error: "User must be associated with an organization" },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { holdeeId, holdeeType, startDate, endDate, requestMessage } = body;

    console.log("[Holds API] Request data:", { holdeeId, holdeeType, startDate, endDate });

    // Validate required fields
    if (!holdeeId || !holdeeType || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields: holdeeId, holdeeType, startDate, endDate" },
        { status: 400 }
      );
    }

    // Validate holdee type
    if (!["guide", "transport"].includes(holdeeType)) {
      return NextResponse.json(
        { error: "Invalid holdeeType. Must be 'guide' or 'transport'" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (end < start) {
      return NextResponse.json({ error: "End date must be after start date" }, { status: 400 });
    }

    // Check if holdee exists
    const { data: holdee, error: holdeeError } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", holdeeId)
      .maybeSingle();

    if (holdeeError || !holdee) {
      console.log("[Holds API] Holdee not found:", holdeeError);
      return NextResponse.json({ error: "Holdee not found" }, { status: 404 });
    }

    // Check for conflicting accepted holds
    const { data: conflicts } = await supabase
      .from("availability_holds")
      .select("id")
      .eq("holdee_id", holdeeId)
      .eq("status", "accepted")
      .lte("start_date", endDate)
      .gte("end_date", startDate);

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json(
        { error: "This date range conflicts with an existing accepted hold" },
        { status: 409 }
      );
    }

    // Create the hold
    const { data: hold, error: createError } = await supabase
      .from("availability_holds")
      .insert({
        holdee_id: holdeeId,
        holdee_type: holdeeType,
        requester_id: profile.organization_id,
        requester_type: profile.role,
        start_date: startDate,
        end_date: endDate,
        request_message: requestMessage || null,
        status: "pending",
      })
      .select()
      .single();

    if (createError) {
      console.error("[Holds API] Error creating hold:", createError);
      return NextResponse.json(
        { error: "Failed to create hold request" },
        { status: 500 }
      );
    }

    console.log("[Holds API] Hold created successfully:", hold.id);

    // Send email notification to holdee
    try {
      // Get requester organization name
      const { data: requesterOrg } = await supabase
        .from("agencies")
        .select("name")
        .eq("id", profile.organization_id)
        .single();

      // Get holdee email
      const { data: holdeeProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", holdeeId)
        .single();

      if (holdeeProfile?.email && requesterOrg) {
        await sendHoldRequestedEmail({
          holdeeEmail: holdeeProfile.email,
          holdeeName: holdeeProfile.full_name || "User",
          requesterName: requesterOrg.name,
          startDate,
          endDate,
          requestMessage,
          expiresAt: hold.expires_at,
          holdId: hold.id,
        });
      }
    } catch (emailError) {
      console.error("[Holds API] Error sending email:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      hold,
      message: "Hold request created successfully",
    });
  } catch (error: any) {
    console.error("[Holds API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * GET /api/holds - Get holds for current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type"); // "received" or "sent"

    // Get user's profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    let query = supabase.from("availability_holds").select(`
      *,
      requester:agencies!availability_holds_requester_id_fkey(id, name),
      holdee:profiles!availability_holds_holdee_id_fkey(id, full_name)
    `);

    if (type === "received") {
      // Holds received by the user (user is the holdee)
      query = query.eq("holdee_id", user.id);
    } else if (type === "sent") {
      // Holds sent by the user's organization (user's org is the requester)
      if (!profile.organization_id) {
        return NextResponse.json({ holds: [] });
      }
      query = query.eq("requester_id", profile.organization_id);
    } else {
      // Return both by default
      query = query.or(`holdee_id.eq.${user.id},requester_id.eq.${profile.organization_id}`);
    }

    const { data: holds, error } = await query.order("created_at", { ascending: false });

    if (error) {
      console.error("[Holds API] Error fetching holds:", error);
      return NextResponse.json({ error: "Failed to fetch holds" }, { status: 500 });
    }

    return NextResponse.json({ holds: holds || [] });
  } catch (error: any) {
    console.error("[Holds API] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
