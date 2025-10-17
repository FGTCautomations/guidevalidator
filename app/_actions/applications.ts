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
    const table = `${applicationType}_applications`;

    // Get application details
    const { data: application, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      return { ok: false, error: "Application not found" };
    }

    // Update application status
    const { error: updateError } = await supabase
      .from(table)
      .update({ status: "approved" })
      .eq("id", applicationId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    let userId = application.user_id;
    const email = application.login_email || application.contact_email;

    // Check if auth account was already created during application
    if (userId) {
      console.log("[approveApplication] Auth account already exists for user:", userId);
      console.log("[approveApplication] Activating account by removing pending_approval flag and unbanning");

      // Remove pending_approval flag and unban user to activate account
      const { error: activateError } = await supabase.auth.admin.updateUserById(userId, {
        ban_duration: "none", // Unban the user (they were banned during application)
        user_metadata: {
          full_name: application.full_name || application.legal_company_name || application.legal_entity_name,
          role: applicationType,
          pending_approval: false, // Remove pending flag
          timezone: application.timezone,
          availability_timezone: application.availability_timezone,
          working_hours: application.working_hours,
          subscription_plan: application.subscription_plan,
        },
      });

      if (activateError) {
        console.error("[approveApplication] Error activating account:", activateError);
        return { ok: false, error: `Failed to activate account: ${activateError.message}` };
      }

      console.log("[approveApplication] Account activated and unbanned successfully");
    } else {
      // Legacy flow: create auth account if not already created
      const password = generateTemporaryPassword();

      console.log("[approveApplication] Creating user with email:", email);
      console.log("[approveApplication] User metadata:", {
        full_name: application.full_name || application.legal_company_name || application.legal_entity_name,
        role: applicationType,
      });

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          full_name: application.full_name || application.legal_company_name || application.legal_entity_name,
          role: applicationType,
          pending_approval: false,
          timezone: application.timezone,
          availability_timezone: application.availability_timezone,
          working_hours: application.working_hours,
          subscription_plan: application.subscription_plan,
        },
      });

      if (authError || !authData.user) {
        console.error("[approveApplication] Error creating auth user:", authError);
        console.error("[approveApplication] Auth error details:", {
          message: authError?.message,
          status: authError?.status,
          name: authError?.name,
        });
        const errorMsg = authError?.message || "Failed to create user account";
        return { ok: false, error: `Failed to create user account: ${errorMsg}` };
      }

      console.log("[approveApplication] Auth user created successfully:", authData.user.id);
      userId = authData.user.id;
    }

    // Wait a moment for the trigger to create the profile
    console.log("[approveApplication] Waiting for trigger to create profile...");
    await new Promise(resolve => setTimeout(resolve, 500));

    // Verify profile was created by trigger
    const { data: existingProfile, error: fetchProfileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    console.log("[approveApplication] Profile after trigger:", existingProfile);
    console.log("[approveApplication] Fetch profile error:", fetchProfileError);

    // Update the profile (trigger already created it with default values)
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        role: applicationType,
        locale: application.locale || "en",
        onboarding_completed: false,
        avatar_url: application.avatar_url || null,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("[approveApplication] Error updating profile:", profileError);
      console.error("[approveApplication] Profile error details:", {
        message: profileError?.message,
        code: profileError?.code,
        details: profileError?.details,
      });
      // Cleanup: delete auth user if profile update fails
      await supabase.auth.admin.deleteUser(userId);
      return { ok: false, error: `Failed to update profile: ${profileError.message}` };
    }

    console.log("[approveApplication] Profile updated successfully");

    // Create role-specific records
    try {
      if (applicationType === "guide") {
        await createGuideProfile(supabase, userId, application);
      } else if (applicationType === "agency") {
        await createOrganizationProfile(supabase, userId, application, "agency");
      } else if (applicationType === "dmc") {
        await createOrganizationProfile(supabase, userId, application, "dmc");
      } else if (applicationType === "transport") {
        await createOrganizationProfile(supabase, userId, application, "transport");
      }
    } catch (roleError) {
      console.error("[approveApplication] Error creating role-specific profile:", roleError);
      // Cleanup: delete auth user and profile
      await supabase.auth.admin.deleteUser(userId);
      const errorMsg = roleError instanceof Error ? roleError.message : "Unknown error";
      return { ok: false, error: `Failed to create ${applicationType} profile: ${errorMsg}` };
    }

    // Send approval email with credentials
    const applicantName = application.full_name || application.legal_company_name || application.legal_entity_name;
    try {
      const emailResult = await sendApplicationApprovedEmail({
        applicantEmail: email,
        applicantName,
        applicationType,
        applicationId,
        locale: application.locale,
      });

      if (!emailResult.ok) {
        console.error("Failed to send approval email:", emailResult.error);
        // Continue anyway - email failure shouldn't block approval
      }
    } catch (emailError) {
      console.error("Error sending approval email:", emailError);
      // Continue anyway - email failure shouldn't block approval
    }

    // TODO: Send credentials email separately (for security, should be sent via reset password flow)

    // Delete the application record after successful approval (only keep pending applications)
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("id", applicationId);

    if (deleteError) {
      console.error("[approveApplication] Warning: Failed to delete application record:", deleteError);
      // Don't fail the approval if delete fails - the approval was successful
    } else {
      console.log("[approveApplication] Application record deleted successfully");
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
    const table = `${applicationType}_applications`;

    // Get application details
    const { data: application, error: fetchError } = await supabase
      .from(table)
      .select("*")
      .eq("id", applicationId)
      .single();

    if (fetchError || !application) {
      return { ok: false, error: "Application not found" };
    }

    // Update application status
    const { error: updateError } = await supabase
      .from(table)
      .update({ status: "declined" })
      .eq("id", applicationId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    // Delete auth user if one was created during application
    if (application.user_id) {
      console.log("[declineApplication] Deleting auth user:", application.user_id);
      const { error: deleteUserError } = await supabase.auth.admin.deleteUser(application.user_id);
      if (deleteUserError) {
        console.error("[declineApplication] Warning: Failed to delete auth user:", deleteUserError);
      } else {
        console.log("[declineApplication] Auth user deleted successfully");
      }
    }

    // Send decline email
    const applicantName = application.full_name || application.legal_company_name || application.legal_entity_name;
    try {
      const emailResult = await sendApplicationDeclinedEmail({
        applicantEmail: application.contact_email,
        applicantName,
        applicationType,
        applicationId,
        locale: application.locale,
        reason,
      });

      if (!emailResult.ok) {
        console.error("Failed to send decline email:", emailResult.error);
        // Continue anyway - email failure shouldn't block decline
      } else {
        console.log("Decline email sent successfully to:", application.contact_email);
      }
    } catch (emailError) {
      console.error("Error sending decline email:", emailError);
      // Continue anyway - email failure shouldn't block decline
    }

    // Delete the application record after decline (only keep pending applications)
    const { error: deleteError } = await supabase
      .from(table)
      .delete()
      .eq("id", applicationId);

    if (deleteError) {
      console.error("[declineApplication] Warning: Failed to delete application record:", deleteError);
      // Don't fail the decline if delete fails - the decline was successful
    } else {
      console.log("[declineApplication] Application record deleted successfully");
    }

    return { ok: true };
  } catch (error) {
    console.error("Error declining application:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Full error details:", error);
    return { ok: false, error: errorMessage };
  }
}

