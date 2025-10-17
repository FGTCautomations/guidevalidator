"use server";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { sendProfileCreatedEmail } from "@/lib/email/resend";
import { defaultLocale, isSupportedLocale } from "@/i18n/config";

export type SignUpState = {
  status: "idle" | "error";
  message?: string;
};

export async function signUpAction(_: SignUpState, formData: FormData): Promise<SignUpState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");
  const locale = String(formData.get("locale") ?? defaultLocale);

  const nextLocale = isSupportedLocale(locale) ? locale : defaultLocale;

  if (!email || !password || !confirmPassword) {
    return {
      status: "error",
      message: "Email and password are required.",
    };
  }

  if (password !== confirmPassword) {
    return {
      status: "error",
      message: "Passwords do not match.",
    };
  }

  const supabase = getSupabaseServerClient();

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/${nextLocale}/auth/sign-in`,
    },
  });

  if (error) {
    return {
      status: "error",
      message: error.message ?? "Unable to create account.",
    };
  }

  redirect(`/${nextLocale}/auth/check-email?email=${encodeURIComponent(email)}`);
}
