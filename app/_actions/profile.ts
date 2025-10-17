"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import type { AdminActionState } from "@/app/_actions/admin";

const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;
const UUID_REGEX = /^[0-9a-fA-F-]{36}$/;

function sanitizeDelimited(input: FormDataEntryValue | null): string[] {
  if (typeof input !== "string") {
    return [];
  }
  return input
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

async function replaceJoin(
  client: ReturnType<typeof getSupabaseServerClient> | ReturnType<typeof getSupabaseServiceClient>,
  table: string,
  idColumn: string,
  idValue: string,
  valueColumn: string,
  values: string[]
) {
  const { error: deleteError } = await client.from(table).delete().eq(idColumn, idValue);
  if (deleteError) {
    console.error(`Failed to clear ${table}`, deleteError);
    return { ok: false as const, message: deleteError.message };
  }

  if (values.length === 0) {
    return { ok: true as const };
  }

  const payload = values.map((value) => ({
    [idColumn]: idValue,
    [valueColumn]: value,
  }));

  const { error: insertError } = await client.from(table).insert(payload);
  if (insertError) {
    console.error(`Failed to insert into ${table}`, insertError);
    return { ok: false as const, message: insertError.message };
  }

  return { ok: true as const };
}

function normalizeCountryCodes(codes: string[]): string[] {
  return Array.from(
    new Set(
      codes
        .map((code) => code.toUpperCase())
        .filter((code) => COUNTRY_CODE_REGEX.test(code))
    )
  );
}

function normalizeUUIDList(values: string[]): string[] {
  return Array.from(new Set(values.filter((value) => UUID_REGEX.test(value.toLowerCase())))).map((value) =>
    value.toLowerCase()
  );
}

function normalizeStringList(values: string[]): string[] {
  return Array.from(
    new Set(
      values
        .map((value) => value.trim())
        .filter(Boolean)
    )
  );
}

export type ProfileActionState = {
  ok: boolean;
  message?: string;
};

const INITIAL_STATE: ProfileActionState = { ok: true };

export async function updateGuideProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const authCheck = await requireCurrentProfile();
  if (!authCheck.ok) {
    return { ok: false, message: authCheck.reason };
  }

  const { supabase, user, profile } = authCheck;
  const locale = String(formData.get("locale") ?? "en");

  if (profile.role !== "guide") {
    return { ok: false, message: "NOT_GUIDE" };
  }

  // Handle languages from JSON (CustomLanguageInput) or legacy multi-select
  let languages: string[] = [];
  const languagesJson = formData.get("languages");
  if (languagesJson && typeof languagesJson === "string") {
    try {
      const parsed = JSON.parse(languagesJson);
      languages = normalizeStringList(Array.isArray(parsed) ? parsed : []).map((entry) => entry.toLowerCase());
    } catch {
      languages = [];
    }
  }
  if (languages.length === 0) {
    languages = normalizeStringList([
      ...sanitizeMulti(formData, "spokenLanguages"),
      ...sanitizeDelimited(formData.get("spokenLanguagesExtra")),
    ].map((entry) => entry.toLowerCase()));
  }

  const specialties = normalizeStringList([
    ...sanitizeMulti(formData, "guideSpecialties"),
    ...sanitizeDelimited(formData.get("guideSpecialtiesExtra")),
  ]);

  const countryCodes = normalizeCountryCodes(sanitizeMulti(formData, "countries"));
  const regionIds = normalizeUUIDList(sanitizeMulti(formData, "regions"));
  const cityIds = normalizeUUIDList(sanitizeMulti(formData, "cities"));

  const businessName = String(formData.get("businessName") ?? "").trim() || null;
  const bio = String(formData.get("bio") ?? "").trim() || null;
  const yearsExperienceRaw = formData.get("yearsExperience");
  const yearsExperience = yearsExperienceRaw ? Number(yearsExperienceRaw) : null;
  const timezone = String(formData.get("timezone") ?? "").trim() || null;
  const availabilityTimezone = String(formData.get("availabilityTimezone") ?? "").trim() || null;

  const { error: guideUpdateError } = await supabase
    .from("guides")
    .update({
      spoken_languages: languages,
      specialties,
      business_name: businessName,
      bio: bio,
      years_experience: yearsExperience,
      timezone: timezone,
      availability_timezone: availabilityTimezone,
    })
    .eq("profile_id", user.id);

  if (guideUpdateError) {
    return { ok: false, message: guideUpdateError.message };
  }

  const replacements = [
    await replaceJoin(supabase, "guide_countries", "guide_id", user.id, "country_code", countryCodes),
    await replaceJoin(supabase, "guide_regions", "guide_id", user.id, "region_id", regionIds),
    await replaceJoin(supabase, "guide_cities", "guide_id", user.id, "city_id", cityIds),
  ];

  const failed = replacements.find((result) => !result.ok);
  if (failed && !failed.ok) {
    return { ok: false, message: failed.message ?? "UPDATE_FAILED" };
  }

  if (locale) {
    revalidatePath(`/${locale}/account/profile`);
    revalidatePath(`/${locale}/directory`);
  }
  revalidatePath(`/profiles/guide/${user.id}`);

  return { ok: true, message: "GUIDE_UPDATED" };
}