// Helper functions

function generateTemporaryPassword(): string {
  // Generate a secure random password (16 characters)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

async function createGuideProfile(supabase: any, userId: string, application: any) {
  console.log("[createGuideProfile] Creating or updating guide record for user:", userId);
  console.log("[createGuideProfile] Application data:", {
    full_name: application.full_name,
    professional_intro: application.professional_intro,
    experience_years: application.experience_years,
    timezone: application.timezone,
    availability_timezone: application.availability_timezone,
    working_hours: application.working_hours,
  });

  // Extract language codes from languages_spoken array
  const spokenLanguages = Array.isArray(application.languages_spoken)
    ? application.languages_spoken.map((lang: any) =>
        typeof lang === 'object' && lang.language ? lang.language : String(lang)
      ).filter(Boolean)
    : [];

  // Extract specializations array
  const specialties = Array.isArray(application.specializations)
    ? application.specializations.filter(Boolean)
    : [];

  // Extract expertise areas array
  const expertiseAreas = Array.isArray(application.expertise_areas)
    ? application.expertise_areas.filter(Boolean)
    : [];

  const payload = {
    profile_id: userId,
    business_name: application.full_name ?? null,
    bio: application.professional_intro ?? null,
    years_experience: application.experience_years ?? null,
    hourly_rate_cents: null,
    currency: "USD",
    response_time_minutes: null,
    avatar_url: application.avatar_url ?? null,
    timezone: application.timezone ?? null,
    availability_timezone: application.availability_timezone ?? null,
    working_hours: application.working_hours ?? null,
    spoken_languages: spokenLanguages,
    specialties: specialties,
    expertise_areas: expertiseAreas,
    license_number: application.license_number ?? null,
    license_authority: application.license_authority ?? null,
    license_proof_url: application.license_proof_url ?? null,
    id_document_url: application.id_document_url ?? null,
    experience_summary: application.experience_summary ?? null,
    sample_itineraries: application.sample_itineraries ?? null,
    media_gallery: application.media_gallery ?? null,
    availability_notes: application.availability_notes ?? null,
  };

  const { data: existing, error: fetchError } = await supabase
    .from("guides")
    .select("profile_id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (fetchError) {
    console.error("[createGuideProfile] Error checking existing guide record:", fetchError);
    throw fetchError;
  }

  if (existing) {
    console.log("[createGuideProfile] Guide record already exists. Updating profile:", existing);
    const { error: updateError } = await supabase
      .from("guides")
      .update({
        business_name: payload.business_name,
        bio: payload.bio,
        years_experience: payload.years_experience,
        hourly_rate_cents: payload.hourly_rate_cents,
        currency: payload.currency,
        response_time_minutes: payload.response_time_minutes,
        avatar_url: payload.avatar_url,
        timezone: payload.timezone,
        availability_timezone: payload.availability_timezone,
        working_hours: payload.working_hours,
        spoken_languages: payload.spoken_languages,
        specialties: payload.specialties,
        expertise_areas: payload.expertise_areas,
        license_number: payload.license_number,
        license_authority: payload.license_authority,
        license_proof_url: payload.license_proof_url,
        id_document_url: payload.id_document_url,
        experience_summary: payload.experience_summary,
        sample_itineraries: payload.sample_itineraries,
        media_gallery: payload.media_gallery,
        availability_notes: payload.availability_notes,
      })
      .eq("profile_id", userId);

    if (updateError) {
      console.error("[createGuideProfile] Error updating guide record:", updateError);
      throw updateError;
    }

    console.log("[createGuideProfile] Guide record updated successfully for", userId);
    return;
  }

  const { error: insertError } = await supabase.from("guides").insert(payload);

  if (insertError) {
    console.error("[createGuideProfile] Error inserting guide record:", insertError);
    throw insertError;
  }

  console.log("[createGuideProfile] Guide record created successfully for", userId);

  if (application.specializations && application.specializations.length > 0) {
    // Store in guide record or separate table as needed
  }
}

async function createOrganizationProfile(supabase: any, userId: string, application: any, type: string) {
  console.log("[createOrganizationProfile] Creating organization for user:", userId);
  console.log("[createOrganizationProfile] Type:", type);
  console.log("[createOrganizationProfile] Application data:", {
    legal_company_name: application.legal_company_name,
    legal_entity_name: application.legal_entity_name,
    company_description: application.company_description,
  });

  // Extract languages and specialties from application
  const languages = Array.isArray(application.languages)
    ? application.languages.filter(Boolean)
    : Array.isArray(application.languages_spoken)
    ? application.languages_spoken.map((lang: any) =>
        typeof lang === 'object' && lang.language ? lang.language : String(lang)
      ).filter(Boolean)
    : [];

  const specialties = Array.isArray(application.specializations)
    ? application.specializations.filter(Boolean)
    : Array.isArray(application.specialties)
    ? application.specialties.filter(Boolean)
    : [];

  // Create agency (agencies table is used for all organizations: agency, dmc, transport)
  const { data: agency, error: agencyError } = await supabase
    .from("agencies")
    .insert({
      type: type, // Column is 'type', not 'agency_type'
      name: application.legal_company_name || application.legal_entity_name,
      description: application.company_description || application.company_overview || application.short_description,
      coverage_summary: application.coverage_summary || application.service_areas,
      website: application.website_url || application.website,
      registration_number: application.registration_number || application.business_registration_number,
      vat_id: application.vat_id || application.tax_id,
      country_code: application.country_code || application.country,
      languages: languages.length > 0 ? languages : null,
      specialties: specialties.length > 0 ? specialties : null,
      verified: true, // Set to true since admin is approving
    })
    .select()
    .single();

  if (agencyError || !agency) {
    console.error("[createOrganizationProfile] Error creating agency:", agencyError);
    console.error("[createOrganizationProfile] Error details:", {
      message: agencyError?.message,
      code: agencyError?.code,
      details: agencyError?.details,
    });
    throw agencyError;
  }

  console.log("[createOrganizationProfile] Agency created:", agency.id);

  // Link profile to agency
  const { error: linkError } = await supabase
    .from("profiles")
    .update({ organization_id: agency.id })
    .eq("id", userId);

  if (linkError) {
    console.error("[createOrganizationProfile] Error linking profile to agency:", linkError);
    throw linkError;
  }

  console.log("[createOrganizationProfile] Profile linked to agency");

  // Create agency member record
  const { error: memberError } = await supabase
    .from("agency_members")
    .insert({
      agency_id: agency.id,
      profile_id: userId,
      role: "owner",
    });

  if (memberError) {
    console.error("[createOrganizationProfile] Error creating agency member:", memberError);
    throw memberError;
  }

  console.log("[createOrganizationProfile] Agency member created successfully");
}
