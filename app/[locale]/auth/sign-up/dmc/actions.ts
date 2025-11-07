"use server";

import { redirect } from "next/navigation";

import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { encryptSecret } from "@/lib/security/credential-encryption";
import { sendApplicationReceivedEmail, sendAdminNewApplicationEmail } from "@/lib/email/resend";
import type { DmcApplicationState } from "./types";

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return String(value)
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/\s+/g, ' '));
}

function parseKeyValueList(value: FormDataEntryValue | null) {
  if (!value) return [];
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, url] = line.split('|').map((part) => part.trim());
      if (title && url) {
        return { title, url };
      }
      return { title: line, url: null };
    });
}

export async function submitDmcApplicationAction(
  _prev: DmcApplicationState,
  formData: FormData
): Promise<DmcApplicationState> {
  const locale = String(formData.get('locale') ?? 'en');
  const legalEntityName = String(formData.get('legalEntityName') ?? '').trim();
  const registrationNumber = String(formData.get('registrationNumber') ?? '').trim();
  const registrationCountry = String(formData.get('registrationCountry') ?? '').trim().toUpperCase();
  const officeAddress = String(formData.get('officeAddress') ?? '').trim();
  const contactEmail = String(formData.get('contactEmail') ?? '').trim();

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

  const contactPhone = String(formData.get('contactPhone') ?? '').trim();
  const websiteUrl = String(formData.get('websiteUrl') ?? '').trim();
  const logoUrl = String(formData.get('logoUrl') ?? '').trim();
  const companyOverview = String(formData.get('companyOverview') ?? '').trim();
  const taxId = String(formData.get('taxId') ?? '').trim();
  const licenseUrl = String(formData.get('licenseUrl') ?? '').trim();
  const memberships = parseList(formData.get('memberships'));
  const representativeName = String(formData.get('representativeName') ?? '').trim();
  const representativeRole = String(formData.get('representativeRole') ?? '').trim();
  const representativeEmail = String(formData.get('representativeEmail') ?? '').trim();
  const representativePhone = String(formData.get('representativePhone') ?? '').trim();
  const destCoverage = parseList(formData.get('destinationCoverage'));
  const servicesOffered = parseList(formData.get('servicesOffered'));
  const specializations = parseList(formData.get('specializations'));
  const portfolioEntries = parseKeyValueList(formData.get('portfolioExamples'));
  const certifications = parseList(formData.get('certifications'));
  const mediaGallery = parseKeyValueList(formData.get('mediaGallery'));
  const references = parseKeyValueList(formData.get('clientReferences'));
  const practicalInfo = String(formData.get('practicalInfo') ?? '').trim();
  const timeZone = timezone || String(formData.get('timeZone') ?? '').trim();
  const responseTime = String(formData.get('responseTime') ?? '').trim();
  const contactMethods = parseKeyValueList(formData.get('contactMethods'));
  const subscriptionPlan = String(formData.get('subscriptionPlan') ?? '').trim();
  const billingNotes = String(formData.get('billingNotes') ?? '').trim();

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

  // Merge custom languages with legacy parsing
  const legacyLanguagesSpoken = parseList(formData.get('languagesSpoken'));
  const languagesSpoken = [...legacyLanguagesSpoken, ...customLanguages];

  if (!legalEntityName) {
    return { status: 'error', message: 'Legal entity name is required.' };
  }

  if (!contactEmail) {
    return { status: 'error', message: 'Official email is required.' };
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
      role: "dmc",
      pending_approval: true,
      timezone,
      availability_timezone: availabilityTimezone,
      working_hours: workingHours,
    location_data: locationData,
      subscription_plan: subscriptionPlan || null,
    },
  });

  if (authError) {
    console.error("submitDmcApplicationAction.auth", authError);
    return { status: "error", message: authError.message ?? "Unable to create your account." };
  }

  const userId = authData.user?.id;

  if (!userId) {
    console.error("[DMC Application] No user ID returned from auth.createUser");
    return { status: "error", message: "Account creation failed - no user ID returned." };
  }

  console.log("[DMC Application] Auth account created successfully:", userId);

  // NEW CONSOLIDATED APPROACH: Insert into agencies table with type='dmc' and pending status
  // Prepare application data to preserve original submission
  const applicationData = {
    user_id: userId,
    locale,
    legal_entity_name: legalEntityName,
    registration_number: registrationNumber || null,
    registration_country: registrationCountry || null,
    office_address: officeAddress || null,
    contact_email: contactEmail,
    contact_phone: contactPhone || null,
    website_url: websiteUrl || null,
    logo_url: logoUrl || null,
    company_overview: companyOverview || null,
    tax_id: taxId || null,
    license_proof_url: licenseUrl || null,
    memberships,
    representative_name: representativeName || null,
    representative_position: representativeRole || null,
    representative_contact: {
      email: representativeEmail || null,
      phone: representativePhone || null,
    },
    destination_coverage: destCoverage,
    services_offered: servicesOffered,
    specializations,
    portfolio: { entries: portfolioEntries },
    languages_spoken: languagesSpoken,
    certifications,
    media_gallery: { entries: mediaGallery },
    client_references: { entries: references },
    practical_info: {
      notes: practicalInfo || null,
      time_zone: timeZone || null,
      response_time: responseTime || null,
      availability_timezone: availabilityTimezone || null,
      working_hours: workingHours || null,
    },
    contact_methods: contactMethods,
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

  // Insert into agencies table with type='dmc' and pending status
  const { error: dmcError } = await service.from("agencies").insert({
    id: userId, // Use userId as agency ID for consistency
    type: "dmc",
    name: legalEntityName,
    slug: legalEntityName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    registration_country: registrationCountry || null,
    description: companyOverview || null,
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
    availability_notes: practicalInfo || null,
    location_data: locationData,
    application_data: applicationData, // Preserve original application
    application_status: "pending",
    application_submitted_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (dmcError) {
    console.error("[DMC Application] Insert error:", dmcError);

    // Clean up auth account
    try {
      await service.auth.admin.deleteUser(userId);
    } catch (deleteError) {
      console.error("[DMC Application] Failed to delete auth account:", deleteError);
    }

    return { status: "error", message: dmcError.message ?? "Unable to submit your DMC application." };
  }

  console.log("[DMC Application] Application saved successfully:", userId);

  // Send email notifications
  try {
    await Promise.all([
      sendApplicationReceivedEmail({
        applicantEmail: contactEmail,
        applicantName: legalEntityName,
        applicationType: "dmc",
        applicationId: userId, // Use userId as application ID
        locale,
      }),
      sendAdminNewApplicationEmail({
        applicantEmail: contactEmail,
        applicantName: legalEntityName,
        applicationType: "dmc",
        applicationId: userId,
        locale,
      }),
    ]);
  } catch (emailError) {
    console.error("Failed to send application emails", emailError);
    // Don't fail the application if emails fail
  }

  // Redirect to appropriate Stripe payment link based on subscription plan
  let paymentUrl: string;

  if (subscriptionPlan === "dmc-core") {
    // Regional DMC subscription
    paymentUrl = "https://buy.stripe.com/14AcMY6zP6jdcsqa7H8so01";
  } else if (subscriptionPlan === "dmc-multimarket") {
    // Multi-market DMC subscription
    paymentUrl = "https://buy.stripe.com/9B6eV64rH8rl9gebbL8so00";
  } else if (subscriptionPlan === "dmc-enterprise") {
    // Enterprise plan - redirect to thanks page for manual contact
    paymentUrl = `/${locale}/auth/sign-up/thanks?role=dmc&plan=enterprise`;
  } else {
    // Default to thanks page if no plan selected or unknown plan
    paymentUrl = `/${locale}/auth/sign-up/thanks?role=dmc`;
  }

  redirect(paymentUrl);
}

