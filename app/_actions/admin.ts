"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { ADMIN_ALLOWED_ROLES } from "@/lib/admin/queries";
import { isSupportedLocale } from "@/i18n/config";
import {
  sendProfileCreatedEmail,
  sendProfileDeletedEmail,
  sendProfileUpdatedEmail,
} from "@/lib/email/resend";

export type AdminActionState = {
  ok: boolean;
  message?: string;
};

type RoleValue = (typeof ADMIN_ALLOWED_ROLES)[number];

type ProfileRow = {
  full_name?: string | null;
  role?: string | null;
  locale?: string | null;
  country_code?: string | null;
  timezone?: string | null;
};

async function requireAdmin() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false as const, reason: "NOT_AUTHENTICATED" };
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return { ok: false as const, reason: "PROFILE_NOT_FOUND" };
  }

  if (!["admin", "super_admin"].includes(profile.role)) {
    return { ok: false as const, reason: "NOT_AUTHORIZED" };
  }

  return { ok: true as const, supabase, user, profile };
}

function sanitizeRole(value: FormDataEntryValue | null): RoleValue | null {
  const role = typeof value === "string" ? value : null;
  if (!role) return null;
  return ADMIN_ALLOWED_ROLES.includes(role as RoleValue) ? (role as RoleValue) : null;
}

function resolveProfileRow(
  row: ProfileRow | null | undefined,
  fallback: { fullName?: string | null; role?: string | null; locale?: string | null; countryCode?: string | null; timezone?: string | null }
): ProfileRow {
  return {
    full_name: row?.full_name ?? fallback.fullName ?? null,
    role: row?.role ?? fallback.role ?? null,
    locale: row?.locale ?? fallback.locale ?? null,
    country_code: row?.country_code ?? fallback.countryCode ?? null,
    timezone: row?.timezone ?? fallback.timezone ?? null,
  };
}

export async function adminCreateUserAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) {
    return { ok: false, message: authCheck.reason };
  }

  const actorEmail = authCheck.user.email ?? null;

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = sanitizeRole(formData.get("role"));
  const locale = String(formData.get("locale") ?? "en");
  const profileLocaleRaw = String(formData.get("profileLocale") ?? "").trim();
  const countryCodeRaw = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const timezoneValue = String(formData.get("timezone") ?? "").trim();

  if (!email || !password || !role) {
    return { ok: false, message: "MISSING_FIELDS" };
  }

  if (!profileLocaleRaw || !isSupportedLocale(profileLocaleRaw)) {
    return { ok: false, message: "INVALID_PROFILE_LOCALE" };
  }

  if (!countryCodeRaw || !/^[A-Z]{2}$/.test(countryCodeRaw)) {
    return { ok: false, message: "INVALID_COUNTRY" };
  }

  if (timezoneValue && !/^[A-Za-z0-9_\-\/]+$/.test(timezoneValue)) {
    return { ok: false, message: "INVALID_TIMEZONE" };
  }

  try {
    const service = getSupabaseServiceClient();
    const { data: created, error: createError } = await service.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (createError || !created.user) {
      return { ok: false, message: createError?.message ?? "CREATE_USER_FAILED" };
    }

    const profilePayload = {
      id: created.user.id,
      role,
      full_name: fullName || null,
      locale: profileLocaleRaw,
      country_code: countryCodeRaw,
      timezone: timezoneValue || null,
      verified: role === "admin" || role === "super_admin",
    };

    const { error: profileError } = await service
      .from("profiles")
      .upsert(profilePayload, { onConflict: "id" });

    if (profileError) {
      return { ok: false, message: profileError.message };
    }

    const emailResult = await sendProfileCreatedEmail({
      to: email,
      fullName: fullName || null,
      role,
      locale: profileLocaleRaw,
      actorEmail,
    });

    if (!emailResult.ok && emailResult.error) {
      console.warn("sendProfileCreatedEmail failed", emailResult.error);
    }

    if (locale) {
      revalidatePath(`/${locale}/admin`);
    }
    return { ok: true, message: "USER_CREATED" };
  } catch (error: any) {
    console.error("adminCreateUserAction", error);
    return { ok: false, message: error?.message ?? "UNKNOWN_ERROR" };
  }
}

