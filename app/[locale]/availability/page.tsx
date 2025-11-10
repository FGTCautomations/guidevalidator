export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProviderAvailabilityView } from "@/components/availability/provider-availability-view";

export default async function AvailabilityViewPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect("/" + requestedLocale);
  }

  const locale = requestedLocale as SupportedLocale;
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  // Check if user is a profile or agency
  const { data: profileRow } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  const { data: agencyRow } = await supabase
    .from("agencies")
    .select("id, type")
    .eq("id", user.id)
    .maybeSingle();

  let userRole: string;
  if (profileRow) {
    userRole = profileRow.role;
  } else if (agencyRow) {
    userRole = agencyRow.type;
  } else {
    redirect(`/${locale}`);
    return;
  }

  // Only agencies and DMCs can view provider availability
  if (!["agency", "dmc"].includes(userRole)) {
    redirect(`/${locale}/directory`);
  }

  // This page is deprecated - redirect to directory where users can view individual calendars
  redirect(`/${locale}/directory/guides`);
}