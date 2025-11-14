"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { sendApplicationApprovedEmail, sendApplicationDeclinedEmail } from "@/lib/email/resend";

type ApplicationType = "guide" | "agency" | "dmc" | "transport";

interface ApplicationData {
  userId: string;
  email: string;
  name: string;
  locale: string;
}

/**
 * Workflow Step 1: Fetch application data
 */
async function fetchApplicationData(
  applicationId: string,
  applicationType: ApplicationType
): Promise<{ data: ApplicationData | null; error?: string }> {
  const supabase = getSupabaseServiceClient();

  if (applicationType === "guide") {
    // For guides: applicationId is the profile_id
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, locale")
      .eq("id", applicationId)
      .eq("application_status", "pending")
      .single();

    if (error || !profile) {
      console.error("[fetchApplicationData] Guide not found:", { applicationId, error });
      return { data: null, error: "Application not found" };
    }

    return {
      data: {
        userId: profile.id,
        email: profile.email,
        name: profile.full_name,
        locale: profile.locale || "en",
      },
    };
  } else {
    // For agencies: applicationId is the agency.id (which IS the user ID)
    const { data: agency, error } = await supabase
      .from("agencies")
      .select("id, name, contact_email")
      .eq("id", applicationId)
      .eq("type", applicationType)
      .eq("application_status", "pending")
      .single();

    if (error || !agency) {
      console.error("[fetchApplicationData] Agency not found:", { applicationId, error });
      return { data: null, error: "Application not found" };
    }

    return {
      data: {
        userId: agency.id,
        email: agency.contact_email,
        name: agency.name,
        locale: "en", // Agencies don't have locale stored
      },
    };
  }
}

/**
 * Workflow Step 2: Update application status to approved
 */
async function approveApplication(
  applicationId: string,
  applicationType: ApplicationType
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServiceClient();

  if (applicationType === "guide") {
    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        role: "guide",
        application_status: "approved",
        verified: true,
        license_verified: true,
        application_reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      console.error("[approveApplication] Profile update failed:", error);
      return { success: false, error: error.message };
    }

    // Refresh guides materialized view
    try {
      await supabase.rpc("refresh_guides_view");
    } catch (err) {
      console.warn("[approveApplication] Failed to refresh guides view (non-blocking):", err);
    }

    return { success: true };
  } else {
    // First, get the agency to read registration_country
    const { data: agencyData, error: fetchError } = await supabase
      .from("agencies")
      .select("registration_country")
      .eq("id", applicationId)
      .single();

    if (fetchError) {
      console.error("[approveApplication] Failed to fetch agency:", fetchError);
    }

    // Update agency - ensure country_code is set from registration_country
    const updateData: Record<string, any> = {
      application_status: "approved",
      verified: true,
      application_reviewed_at: new Date().toISOString(),
    };

    // Copy registration_country to country_code if available
    if (agencyData?.registration_country) {
      updateData.country_code = agencyData.registration_country;
    }

    const { error: agencyError } = await supabase
      .from("agencies")
      .update(updateData)
      .eq("id", applicationId);

    if (agencyError) {
      console.error("[approveApplication] Agency update failed:", agencyError);
      return { success: false, error: agencyError.message };
    }

    // Also update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        application_status: "approved",
        verified: true,
        application_reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (profileError) {
      console.error("[approveApplication] Profile update failed:", profileError);
      // Continue anyway - agency was approved
    }

    // Refresh the appropriate materialized view based on type
    const viewRefreshMap: Record<string, string> = {
      agency: "refresh_agencies_view",
      dmc: "refresh_dmcs_view",
      transport: "refresh_transport_view",
    };

    const refreshFunction = viewRefreshMap[applicationType];
    if (refreshFunction) {
      try {
        await supabase.rpc(refreshFunction);
      } catch (err) {
        console.warn(`[approveApplication] Failed to refresh ${applicationType} view (non-blocking):`, err);
      }
    }

    return { success: true };
  }
}

/**
 * Workflow Step 3: Update application status to declined
 */
