import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendVerificationApprovedEmail, sendVerificationRejectedEmail } from "@/lib/email/resend";

type VerificationActionPayload = {
  id: string;
  type: "guide" | "agency" | "dmc" | "transport";
  action: "approve" | "reject";
  notes?: string;
};

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
    const body = (await request.json()) as VerificationActionPayload;
    const { id, type, action, notes } = body;

    if (!id || !type || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    if (!["guide", "agency", "dmc", "transport"].includes(type)) {
      return NextResponse.json({ error: "Invalid application type" }, { status: 400 });
    }

    // Determine table name
    const tableName = `${type}_applications`;

    // Fetch the application
    const { data: application, error: fetchError } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (fetchError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 });
    }

    // Update verification status
    const verificationStatus = action === "approve" ? "approved" : "rejected";
    const { error: updateError } = await supabase
      .from(tableName)
      .update({
        verification_status: verificationStatus,
        verification_notes: notes || null,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq("id", id);

    if (updateError) {
      console.error("Failed to update verification status", updateError);
      return NextResponse.json({ error: "Failed to update verification status" }, { status: 500 });
    }

    // If approved, also update the main status field to approved
    if (action === "approve") {
      await supabase
        .from(tableName)
        .update({ status: "approved" })
        .eq("id", id);
    }

    // Get applicant details for email
    const applicantName =
      type === "guide"
        ? application.full_name
        : application.legal_company_name || application.legal_entity_name;
    const applicantEmail = application.contact_email;
    const locale = application.locale || "en";

    // Send email notification
    if (action === "approve") {
      await sendVerificationApprovedEmail({
        applicantEmail,
        applicantName,
        applicationType: type,
        locale,
        notes: notes || null,
      });
    } else {
      await sendVerificationRejectedEmail({
        applicantEmail,
        applicantName,
        applicationType: type,
        locale,
        reason: notes || null,
      });
    }

    // If approved, update profile verified flags
    if (action === "approve" && application.user_id) {
      // Update profile verified flag
      await supabase
        .from("profiles")
        .update({ verified: true })
        .eq("id", application.user_id);

      // For guides, also update license_verified if license proof exists
      if (type === "guide" && application.license_proof_url) {
        await supabase
          .from("profiles")
          .update({ license_verified: true })
          .eq("id", application.user_id);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Application ${action === "approve" ? "approved" : "rejected"} successfully`,
    });
  } catch (error) {
    console.error("Verification action error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
