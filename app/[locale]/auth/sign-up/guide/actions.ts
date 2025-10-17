"use server";

import { redirect } from "next/navigation";

import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { encryptSecret } from "@/lib/security/credential-encryption";
import type { GuideApplicationState } from "@/lib/forms/guide-application-state";
import { uploadImageFile, type UploadImageResult } from "../_utils/upload-image";
import { sendApplicationReceivedEmail, sendAdminNewApplicationEmail } from "@/lib/email/resend";

type LanguageEntry = { language: string; proficiency: string | null };

const PROFILE_PHOTO_BUCKET = "profile-photos";
const COMPLIANCE_BUCKET = "compliance-docs";

function parseList(value: FormDataEntryValue | null): string[] {
  if (!value) return [];
  return String(value)
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/\s+/g, " "));
}

function parseLanguageText(value: FormDataEntryValue | null): LanguageEntry[] {
  if (!value) return [];
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [language, proficiency] = line.split("|").map((part) => part.trim());
      if (language) {
        return { language, proficiency: proficiency || null };
      }
      return null;
    })
    .filter((item): item is LanguageEntry => item !== null);
}

function parseKeyValueJson(value: FormDataEntryValue | null) {
  if (!value) return [];
  return String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, url] = line.split("|").map((part) => part.trim());
      if (title && url) {
        return { title, url };
      }
      return { title: line, url: null };
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
  return parseList(formData.get(key));
}