async function declineApplication(
  applicationId: string,
  applicationType: ApplicationType,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServiceClient();

  if (applicationType === "guide") {
    // Update profile
    const { error } = await supabase
      .from("profiles")
      .update({
        application_status: "declined",
        rejection_reason: reason,
        application_reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (error) {
      console.error("[declineApplication] Profile update failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } else {
    // Update agency
    const { error: agencyError } = await supabase
      .from("agencies")
      .update({
        application_status: "declined",
        rejection_reason: reason,
        application_reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (agencyError) {
      console.error("[declineApplication] Agency update failed:", agencyError);
      return { success: false, error: agencyError.message };
    }

    // Also update profile
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        application_status: "declined",
        rejection_reason: reason,
        application_reviewed_at: new Date().toISOString(),
      })
      .eq("id", applicationId);

    if (profileError) {
      console.error("[declineApplication] Profile update failed:", profileError);
      // Continue anyway - agency was declined
    }

    return { success: true };
  }
}

/**
 * Workflow Step 4: Unban user account
 */
async function unbanUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.auth.admin.updateUserById(userId, {
    ban_duration: "none",
    user_metadata: {
      pending_approval: false,
    },
  });

  if (error) {
    console.error("[unbanUserAccount] Failed:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Workflow Step 5: Delete user account
 */
async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.auth.admin.deleteUser(userId);

  if (error) {
    console.error("[deleteUserAccount] Failed:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

/**
 * Main approval workflow
 */
export async function approveApplicationAction(
  applicationId: string,
  applicationType: ApplicationType
): Promise<{ ok: boolean; error?: string }> {
  try {
    console.log("[APPROVE WORKFLOW] Starting:", { applicationId, applicationType });

    // Step 1: Fetch application data
    const { data: appData, error: fetchError } = await fetchApplicationData(applicationId, applicationType);
    if (!appData || fetchError) {
      return { ok: false, error: fetchError || "Application not found" };
    }
    console.log("[APPROVE WORKFLOW] Application found:", appData);

    // Step 2: Update application status
    const { success: updateSuccess, error: updateError } = await approveApplication(applicationId, applicationType);
    if (!updateSuccess) {
      return { ok: false, error: updateError || "Failed to update application" };
    }
    console.log("[APPROVE WORKFLOW] Application approved in database");

    // Step 3: Unban user account
    const { success: unbanSuccess, error: unbanError } = await unbanUserAccount(appData.userId);
    if (!unbanSuccess) {
      return { ok: false, error: `Failed to activate account: ${unbanError}` };
    }
    console.log("[APPROVE WORKFLOW] User account unbanned");

    // Step 4: Send approval email
    try {
      await sendApplicationApprovedEmail({
        applicantEmail: appData.email,
        applicantName: appData.name,
        applicationType,
        applicationId,
        locale: appData.locale,
      });
      console.log("[APPROVE WORKFLOW] Approval email sent");
    } catch (emailError) {
      console.error("[APPROVE WORKFLOW] Email failed (non-blocking):", emailError);
      // Don't fail the approval if email fails
    }

    console.log("[APPROVE WORKFLOW] Complete!");
    return { ok: true };
  } catch (error) {
    console.error("[APPROVE WORKFLOW] Unexpected error:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Main decline workflow
 */
export async function declineApplicationAction(
  applicationId: string,
  applicationType: ApplicationType,
  reason?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    console.log("[DECLINE WORKFLOW] Starting:", { applicationId, applicationType, reason });

    // Step 1: Fetch application data
    const { data: appData, error: fetchError } = await fetchApplicationData(applicationId, applicationType);
    if (!appData || fetchError) {
      return { ok: false, error: fetchError || "Application not found" };
    }
    console.log("[DECLINE WORKFLOW] Application found:", appData);

    // Step 2: Update application status
    const { success: updateSuccess, error: updateError } = await declineApplication(
      applicationId,
      applicationType,
      reason
    );
    if (!updateSuccess) {
      return { ok: false, error: updateError || "Failed to update application" };
    }
    console.log("[DECLINE WORKFLOW] Application declined in database");

    // Step 3: Delete user account
    const { success: deleteSuccess, error: deleteError } = await deleteUserAccount(appData.userId);
    if (!deleteSuccess) {
      console.warn("[DECLINE WORKFLOW] Account deletion failed (non-blocking):", deleteError);
      // Continue anyway - application was declined
    } else {
      console.log("[DECLINE WORKFLOW] User account deleted");
    }

    // Step 4: Send decline email
    try {
      await sendApplicationDeclinedEmail({
        applicantEmail: appData.email,
        applicantName: appData.name,
        applicationType,
        applicationId,
        locale: appData.locale,
        reason,
      });
      console.log("[DECLINE WORKFLOW] Decline email sent");
    } catch (emailError) {
      console.error("[DECLINE WORKFLOW] Email failed (non-blocking):", emailError);
      // Don't fail the decline if email fails
    }

    console.log("[DECLINE WORKFLOW] Complete!");
    return { ok: true };
  } catch (error) {
    console.error("[DECLINE WORKFLOW] Unexpected error:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
