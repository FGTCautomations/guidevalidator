"use server";

import { redirect } from "next/navigation";

import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { encryptSecret } from "@/lib/security/credential-encryption";
import { sendApplicationReceivedEmail, sendAdminNewApplicationEmail } from "@/lib/email/resend";

export type TransportApplicationState = {
  status: "idle" | "error";
  message?: string;
};

export const TRANSPORT_APPLICATION_INITIAL_STATE: TransportApplicationState = { status: "idle" };

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return String(value)
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/\s+/g, " "));
}

function parseKeyValueList(value: FormDataEntryValue | null) {
  if (!value) return [];
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, detail] = line.split("|").map((part) => part.trim());
      if (title && detail) {
        return { title, detail };
      }
      return { title: line, detail: null };
    });
}

export async function submitTransportApplicationAction(
  _prev: TransportApplicationState,
  formData: FormData
): Promise<TransportApplicationState> {
  const locale = String(formData.get("locale") ?? "en");
  const legalEntityName = String(formData.get("legalEntityName") ?? "").trim();
  const registrationNumber = String(formData.get("registrationNumber") ?? "").trim();
  const registrationCountry = String(formData.get("registrationCountry") ?? "").trim().toUpperCase();
  const companyAddress = String(formData.get("companyAddress") ?? "").trim();
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();

  // New form fields
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const timezone = String(formData.get("timezone") ?? "").trim();
  const availabilityTimezone = String(formData.get("availabilityTimezone") ?? "").trim();
  const workingHoursRaw = String(formData.get("workingHours") ?? "{}");
  const languagesRaw = String(formData.get("languages") ?? "[]");
  const locationDataRaw = String(formData.get("locationData") ?? "{}");

  // Legacy fields (kept for backwards compatibility)
  const loginEmailRaw = email || String(formData.get("loginEmail") ?? contactEmail).trim().toLowerCase();
  const loginPassword = password || String(formData.get("loginPassword") ?? "");
  const loginPasswordConfirm = password || String(formData.get("loginPasswordConfirm") ?? "");

  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const websiteUrl = String(formData.get("websiteUrl") ?? "").trim();
  const logoUrl = String(formData.get("logoUrl") ?? "").trim();
  const shortDescription = String(formData.get("shortDescription") ?? "").trim();
  const fleetDocs = parseKeyValueList(formData.get("fleetDocuments"));
  const insuranceDocs = parseKeyValueList(formData.get("insuranceDocuments"));
  const safetyCertifications = parseList(formData.get("safetyCertifications"));
  const representativeName = String(formData.get("representativeName") ?? "").trim();
  const representativeRole = String(formData.get("representativeRole") ?? "").trim();
  const representativeEmail = String(formData.get("representativeEmail") ?? "").trim();
  const representativePhone = String(formData.get("representativePhone") ?? "").trim();
  const serviceAreas = parseList(formData.get("serviceAreas"));
  const fleetOverview = parseKeyValueList(formData.get("fleetOverview"));
  const serviceTypes = parseList(formData.get("serviceTypes"));
  const safetyFeatures = parseList(formData.get("safetyFeatures"));
  const mediaGallery = parseKeyValueList(formData.get("mediaGallery"));
  const clientReferences = parseKeyValueList(formData.get("clientReferences"));
  const availabilityNotes = String(formData.get("availabilityNotes") ?? "").trim();
  const timeZone = timezone || String(formData.get("timeZone") ?? "").trim();
  const bookingInfo = parseKeyValueList(formData.get("bookingInfo"));
  const pricingSummary = parseKeyValueList(formData.get("pricingSummary"));
  const subscriptionPlan = String(formData.get("subscriptionPlan") ?? "").trim();
  const billingNotes = String(formData.get("billingNotes") ?? "").trim();

  // Parse JSON fields
  let workingHours = null;
  let customLanguages: string[] = [];
  let locationData = null;

  try {
    workingHours = workingHoursRaw ? JSON.parse(workingHoursRaw) : null;
  } catch {
    return { status: "error", message: "Invalid working hours format." };
  }

  try {
    customLanguages = languagesRaw ? JSON.parse(languagesRaw) : [];
  } catch {
    return { status: "error", message: "Invalid languages format." };
  }

  try {
    locationData = locationDataRaw ? JSON.parse(locationDataRaw) : null;
  } catch {
    return { status: "error", message: "Invalid location data format." };
  }

  // Merge custom languages with legacy parsing
  const legacyLanguagesSpoken = parseList(formData.get("languagesSpoken"));
  const languagesSpoken = [...legacyLanguagesSpoken, ...customLanguages];

  if (!legalEntityName) {
    return { status: "error", message: "Legal entity name is required." };
  }

  if (!contactEmail) {
    return { status: "error", message: "Official email is required." };
  }

  if (!loginEmailRaw) {
    return { status: "error", message: "Account email is required." };
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(loginEmailRaw)) {
    return { status: "error", message: "Enter a valid account email address." };
  }

  if (!loginPassword) {
    return { status: "error", message: "Account password is required." };
  }

  if (loginPassword.length < 8) {
    return { status: "error", message: "Password must be at least 8 characters long." };
  }

  if (!timezone) {
    return { status: "error", message: "Primary timezone is required." };
  }

  if (!availabilityTimezone) {
    return { status: "error", message: "Availability timezone is required." };
  }

  const encryptedPassword = encryptSecret(loginPassword);

  const service = getSupabaseServiceClient();

  // Create Supabase auth account with pending approval
  // Use admin.createUser instead of signUp to bypass email confirmation
  // The user account will exist immediately in auth.users
  // Ban the user until admin approves (ban_duration: "876000h" = 100 years)
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email: loginEmailRaw,
    password: loginPassword,
    email_confirm: true, // Auto-confirm email
    ban_duration: "876000h", // Ban for ~100 years (will be unbanned on approval)
    user_metadata: {
      full_name: legalEntityName,
      role: "transport",
      pending_approval: true,
      timezone,
      availability_timezone: availabilityTimezone,
      working_hours: workingHours,
      subscription_plan: subscriptionPlan || null,
    },
  });

  if (authError) {
    console.error("submitTransportApplicationAction.auth", authError);
    return { status: "error", message: authError.message ?? "Unable to create your account." };
  }

  const userId = authData.user?.id;

  if (!userId) {
    console.error("[Transport Application] No user ID returned from auth.createUser");
    return { status: "error", message: "Account creation failed - no user ID returned." };
  }

  console.log("[Transport Application] Auth account created successfully:", userId);

  // NEW CONSOLIDATED APPROACH: Insert into agencies table with type='transport' and pending status
  // Prepare application data to preserve original submission
  const applicationData = {
    user_id: userId,
    locale,
    legal_entity_name: legalEntityName,
    registration_number: registrationNumber || null,
    registration_country: registrationCountry || null,
    company_address: companyAddress || null,
    contact_email: contactEmail,
    contact_phone: contactPhone || null,
    website_url: websiteUrl || null,
    logo_url: logoUrl || null,
    short_description: shortDescription || null,
    fleet_documents: { entries: fleetDocs },
    insurance_documents: { entries: insuranceDocs },
    safety_certifications: safetyCertifications,
    representative_name: representativeName || null,
    representative_position: representativeRole || null,
    representative_contact: {
      email: representativeEmail || null,
      phone: representativePhone || null,
    },
    service_areas: serviceAreas,
    fleet_overview: { entries: fleetOverview },
    service_types: serviceTypes,
    safety_features: safetyFeatures,
    languages_spoken: languagesSpoken,
    media_gallery: { entries: mediaGallery },
    client_references: { entries: clientReferences },
    availability: {
      notes: availabilityNotes || null,
      time_zone: timeZone || null,
      availability_timezone: availabilityTimezone || null,
      working_hours: workingHours || null,
    },
    booking_info: { entries: bookingInfo },
    pricing_summary: { entries: pricingSummary },
    subscription_plan: subscriptionPlan || null,
    billing_details: { notes: billingNotes || null },
    login_email: loginEmailRaw,
    login_password_ciphertext: encryptedPassword.ciphertext,
    login_password_iv: encryptedPassword.iv,
    login_password_tag: encryptedPassword.tag,
    timezone,
    availability_timezone: availabilityTimezone,
    working_hours: workingHours,
    avatar_url: logoUrl || null,
  };

  // Insert into agencies table with type='transport' and pending status
  const { error: transportError } = await service.from("agencies").insert({
    id: userId, // Use userId as agency ID for consistency
    type: "transport",
    name: legalEntityName,
    slug: legalEntityName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    registration_country: registrationCountry || null,
    description: shortDescription || null,
    website_url: websiteUrl || null,
    contact_email: contactEmail,
    contact_phone: contactPhone || null,
    logo_url: logoUrl || null,
    services_offered: serviceTypes,
    languages_supported: languagesSpoken,
    certifications: safetyCertifications,
    timezone,
    availability_timezone: availabilityTimezone,
    working_hours: workingHours,
    availability_notes: availabilityNotes || null,
    location_data: locationData,
    fleet_data: {
      fleet_overview: fleetOverview,
      fleet_documents: fleetDocs,
      insurance_documents: insuranceDocs,
      safety_features: safetyFeatures,
    },
    application_data: applicationData, // Preserve original application
    application_status: "pending",
    application_submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (transportError) {
    console.error("[Transport Application] Insert error:", transportError);

    // Clean up auth account
    try {
      await service.auth.admin.deleteUser(userId);
    } catch (deleteError) {
      console.error("[Transport Application] Failed to delete auth account:", deleteError);
    }

    return {
      status: "error",
      message: transportError.message ?? "Unable to submit your transport application.",
    };
  }

  console.log("[Transport Application] Application saved successfully:", userId);

  // Send email notifications
  try {
    await Promise.all([
      sendApplicationReceivedEmail({
        applicantEmail: contactEmail,
        applicantName: legalEntityName,
        applicationType: "transport",
        applicationId: userId, // Use userId as application ID
        locale,
      }),
      sendAdminNewApplicationEmail({
        applicantEmail: contactEmail,
        applicantName: legalEntityName,
        applicationType: "transport",
        applicationId: userId,
        locale,
      }),
    ]);
  } catch (emailError) {
    console.error("Failed to send application emails", emailError);
    // Don't fail the application if emails fail
  }

  redirect(`/${locale}/auth/sign-up/thanks?role=transport`);
}