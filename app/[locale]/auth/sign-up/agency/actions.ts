"use server";

import { redirect } from "next/navigation";

import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { encryptSecret } from "@/lib/security/credential-encryption";
import type { AgencyApplicationState } from "@/lib/forms/agency-application-state";
import { uploadImageFile, type UploadImageResult } from "../_utils/upload-image";
import { sendApplicationReceivedEmail, sendAdminNewApplicationEmail } from "@/lib/email/resend";

type ParsedSocialLink = {
  label: string;
  url: string;
};

type ParsedContactMethod = {
  channel: string;
  value: string;
};

const COMPLIANCE_BUCKET = "compliance-docs";

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return String(value)
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => item.replace(/\s+/g, " "));
}

function parseJsonList(value: FormDataEntryValue | null): string[] {
  return parseList(value);
}

function parseSocialLinks(value: FormDataEntryValue | null): ParsedSocialLink[] {
  if (!value) return [];
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.split("|").map((part) => part.trim());
      if (label && url) {
        return { label, url };
      }
      if (url) {
        return { label: url, url };
      }
      return null;
    })
    .filter((item): item is ParsedSocialLink => item !== null);
}

function parseContactMethods(value: FormDataEntryValue | null): ParsedContactMethod[] {
  if (!value) return [];
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [channel, contactValue] = line.split("|").map((part) => part.trim());
      if (channel && contactValue) {
        return { channel, value: contactValue };
      }
      return { channel: "other", value: line };
    });
}

function getMultiSelectValues(formData: FormData, key: string): string[] {
  const selected = formData
    .getAll(key)
    .map((value) => String(value).trim())
    .filter(Boolean);
  if (selected.length) {
    return Array.from(new Set(selected));
  }
  return parseJsonList(formData.get(key));
}

function getFile(formData: FormData, key: string): File | null {
  const value = formData.get(key);
  if (typeof File !== "undefined" && value instanceof File && value.size > 0) {
    return value;
  }
  return null;
}

function combinePrivateReference(bucket: string, upload: UploadImageResult | null, fallback: string) {
  if (upload) {
    return `storage://${bucket}/${upload.path}`;
  }
  return fallback || null;
}

