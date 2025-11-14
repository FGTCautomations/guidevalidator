"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { sendApplicationApprovedEmail, sendApplicationDeclinedEmail } from "@/lib/email/resend";

type ApplicationType = "guide" | "agency" | "dmc" | "transport";

export async function approveApplicationAction(
  applicationId: string,
  applicationType: ApplicationType
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServiceClient();

    let userId: string;
    let email: string;
    let applicantName: string;
    let locale: string = "en";

    // Fetch application data from the appropriate table
    if (applicationType === "guide") {
      // For guides: check profiles table with application_status=pending
      // Note: We don't check role='guide' here because the role might not be set until approval
      console.log("[approveApplication] Looking for guide profile:", { applicationId, applicationType });

      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("id, full_name, email, locale, role, application_status")
        .eq("id", applicationId)
        .eq("application_status", "pending")
        .single();

      console.log("[approveApplication] Query result:", { profile, fetchError, applicationId });

      if (fetchError || !profile) {
        console.error("[approveApplication] Guide application not found:", { applicationId, fetchError, hasProfile: !!profile });

        // Additional debug: Try finding the profile without status filter
        const { data: anyProfile } = await supabase
          .from("profiles")
          .select("id, full_name, application_status, role")
          .eq("id", applicationId)
          .single();

        console.error("[approveApplication] Profile exists with any status?", anyProfile);

        return { ok: false, error: "Application not found" };
      }

      userId = profile.id;
      email = profile.email;
      applicantName = profile.full_name;
      locale = profile.locale || "en";

      // Update profile to approved status and ensure role is set to 'guide'
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          role: "guide",
          application_status: "approved",
          verified: true,
          license_verified: true,
          application_reviewed_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[approveApplication] Error updating profile:", updateError);
        return { ok: false, error: updateError.message };
      }

      console.log("[approveApplication] Guide profile approved successfully");
    } else {
      // For agencies/DMCs/transport: check agencies table
      // Note: agencies.id IS the user ID (not a separate profile_id column)
      const { data: agency, error: fetchError} = await supabase
        .from("agencies")
        .select("id, name, contact_email")
        .eq("id", applicationId)
        .eq("type", applicationType)
        .eq("application_status", "pending")
        .single();

      if (fetchError || !agency) {
        console.error("[approveApplication] Agency application not found:", fetchError);
        return { ok: false, error: "Application not found" };
      }

      userId = agency.id; // agencies.id IS the user/profile ID
      email = agency.contact_email;
      applicantName = agency.name;

      // Update agency to approved status
      const { error: updateError } = await supabase
        .from("agencies")
        .update({
          application_status: "approved",
          verified: true,
          application_reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) {
        console.error("[approveApplication] Error updating agency:", updateError);
        return { ok: false, error: updateError.message };
      }

      // Also update the profile status
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          application_status: "approved",
          verified: true,
          application_reviewed_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileUpdateError) {
        console.error("[approveApplication] Error updating profile:", profileUpdateError);
        // Continue anyway - agency was approved
      }

      console.log("[approveApplication] Agency approved successfully");
    }

    // Unban the user in auth.users
    console.log("[approveApplication] Unbanning user:", userId);
    const { error: unbanError } = await supabase.auth.admin.updateUserById(userId, {
      ban_duration: "none",
      user_metadata: {
        pending_approval: false,
      },
    });

    if (unbanError) {
      console.error("[approveApplication] Error unbanning user:", unbanError);
      return { ok: false, error: `Failed to activate account: ${unbanError.message}` };
    }

    console.log("[approveApplication] User unbanned successfully");

    // Send approval email
    try {
      const emailResult = await sendApplicationApprovedEmail({
        applicantEmail: email,
        applicantName,
        applicationType,
        applicationId,
        locale,
      });

      if (!emailResult.ok) {
        console.error("Failed to send approval email:", emailResult.error);
        // Continue anyway - email failure shouldn't block approval
      }
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Continue anyway - email failure shouldn't block approval
    }

    return { ok: true };
  } catch (error) {
    console.error("Error approving application:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Full error details:", error);
    return { ok: false, error: errorMessage };
  }
}

