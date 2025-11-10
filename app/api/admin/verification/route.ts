export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
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
    const serviceClient = getSupabaseServiceClient();

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

    const newStatus = action === "approve" ? "approved" : "rejected";

    // CONSOLIDATED APPROACH: Update status in master tables
    if (type === "guide") {
      // For guides: Update profiles table (since guides uses profile_id)
      const { data: guideData, error: fetchError } = await supabase
        .from("guides")
        .select("*, profiles!inner(id, full_name, application_status)")
        .eq("profile_id", id)
        .maybeSingle();

      if (fetchError || !guideData) {
        return NextResponse.json({ error: "Guide application not found" }, { status: 404 });
      }

      // Update profile status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          application_status: newStatus,
          application_reviewed_at: new Date().toISOString(),
          application_reviewed_by: user.id,
          rejection_reason: action === "reject" ? notes || null : null,
          verified: action === "approve" ? true : false,
          license_verified: action === "approve" && guideData.license_proof_url ? true : false,
        })
        .eq("id", id);

      if (updateError) {
        console.error("Failed to update profile status", updateError);
        return NextResponse.json({ error: "Failed to update application status" }, { status: 500 });
      }

      // Unban the user if approved
      if (action === "approve") {
        try {
          await serviceClient.auth.admin.updateUserById(id, {
            ban_duration: "none",
          });
          console.log(`[Admin Verification] Unbanned user ${id}`);
        } catch (unbanError) {
          console.error("Failed to unban user", unbanError);
          // Don't fail the approval if unban fails
        }
      }

      // Get applicant details from application_data
      const applicationData = guideData.application_data as any;
      const applicantName = guideData.profiles?.full_name || "Guide Applicant";
      const applicantEmail = applicationData?.contact_email || applicationData?.login_email;
      const locale = applicationData?.locale || "en";

      // Send email notification
      if (applicantEmail) {
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
      }
    } else {
      // For agencies/DMCs/transport: Update agencies table
      const { data: agencyData, error: fetchError } = await supabase
        .from("agencies")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (fetchError || !agencyData) {
        return NextResponse.json({ error: "Application not found" }, { status: 404 });
      }

      // Update agency status
      const { error: updateError } = await supabase
        .from("agencies")
        .update({
          application_status: newStatus,
          application_reviewed_at: new Date().toISOString(),
          application_reviewed_by: user.id,
          rejection_reason: action === "reject" ? notes || null : null,
          verified: action === "approve" ? true : false,
        })
        .eq("id", id);

      if (updateError) {
        console.error("Failed to update agency status", updateError);
        return NextResponse.json({ error: "Failed to update application status" }, { status: 500 });
      }

      // Get applicant details from application_data or direct fields
      const applicationData = agencyData.application_data as any;
      const applicantName = agencyData.name;
      const applicantEmail = agencyData.contact_email || applicationData?.contact_email;
      const locale = applicationData?.locale || "en";

      // Send email notification
      if (applicantEmail) {
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