export async function submitAgencyApplicationAction(
  _prev: AgencyApplicationState,
  formData: FormData
): Promise<AgencyApplicationState> {
  const locale = String(formData.get("locale") ?? "en");
  const legalCompanyName = String(formData.get("legalCompanyName") ?? "").trim();
  const registrationNumber = String(formData.get("registrationNumber") ?? "").trim();
  const registrationCountry = String(formData.get("registrationCountry") ?? "").trim().toUpperCase();
  const businessAddress = String(formData.get("businessAddress") ?? "").trim();
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
  const proofOfActivityUrl = String(formData.get("proofOfActivityUrl") ?? "").trim();
  const taxId = String(formData.get("taxId") ?? "").trim();
  const licenseLegacyUrl = String(formData.get("licenseUrl") ?? "").trim();
  const representativeName = String(formData.get("representativeName") ?? "").trim();
  const representativeRole = String(formData.get("representativeRole") ?? "").trim();
  const representativeEmail = String(formData.get("representativeEmail") ?? "").trim();
  const representativePhone = String(formData.get("representativePhone") ?? "").trim();
  const representativeLegacyId = String(formData.get("representativeIdDocumentUrl") ?? "").trim();
  const subscriptionPlan = String(formData.get("subscriptionPlan") ?? "").trim();
  const billingNotes = String(formData.get("billingNotes") ?? "").trim();
  const companyDescription = String(formData.get("companyDescription") ?? "").trim();
  const availabilityNotes = String(formData.get("availabilityNotes") ?? "").trim();
  const timeZone = timezone || String(formData.get("timeZone") ?? "").trim();

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

  if (!legalCompanyName) {
    return { status: "error", message: "Legal company name is required." };
  }

  if (!contactEmail) {
    return { status: "error", message: "Contact email is required." };
  }

  if (!loginEmailRaw) {
    return { status: "error", message: "Account email is required." };
  }

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(loginEmailRaw)) {
    return { status: "error", message: "Enter a valid account email address." };
  }

  if (!loginPassword || !loginPasswordConfirm) {
    return { status: "error", message: "Create and confirm your account password." };
  }

  if (loginPassword !== loginPasswordConfirm) {
    return { status: "error", message: "Account passwords do not match." };
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

  // Merge custom languages with legacy parsing
  const legacyLanguagesSpoken = getMultiSelectValues(formData, "languagesSpoken");
  const languagesSpoken = [...legacyLanguagesSpoken, ...customLanguages];

  const socialLinks = parseSocialLinks(formData.get("socialLinks"));
  const servicesOffered = getMultiSelectValues(formData, "servicesOffered");
  const nicheFocus = getMultiSelectValues(formData, "nicheFocus");
  const destinationCoverage = getMultiSelectValues(formData, "destinationCoverage");
  const certifications = getMultiSelectValues(formData, "certifications");
  const portfolioLinks = getMultiSelectValues(formData, "portfolioLinks");
  const testimonials = getMultiSelectValues(formData, "testimonials");
  const contactMethods = parseContactMethods(formData.get("contactMethods"));

  const licenseFile = getFile(formData, "licenseProof");
  const representativeIdFile = getFile(formData, "representativeIdDocument");

  let licenseUpload: UploadImageResult | null = null;
  let representativeIdUpload: UploadImageResult | null = null;

  try {
    [licenseUpload, representativeIdUpload] = await Promise.all([
      uploadImageFile(licenseFile, {
        bucket: COMPLIANCE_BUCKET,
        folder: "agency-applications/licenses",
      }),
      uploadImageFile(representativeIdFile, {
        bucket: COMPLIANCE_BUCKET,
        folder: "agency-applications/identity",
      }),
    ]);
  } catch (error) {
    console.error("submitAgencyApplicationAction.upload", error);
    const message = error instanceof Error ? error.message : "Unable to process uploaded images.";
    return { status: "error", message };
  }

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
      full_name: legalCompanyName,
      role: "agency",
      pending_approval: true,
      timezone,
      availability_timezone: availabilityTimezone,
      working_hours: workingHours,
    location_data: locationData,
      subscription_plan: subscriptionPlan || null,
    },
  });

  if (authError) {
    console.error("submitAgencyApplicationAction.auth", authError);
    return { status: "error", message: authError.message ?? "Unable to create your account." };
  }

  const userId = authData.user?.id;

  if (!userId) {
    console.error("[Agency Application] No user ID returned from auth.createUser");
    return { status: "error", message: "Account creation failed - no user ID returned." };
  }

  console.log("[Agency Application] Auth account created successfully:", userId);

  // NEW CONSOLIDATED APPROACH: Insert into agencies table with pending status
  // Prepare application data to preserve original submission
  const applicationData = {
    user_id: userId,
    locale,
    legal_company_name: legalCompanyName,
    registration_number: registrationNumber || null,
    registration_country: registrationCountry || null,
    business_address: businessAddress || null,
    contact_email: contactEmail,
    contact_phone: contactPhone || null,
    website_url: websiteUrl || null,
    logo_url: logoUrl || null,
    social_links: socialLinks,
    tax_id: taxId || null,
    proof_of_license_url: combinePrivateReference(COMPLIANCE_BUCKET, licenseUpload, licenseLegacyUrl),
    proof_of_activity_url: proofOfActivityUrl || null,
    representative_name: representativeName || null,
    representative_position: representativeRole || null,
    representative_contact: {
      email: representativeEmail || null,
      phone: representativePhone || null,
    },
    representative_id_document_url: combinePrivateReference(COMPLIANCE_BUCKET, representativeIdUpload, representativeLegacyId),
    subscription_plan: subscriptionPlan || null,
    billing_details: {
      notes: billingNotes || null,
    },
    company_description: companyDescription || null,
    services_offered: servicesOffered,
    niche_focus: nicheFocus,
    destination_coverage: destinationCoverage,
    languages_spoken: languagesSpoken,
    certifications,
    portfolio: { links: portfolioLinks },
    testimonials: { entries: testimonials },
    availability: {
      notes: availabilityNotes || null,
      time_zone: timeZone || null,
      availability_timezone: availabilityTimezone || null,
      working_hours: workingHours || null,
    },
    contact_methods: contactMethods,
    login_email: loginEmailRaw,
    login_password_ciphertext: encryptedPassword.ciphertext,
    login_password_iv: encryptedPassword.iv,
    login_password_tag: encryptedPassword.tag,
    timezone,
    availability_timezone: availabilityTimezone,
    working_hours: workingHours,
    avatar_url: logoUrl || null,
  };

  // Insert into agencies table with pending status
  const { error: agencyError } = await service.from("agencies").insert({
    id: userId, // Use userId as agency ID for consistency
    type: "agency",
    name: legalCompanyName,
    slug: legalCompanyName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    registration_country: registrationCountry || null,
    description: companyDescription || null,
    website_url: websiteUrl || null,
    contact_email: contactEmail,
    contact_phone: contactPhone || null,
    logo_url: logoUrl || null,
    services_offered: servicesOffered,
    languages_supported: languagesSpoken,
    certifications,
    timezone,
    availability_timezone: availabilityTimezone,
    working_hours: workingHours,
    availability_notes: availabilityNotes || null,
    location_data: locationData,
    application_data: applicationData, // Preserve original application
    application_status: "pending",
    application_submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (agencyError) {
    console.error("[Agency Application] Insert error:", agencyError);

    // Clean up auth account
    try {
      await service.auth.admin.deleteUser(userId);
    } catch (deleteError) {
      console.error("[Agency Application] Failed to delete auth account:", deleteError);
    }

    return { status: "error", message: agencyError.message ?? "Unable to submit your application." };
  }

  console.log("[Agency Application] Application saved successfully:", userId);

  // Send email notifications
  try {
    await Promise.all([
      sendApplicationReceivedEmail({
        applicantEmail: contactEmail,
        applicantName: legalCompanyName,
        applicationType: "agency",
        applicationId: userId, // Use userId as application ID
        locale,
      }),
      sendAdminNewApplicationEmail({
        applicantEmail: contactEmail,
        applicantName: legalCompanyName,
        applicationType: "agency",
        applicationId: userId,
        locale,
      }),
    ]);
  } catch (emailError) {
    console.error("Failed to send application emails", emailError);
    // Don't fail the application if emails fail
  }

  redirect(`/${locale}/auth/sign-up/thanks?role=agency`);
}




