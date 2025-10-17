"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupportedLocale, defaultLocale } from "@/i18n/config";
import type { SignInState } from "./state";

export async function signInAction(_: SignInState, formData: FormData): Promise<SignInState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const locale = String(formData.get("locale") ?? defaultLocale);

  const nextLocale = isSupportedLocale(locale) ? locale : defaultLocale;

  if (!email || !password) {
    return {
      status: "error",
      message: "Email and password are required.",
    };
  }

  const supabase = getSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return {
      status: "error",
      message: error.message ?? "Unable to sign in.",
    };
  }

  redirect(`/${nextLocale}/directory`);
}
