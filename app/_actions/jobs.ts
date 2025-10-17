"use server";

import { revalidatePath } from "next/cache";

import { getSupabaseServerClient } from "@/lib/supabase/server";

function sanitizeDelimited(value: FormDataEntryValue | null): string[] {
  if (typeof value !== "string") {
    return [];
  }
  return value
    .split(/[\n,]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => entry.replace(/\s+/g, " "));
}

function sanitizeMulti(formData: FormData, key: string): string[] {
  return formData
    .getAll(key)
    .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
    .filter(Boolean);
}

async function requireCurrentProfile() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, reason: "NOT_AUTHENTICATED" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return { ok: false as const, reason: "PROFILE_NOT_FOUND" };
  }

  return { ok: true as const, supabase, user, profile };
}

export type JobActionState = {
  ok: boolean;
  message?: string;
};

function toLowercaseList(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.toLowerCase())));
}

function parseCurrencyAmount(input: FormDataEntryValue | null): number | null {
  if (typeof input !== "string" || input.trim().length === 0) {
    return null;
  }
  const numeric = Number.parseFloat(input.replace(/[^0-9.,-]/g, "").replace(/,/g, "."));
  if (!Number.isFinite(numeric)) {
    return null;
  }
  return Math.max(0, Math.round(numeric * 100));
}

function parseISODate(input: FormDataEntryValue | null): string | null {
  if (typeof input !== "string") {
    return null;
  }
  const trimmed = input.trim();
  if (!trimmed) {
    return null;
  }
  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : trimmed;
}

export async function createJobPostingAction(
  _prev: JobActionState,
  formData: FormData
): Promise<JobActionState> {
  const authCheck = await requireCurrentProfile();
  if (!authCheck.ok) {
    return { ok: false, message: authCheck.reason };
  }

  const { supabase, profile, user } = authCheck;
  const locale = String(formData.get("locale") ?? "en");

  if (!["agency", "dmc"].includes(profile.role)) {
    return { ok: false, message: "ONLY_AGENCY_OR_DMC_CAN_POST" };
  }

  if (!profile.organization_id) {
    return { ok: false, message: "MISSING_ORGANISATION" };
  }

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!title || !description) {
    return { ok: false, message: "TITLE_AND_DESCRIPTION_REQUIRED" };
  }

  const countryCode = String(formData.get("country") ?? "").trim().toUpperCase() || null;
  const regionId = String(formData.get("region") ?? "").trim() || null;
  const cityId = String(formData.get("city") ?? "").trim() || null;

  const startDate = parseISODate(formData.get("startDate"));
  const endDate = parseISODate(formData.get("endDate"));
  const applicationDeadline = parseISODate(formData.get("applicationDeadline"));

  const currency = String(formData.get("currency") ?? "EUR").trim().toUpperCase() || "EUR";
  const budgetMinCents = parseCurrencyAmount(formData.get("budgetMin"));
  const budgetMaxCents = parseCurrencyAmount(formData.get("budgetMax"));

  const specialties = Array.from(
    new Set([
      ...sanitizeDelimited(formData.get("specialties")),
      ...sanitizeMulti(formData, "specialtyOptions"),
    ])
  );

  const languages = toLowercaseList([
    ...sanitizeMulti(formData, "languageOptions"),
    ...sanitizeDelimited(formData.get("languages")),
  ]);

  const status = String(formData.get("status") ?? "open").trim().toLowerCase() || "open";

  const payload: Record<string, unknown> = {
    title,
    description,
    agency_id: profile.organization_id,
    created_by: user.id,
    country_code: countryCode,
    region_id: regionId || null,
    city_id: cityId || null,
    start_date: startDate,
    end_date: endDate,
    application_deadline: applicationDeadline,
    specialties,
    languages,
    budget_min_cents: budgetMinCents,
    budget_max_cents: budgetMaxCents,
    currency,
    status,
  };

  const { data, error } = await supabase
    .from("jobs")
    .insert(payload)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("Failed to create job", error);
    return { ok: false, message: error.message };
  }

  if (locale) {
    revalidatePath(`/${locale}/jobs`);
  }

  if (data?.id) {
    revalidatePath(`/${locale}/jobs/${data.id}`);
  }

  revalidatePath(`/profiles/agency/${profile.organization_id}`);

  return { ok: true, message: "JOB_CREATED" };
}

export async function submitJobApplicationAction(
  _prev: JobActionState,
  formData: FormData
): Promise<JobActionState> {
  const authCheck = await requireCurrentProfile();
  if (!authCheck.ok) {
    return { ok: false, message: authCheck.reason };
  }

  const { supabase, user, profile } = authCheck;
  const locale = String(formData.get("locale") ?? "en");
  const jobId = String(formData.get("jobId") ?? "").trim();

  if (!jobId) {
    return { ok: false, message: "JOB_REQUIRED" };
  }

  if (profile.role !== "guide") {
    return { ok: false, message: "ONLY_GUIDES_CAN_APPLY" };
  }

  const coverLetter = String(formData.get("coverLetter") ?? "").trim();
  const budgetExpectationCents = parseCurrencyAmount(formData.get("budgetExpectation"));
  const availableStart = parseISODate(formData.get("availableStart"));
  const availableEnd = parseISODate(formData.get("availableEnd"));

  const languages = toLowercaseList([
    ...sanitizeMulti(formData, "applicationLanguages"),
    ...sanitizeDelimited(formData.get("applicationLanguagesText")),
  ]);

  const specialties = Array.from(
    new Set([
      ...sanitizeMulti(formData, "applicationSpecialties"),
      ...sanitizeDelimited(formData.get("applicationSpecialtiesText")),
    ])
  );

  const { error } = await supabase
    .from("job_applications")
    .upsert(
      {
        job_id: jobId,
        guide_id: user.id,
        cover_letter: coverLetter || null,
        status: "pending",
        budget_expectation_cents: budgetExpectationCents,
        available_start_date: availableStart,
        available_end_date: availableEnd,
        languages,
        specialties,
      },
      { onConflict: "job_id,guide_id" }
    );

  if (error) {
    console.error("Failed to submit job application", error);
    return { ok: false, message: error.message };
  }

  if (locale) {
    revalidatePath(`/${locale}/jobs/${jobId}`);
  }

  return { ok: true, message: "JOB_APPLICATION_SUBMITTED" };
}

export async function updateJobApplicationStatusAction(
  _prev: JobActionState,
  formData: FormData
): Promise<JobActionState> {
  const authCheck = await requireCurrentProfile();
  if (!authCheck.ok) {
    return { ok: false, message: authCheck.reason };
  }

  const { supabase, profile } = authCheck;
  const locale = String(formData.get("locale") ?? "en");
  const jobId = String(formData.get("jobId") ?? "").trim();
  const applicationId = String(formData.get("applicationId") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim().toLowerCase();

  const allowedStatuses = new Set(["pending", "accepted", "rejected"]);

  if (!applicationId || !allowedStatuses.has(status)) {
    return { ok: false, message: "INVALID_STATUS" };
  }

  if (!jobId) {
    return { ok: false, message: "JOB_REQUIRED" };
  }

  if (!["agency", "dmc", "super_admin", "admin"].includes(profile.role)) {
    return { ok: false, message: "NOT_AUTHORIZED" };
  }

  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", applicationId);

  if (error) {
    console.error("Failed to update application status", error);
    return { ok: false, message: error.message };
  }

  if (locale) {
    revalidatePath(`/${locale}/jobs/${jobId}`);
  }

  return { ok: true, message: "JOB_APPLICATION_UPDATED" };
}
