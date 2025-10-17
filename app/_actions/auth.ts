"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { defaultLocale, isSupportedLocale } from "@/i18n/config";

export async function signOutAction(locale?: string) {
  const supabase = getSupabaseServerClient();
  await supabase.auth.signOut();

  const nextLocale = locale && isSupportedLocale(locale) ? locale : defaultLocale;

  revalidatePath(`/${nextLocale}`);
  redirect(`/${nextLocale}`);
}
