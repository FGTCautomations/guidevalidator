import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Check if user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { conversation_id, message_id, reported_user_id, reason, details } = body;

    if (!conversation_id || !reported_user_id || !reason) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify user is a participant in the conversation
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("*")
      .eq("conversation_id", conversation_id)
      .eq("profile_id", user.id)
      .single();

    if (!participant) {
      return NextResponse.json(
        { error: "Not a participant in this conversation" },
        { status: 403 }
      );
    }

    // Create abuse report
    const { data: report, error: reportError } = await supabase
      .from("abuse_reports")
      .insert({
        reporter_id: user.id,
        reported_user_id,
        conversation_id,
        message_id: message_id || null,
        reason,
        details: details || null,
        status: "pending",
      })
      .select()
      .single();

    if (reportError) {
      console.error("Failed to create abuse report:", reportError);
      return NextResponse.json(
        { error: "Failed to create report" },
        { status: 500 }
      );
    }

    // Log to audit logs
    await supabase.from("audit_logs").insert({
      actor_id: user.id,
      action: "abuse_report_created",
      resource_type: "conversation",
      resource_id: conversation_id,
      metadata: {
        report_id: report.id,
        reported_user_id,
        reason,
      },
    });

    // TODO: Send notification to moderation team via email/Slack

    return NextResponse.json({
      success: true,
      report_id: report.id,
      message: "Report submitted successfully. Our team will review it shortly.",
    });
  } catch (error) {
    console.error("Abuse report error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