export async function declineApplicationAction(
  applicationId: string,
  applicationType: ApplicationType,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServiceClient();

    let userId: string;
    let email: string;
    let applicantName: string;
    let locale: string = "en";

    // Fetch application data from the appropriate table
    if (applicationType === "guide") {
      // For guides: check profiles table with application_status=pending
      // Note: We don't check role='guide' here because the role might not be set until approval
      const { data: profile, error: fetchError } = await supabase
        .from("profiles")
        .select("id, full_name, email, locale, role")
        .eq("id", applicationId)
        .eq("application_status", "pending")
        .single();

      if (fetchError || !profile) {
        console.error("[declineApplication] Guide application not found:", fetchError);
        return { ok: false, error: "Application not found" };
      }

      userId = profile.id;
      email = profile.email;
      applicantName = profile.full_name;
      locale = profile.locale || "en";

      // Update profile to declined status
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          application_status: "declined",
          rejection_reason: reason,
          application_reviewed_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) {
        console.error("[declineApplication] Error updating profile:", updateError);
        return { ok: false, error: updateError.message };
      }

      console.log("[declineApplication] Guide profile declined successfully");
    } else {
      // For agencies/DMCs/transport: check agencies table
      // Note: agencies.id IS the user ID (not a separate profile_id column)
      const { data: agency, error: fetchError } = await supabase
        .from("agencies")
        .select("id, name, contact_email")
        .eq("id", applicationId)
        .eq("type", applicationType)
        .eq("application_status", "pending")
        .single();

      if (fetchError || !agency) {
        console.error("[declineApplication] Agency application not found:", fetchError);
        return { ok: false, error: "Application not found" };
      }

      userId = agency.id; // agencies.id IS the user/profile ID
      email = agency.contact_email;
      applicantName = agency.name;

      // Update agency to declined status
      const { error: updateError } = await supabase
        .from("agencies")
        .update({
          application_status: "declined",
          rejection_reason: reason,
          application_reviewed_at: new Date().toISOString(),
        })
        .eq("id", applicationId);

      if (updateError) {
        console.error("[declineApplication] Error updating agency:", updateError);
        return { ok: false, error: updateError.message };
      }

      // Also update the profile status
      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          application_status: "declined",
          rejection_reason: reason,
          application_reviewed_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (profileUpdateError) {
        console.error("[declineApplication] Error updating profile:", profileUpdateError);
        // Continue anyway - agency was declined
      }

      console.log("[declineApplication] Agency declined successfully");
    }

    // Delete the auth user account
    console.log("[declineApplication] Deleting auth user:", userId);
    const { error: deleteUserError } = await supabase.auth.admin.deleteUser(userId);
    if (deleteUserError) {
      console.error("[declineApplication] Warning: Failed to delete auth user:", deleteUserError);
      // Continue anyway - application was declined
    } else {
      console.log("[declineApplication] Auth user deleted successfully");
    }

    // Send decline email
    try {
      const emailResult = await sendApplicationDeclinedEmail({
        applicantEmail: email,
        applicantName,
        applicationType,
        applicationId,
        locale,
        reason,
      });

      if (!emailResult.ok) {
        console.error("Failed to send decline email:", emailResult.error);
        // Continue anyway - email failure shouldn't block decline
      } else {
        console.log("Decline email sent successfully to:", email);
      }
    } catch (emailError) {
      console.error("Error sending decline email:", emailError);
      // Continue anyway - email failure shouldn't block decline
    }

    return { ok: true };
  } catch (error) {
    console.error("Error declining application:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Full error details:", error);
    return { ok: false, error: errorMessage };
  }
}