export async function adminUpdateUserAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) {
    return { ok: false, message: authCheck.reason };
  }

  const actorEmail = authCheck.user.email ?? null;

  const userId = String(formData.get("userId") ?? "");
  const locale = String(formData.get("locale") ?? "en");
  const fullName = String(formData.get("fullName") ?? "").trim();
  const role = sanitizeRole(formData.get("role"));
  const verified = formData.get("verified") === "on";
  const licenseVerified = formData.get("licenseVerified") === "on";
  const profileLocaleRaw = String(formData.get("profileLocale") ?? "").trim();
  const countryCodeRaw = String(formData.get("countryCode") ?? "").trim().toUpperCase();
  const timezoneValue = String(formData.get("timezone") ?? "").trim();

  if (!userId) {
    return { ok: false, message: "MISSING_USER" };
  }

  if (!profileLocaleRaw || !isSupportedLocale(profileLocaleRaw)) {
    return { ok: false, message: "INVALID_PROFILE_LOCALE" };
  }

  if (countryCodeRaw && !/^[A-Z]{2}$/.test(countryCodeRaw)) {
    return { ok: false, message: "INVALID_COUNTRY" };
  }

  if (timezoneValue && !/^[A-Za-z0-9_\-\/]+$/.test(timezoneValue)) {
    return { ok: false, message: "INVALID_TIMEZONE" };
  }

  const service = getSupabaseServiceClient();
  const updates: Record<string, unknown> = {
    full_name: fullName || null,
    verified,
    license_verified: licenseVerified,
    locale: profileLocaleRaw,
    country_code: countryCodeRaw || null,
    timezone: timezoneValue || null,
  };

  if (role) {
    updates.role = role;
  }

  const { error } = await service.from("profiles").update(updates).eq("id", userId);

  if (error) {
    return { ok: false, message: error.message };
  }

  const profileQuery = await service
    .from("profiles")
    .select("full_name, role, locale, country_code, timezone")
    .eq("id", userId)
    .maybeSingle();

  if (profileQuery.error) {
    console.error("Failed to load updated profile for notifications", profileQuery.error);
  }

  let recipientEmail: string | null = null;
  try {
    const { data } = await service.auth.admin.getUserById(userId);
    recipientEmail = data?.user?.email ?? null;
  } catch (fetchError) {
    console.error("Failed to load auth user for notification", fetchError);
  }

  if (recipientEmail) {
    const resolved = resolveProfileRow(profileQuery.data as ProfileRow | null, {
      fullName: fullName || null,
      role: role ?? null,
      locale: profileLocaleRaw || locale,
      countryCode: countryCodeRaw || null,
      timezone: timezoneValue || null,
    });

    const emailResult = await sendProfileUpdatedEmail({
      to: recipientEmail,
      fullName: resolved.full_name ?? null,
      role: resolved.role ?? "visitor",
      locale: resolved.locale ?? "en",
      actorEmail,
    });

    if (!emailResult.ok && emailResult.error) {
      console.warn("sendProfileUpdatedEmail failed", emailResult.error);
    }
  }

  revalidatePath(`/${locale}/admin`);
  revalidatePath(`/${locale}/admin/users/${userId}`);
  return { ok: true, message: "USER_UPDATED" };
}

export async function adminDeleteUserAction(
  _prevState: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const authCheck = await requireAdmin();
  if (!authCheck.ok) {
    return { ok: false, message: authCheck.reason };
  }

  const actorEmail = authCheck.user.email ?? null;

  const userId = String(formData.get("userId") ?? "");
  const locale = String(formData.get("locale") ?? "en");

  if (!userId) {
    return { ok: false, message: "MISSING_USER" };
  }

  if (userId === authCheck.user.id) {
    return { ok: false, message: "CANNOT_DELETE_SELF" };
  }

  try {
    const service = getSupabaseServiceClient();

    const profileQuery = await service
      .from("profiles")
      .select("full_name, role, locale, country_code, timezone")
      .eq("id", userId)
      .maybeSingle();

    if (profileQuery.error) {
      console.error("Failed to load profile prior to deletion", profileQuery.error);
    }

    let recipientEmail: string | null = null;
    let authRecordExists = false;
    try {
      const { data } = await service.auth.admin.getUserById(userId);
      if (data?.user) {
        authRecordExists = true;
        recipientEmail = data.user.email ?? null;
      }
    } catch (fetchError: any) {
      if (fetchError?.status && fetchError.status !== 404) {
        console.error("Failed to load auth user for deletion notification", fetchError);
      }
    }

    const { error: profileDeleteError } = await service.from("profiles").delete().eq("id", userId);
    if (profileDeleteError) {
      return { ok: false, message: profileDeleteError.message };
    }

    if (authRecordExists) {
      const { error: authDeleteError } = await service.auth.admin.deleteUser(userId);
      if (authDeleteError) {
        return { ok: false, message: authDeleteError.message };
      }
    }

    if (recipientEmail) {
      const resolved = resolveProfileRow(profileQuery.data as ProfileRow | null, {
        fullName: null,
        role: null,
        locale,
        countryCode: null,
        timezone: null,
      });

      const emailResult = await sendProfileDeletedEmail({
        to: recipientEmail,
        fullName: resolved.full_name ?? null,
        role: resolved.role ?? "visitor",
        locale: resolved.locale ?? "en",
        actorEmail,
      });

      if (!emailResult.ok && emailResult.error) {
        console.warn("sendProfileDeletedEmail failed", emailResult.error);
      }
    }

    revalidatePath(`/${locale}/admin`);
    revalidatePath(`/${locale}/admin/users/${userId}`);
    return { ok: true, message: "USER_DELETED" };
  } catch (error: any) {
    console.error("adminDeleteUserAction", error);
    return { ok: false, message: error?.message ?? "UNKNOWN_ERROR" };
  }
}