export async function updateOrganizationProfileAction(
  _prev: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const authCheck = await requireCurrentProfile();
  if (!authCheck.ok) {
    return { ok: false, message: authCheck.reason };
  }

  const { supabase, profile } = authCheck;
  const locale = String(formData.get("locale") ?? "en");
  const orgId = profile.organization_id;

  if (!orgId) {
    return { ok: false, message: "NO_ORGANIZATION" };
  }

  if (!["agency", "dmc", "transport"].includes(profile.role)) {
    return { ok: false, message: "UNSUPPORTED_ROLE" };
  }

  const languages = normalizeStringList([
    ...sanitizeMulti(formData, "organizationLanguages"),
    ...sanitizeDelimited(formData.get("organizationLanguagesExtra")),
  ].map((entry) => entry.toLowerCase()));

  const specialties = normalizeStringList([
    ...sanitizeMulti(formData, "organizationSpecialties"),
    ...sanitizeDelimited(formData.get("organizationSpecialtiesExtra")),
  ]);

  const countryCodes = normalizeCountryCodes(sanitizeMulti(formData, "organizationCountries"));
  const regionIds = normalizeUUIDList(sanitizeMulti(formData, "organizationRegions"));
  const cityIds = normalizeUUIDList(sanitizeMulti(formData, "organizationCities"));

  const { error: agencyUpdateError } = await supabase
    .from("agencies")
    .update({
      languages,
      specialties,
    })
    .eq("id", orgId);

  if (agencyUpdateError) {
    return { ok: false, message: agencyUpdateError.message };
  }

  const isTransport = profile.role === "transport";
  const countryTable = isTransport ? "transport_countries" : "dmc_countries";
  const regionTable = isTransport ? "transport_regions" : "dmc_regions";
  const cityTable = isTransport ? "transport_cities" : "dmc_cities";
  const idColumn = isTransport ? "transport_agency_id" : "agency_id";

  const replacements = [
    await replaceJoin(supabase, countryTable, idColumn, orgId, isTransport ? "country_code" : "country_code", countryCodes),
    await replaceJoin(supabase, regionTable, idColumn, orgId, isTransport ? "region_id" : "region_id", regionIds),
    await replaceJoin(supabase, cityTable, idColumn, orgId, isTransport ? "city_id" : "city_id", cityIds),
  ];

  const failed = replacements.find((result) => !result.ok);
  if (failed && !failed.ok) {
    return { ok: false, message: failed.message ?? "UPDATE_FAILED" };
  }

  if (locale) {
    revalidatePath(`/${locale}/account/profile`);
    revalidatePath(`/${locale}/directory`);
  }

  return { ok: true, message: "ORGANIZATION_UPDATED" };
}

// Admin wrappers -----------------------------------------------------------

async function adminReplaceGuideSegments(
  targetProfileId: string,
  languages: string[],
  specialties: string[],
  countryCodes: string[],
  regionIds: string[],
  cityIds: string[]
) {
  const service = getSupabaseServiceClient();
  const { error: updateError } = await service
    .from("guides")
    .update({ spoken_languages: languages, specialties })
    .eq("profile_id", targetProfileId);

  if (updateError) {
    return { ok: false as const, message: updateError.message };
  }

  const replacements = [
    await replaceJoin(service, "guide_countries", "guide_id", targetProfileId, "country_code", countryCodes),
    await replaceJoin(service, "guide_regions", "guide_id", targetProfileId, "region_id", regionIds),
    await replaceJoin(service, "guide_cities", "guide_id", targetProfileId, "city_id", cityIds),
  ];

  const failed = replacements.find((result) => !result.ok);
  if (failed && !failed.ok) {
    return { ok: false as const, message: failed.message ?? "UPDATE_FAILED" };
  }

  return { ok: true as const };
}