function parseLanguages(formData: FormData): LanguageEntry[] {
  const selected = formData
    .getAll("languagesSpoken")
    .map((value) => String(value).trim())
    .filter(Boolean);

  if (selected.length) {
    return Array.from(new Set(selected)).map((language) => ({ language, proficiency: null }));
  }

  return parseLanguageText(formData.get("languagesSpoken"));
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

export async function submitGuideApplicationAction(
  _prev: GuideApplicationState,
  formData: FormData
): Promise<GuideApplicationState> {
  const locale = String(formData.get("locale") ?? "en");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "").trim();
  const nationality = String(formData.get("nationality") ?? "").trim().toUpperCase();
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
  const cityOfResidence = String(formData.get("cityOfResidence") ?? "").trim();
  const licenseNumber = String(formData.get("licenseNumber") ?? "").trim();
  const licenseAuthority = String(formData.get("licenseAuthority") ?? "").trim();
  const subscriptionPlan = String(formData.get("subscriptionPlan") ?? "").trim();
  const billingNotes = String(formData.get("billingNotes") ?? "").trim();
  const professionalIntro = String(formData.get("professionalIntro") ?? "").trim();
  const experienceYearsRaw = String(formData.get("experienceYears") ?? "").trim();
  const experienceSummary = String(formData.get("experienceSummary") ?? "").trim();
  const availabilityNotes = String(formData.get("availabilityNotes") ?? "").trim();
  const timeZone = timezone || String(formData.get("timeZone") ?? "").trim();

  const legacyProfilePhotoUrl = String(formData.get("profilePhotoUrl") ?? "").trim();
  const legacyLicenseUrl = String(formData.get("licenseProofUrl") ?? "").trim();
  const legacyIdUrl = String(formData.get("idDocumentUrl") ?? "").trim();

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

  // Validation
  if (!fullName) {
    return { status: "error", message: "Full legal name is required." };
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

  // Merge custom languages with legacy parsing
  const legacyLanguages = parseLanguages(formData);
  const customLanguageEntries = customLanguages.map(lang => ({ language: lang, proficiency: null }));
  const languagesSpoken = [...legacyLanguages, ...customLanguageEntries];

  const specializations = getMultiSelectValues(formData, "specializations");
  const expertiseAreas = getMultiSelectValues(formData, "expertiseAreas");
  const operatingRegions = parseList(formData.get("operatingRegions"));
  const sampleItineraries = parseKeyValueJson(formData.get("sampleItineraries"));
  const mediaGallery = parseKeyValueJson(formData.get("mediaGallery"));
  const contactMethods = parseKeyValueJson(formData.get("contactMethods"));

  const experienceYears = experienceYearsRaw ? Number(experienceYearsRaw) : null;

  const profilePhotoFile = getFile(formData, "profilePhoto");
  const licenseProofFile = getFile(formData, "licenseProof");
  const idDocumentFile = getFile(formData, "idDocument");

  let profilePhotoUpload: UploadImageResult | null = null;
  let licenseUpload: UploadImageResult | null = null;
  let idUpload: UploadImageResult | null = null;

  try {
    [profilePhotoUpload, licenseUpload, idUpload] = await Promise.all([
      uploadImageFile(profilePhotoFile, {
        bucket: PROFILE_PHOTO_BUCKET,
        folder: `guide-applications/${locale}`,
        makePublic: true,
      }),
      uploadImageFile(licenseProofFile, {
        bucket: COMPLIANCE_BUCKET,
        folder: "guide-applications/licenses",
      }),
      uploadImageFile(idDocumentFile, {
        bucket: COMPLIANCE_BUCKET,
        folder: "guide-applications/identity",
      }),
    ]);
  } catch (error) {
    console.error("submitGuideApplicationAction.upload", error);
    const message = error instanceof Error ? error.message : "Unable to process uploaded images.";
    return { status: "error", message };
  }
  const profilePhotoReference =
    profilePhotoUpload?.publicUrl ?? (legacyProfilePhotoUrl ? legacyProfilePhotoUrl : null);
  const licenseReference = combinePrivateReference(COMPLIANCE_BUCKET, licenseUpload, legacyLicenseUrl);
  const idDocumentReference = combinePrivateReference(COMPLIANCE_BUCKET, idUpload, legacyIdUrl);

  const service = getSupabaseServiceClient();

  // Create Supabase auth account with pending approval
  console.log("[Guide Application] Creating auth account for:", loginEmailRaw);

  // Use admin.createUser instead of signUp to bypass email confirmation
  // The user account will exist immediately in auth.users
  // Ban the user until admin approves (ban_duration: "876000h" = 100 years)
  const { data: authData, error: authError } = await service.auth.admin.createUser({
    email: loginEmailRaw,
    password: loginPassword,
    email_confirm: true, // Auto-confirm email
    ban_duration: "876000h", // Ban for ~100 years (will be unbanned on approval)
    user_metadata: {
      full_name: fullName,
      role: "guide",
      pending_approval: true,
      timezone,
      availability_timezone: availabilityTimezone,
      working_hours: workingHours,
      subscription_plan: subscriptionPlan || null,
    },
  });

  if (authError) {
    console.error("[Guide Application] Auth error:", authError);
    console.error("[Guide Application] Error details:", {
      message: authError.message,
      status: authError.status,
      email: loginEmailRaw
    });
    return { status: "error", message: authError.message ?? "Unable to create your account." };
  }

  const userId = authData.user?.id;

  if (!userId) {
    console.error("[Guide Application] No user ID returned from auth.signUp");
    console.error("[Guide Application] Auth data:", authData);
    return { status: "error", message: "Account creation failed - no user ID returned." };
  }

  console.log("[Guide Application] Auth account created successfully:", userId);

  const { data: application, error } = await service.from("guide_applications").insert({
    user_id: userId || null,
    locale,
    full_name: fullName,
    date_of_birth: dateOfBirth ? dateOfBirth : null,
    nationality: nationality || null,
    contact_email: contactEmail,
    contact_phone: contactPhone || null,
    city_of_residence: cityOfResidence || null,
    profile_photo_url: profilePhotoReference,
    avatar_url: profilePhotoReference, // Use profile photo as avatar
    license_number: licenseNumber || null,
    license_authority: licenseAuthority || null,
    license_proof_url: licenseReference,
    specializations,
    languages_spoken: languagesSpoken,
    expertise_areas: expertiseAreas,
    id_document_url: idDocumentReference,
    subscription_plan: subscriptionPlan || null,
    billing_details: { notes: billingNotes || null },
    operating_regions: operatingRegions,
    professional_intro: professionalIntro || null,
    experience_years: experienceYears,
    experience_summary: experienceSummary || null,
    sample_itineraries: { entries: sampleItineraries },
    media_gallery: { entries: mediaGallery },
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
  }).select("id").single();

  if (error) {
    console.error("[Guide Application] Database insert error:", error);
    console.error("[Guide Application] Error details:", {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
    });

    // If auth account was created but DB insert failed, we should clean up
    if (userId) {
      console.error("[Guide Application] Cleaning up auth account:", userId);
      try {
        await service.auth.admin.deleteUser(userId);
        console.log("[Guide Application] Auth account deleted");
      } catch (deleteError) {
        console.error("[Guide Application] Failed to delete auth account:", deleteError);
      }
    }

    return { status: "error", message: error.message ?? "Unable to submit your guide application." };
  }

  console.log("[Guide Application] Application saved successfully:", application.id);

  // Send email notifications
  if (application) {
    try {
      await Promise.all([
        sendApplicationReceivedEmail({
          applicantEmail: contactEmail,
          applicantName: fullName,
          applicationType: "guide",
          applicationId: application.id,
          locale,
        }),
        sendAdminNewApplicationEmail({
          applicantEmail: contactEmail,
          applicantName: fullName,
          applicationType: "guide",
          applicationId: application.id,
          locale,
        }),
      ]);
    } catch (emailError) {
      console.error("Failed to send application emails", emailError);
      // Don't fail the application if emails fail
    }
  }

  redirect(`/${locale}/auth/sign-up/thanks?role=guide`);
}