async function adminReplaceOrganizationSegments(
  agencyId: string,
  languages: string[],
  specialties: string[],
  countryCodes: string[],
  regionIds: string[],
  cityIds: string[],
  isTransport: boolean
) {
  const service = getSupabaseServiceClient();
  const { error: updateError } = await service
    .from("agencies")
    .update({ languages, specialties })
    .eq("id", agencyId);

  if (updateError) {
    return { ok: false as const, message: updateError.message };
  }

  const idColumn = isTransport ? "transport_agency_id" : "agency_id";
  const countryTable = isTransport ? "transport_countries" : "dmc_countries";
  const regionTable = isTransport ? "transport_regions" : "dmc_regions";
  const cityTable = isTransport ? "transport_cities" : "dmc_cities";

  const replacements = [
    await replaceJoin(service, countryTable, idColumn, agencyId, "country_code", countryCodes),
    await replaceJoin(service, regionTable, idColumn, agencyId, "region_id", regionIds),
    await replaceJoin(service, cityTable, idColumn, agencyId, "city_id", cityIds),
  ];

  const failed = replacements.find((result) => !result.ok);
  if (failed && !failed.ok) {
    return { ok: false as const, message: failed.message ?? "UPDATE_FAILED" };
  }

  return { ok: true as const };
}

export async function adminUpdateGuideSegmentsAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const targetProfileId = String(formData.get("profileId") ?? "").trim();
  const locale = String(formData.get("locale") ?? "en");

  if (!targetProfileId || !UUID_REGEX.test(targetProfileId)) {
    return { ok: false, message: "INVALID_TARGET" };
  }

  const languages = normalizeStringList([
    ...sanitizeMulti(formData, "spokenLanguages"),
    ...sanitizeDelimited(formData.get("spokenLanguagesExtra")),
  ].map((entry) => entry.toLowerCase()));
  const specialties = normalizeStringList([
    ...sanitizeMulti(formData, "guideSpecialties"),
    ...sanitizeDelimited(formData.get("guideSpecialtiesExtra")),
  ]);
  const countries = normalizeCountryCodes(sanitizeMulti(formData, "countries"));
  const regions = normalizeUUIDList(sanitizeMulti(formData, "regions"));
  const cities = normalizeUUIDList(sanitizeMulti(formData, "cities"));

  const result = await adminReplaceGuideSegments(targetProfileId, languages, specialties, countries, regions, cities);
  if (!result.ok) {
    return { ok: false, message: result.message ?? "UPDATE_FAILED" };
  }

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/users/${targetProfileId}`);
  revalidatePath(`/profiles/guide/${targetProfileId}`);
  return { ok: true, message: "GUIDE_UPDATED" };
}

export async function adminUpdateOrganizationSegmentsAction(
  _prev: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const agencyId = String(formData.get("agencyId") ?? "").trim();
  const organizationType = String(formData.get("organizationType") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  if (!agencyId || !UUID_REGEX.test(agencyId)) {
    return { ok: false, message: "INVALID_ORG" };
  }

  const languages = normalizeStringList([
    ...sanitizeMulti(formData, "organizationLanguages"),
    ...sanitizeDelimited(formData.get("organizationLanguagesExtra")),
  ].map((entry) => entry.toLowerCase()));
  const specialties = normalizeStringList([
    ...sanitizeMulti(formData, "organizationSpecialties"),
    ...sanitizeDelimited(formData.get("organizationSpecialtiesExtra")),
  ]);
  const countries = normalizeCountryCodes(sanitizeMulti(formData, "organizationCountries"));
  const regions = normalizeUUIDList(sanitizeMulti(formData, "organizationRegions"));
  const cities = normalizeUUIDList(sanitizeMulti(formData, "organizationCities"));

  if (!["agency", "dmc", "transport"].includes(organizationType)) {
    return { ok: false, message: "INVALID_ORG_TYPE" };
  }

  const result = await adminReplaceOrganizationSegments(
    agencyId,
    languages,
    specialties,
    countries,
    regions,
    cities,
    organizationType === "transport"
  );

  if (!result.ok) {
    return { ok: false, message: result.message ?? "UPDATE_FAILED" };
  }

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/users/${agencyId}`);
  return { ok: true, message: "ORGANIZATION_UPDATED" };
}

