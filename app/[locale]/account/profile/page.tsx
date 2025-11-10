export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import {
  GUIDE_SPECIALTY_OPTIONS,
  ORGANIZATION_SPECIALTY_OPTIONS,
} from "@/lib/constants/profile";
import {
  loadCoverageOptions,
  loadGuideSegments,
  loadOrganizationSegments,
} from "@/lib/profile/segments";
import { GuideProfileForm } from "@/components/account/profile/guide-profile-form";
import { OrganizationProfileForm } from "@/components/account/profile/organization-profile-form";

type Option = {
  value: string;
  label: string;
};

export default async function AccountProfilePage({
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

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileRow) {
    redirect(`/${locale}`);
  }

  const coverageOptions = await loadCoverageOptions(locale, supabase);

  const countryOptions = coverageOptions.countries;
  const regionOptions = coverageOptions.regions;
  const cityOptions = coverageOptions.cities;
  const languageOptions = coverageOptions.languages;

  if (profileRow.role === "guide") {
    const segments = await loadGuideSegments(user.id, supabase);

    return (
      <div className="flex flex-col gap-6">
        <GuideProfileForm
          locale={locale}
          initial={segments}
          options={{
            languages: languageOptions,
            specialtySuggestions: [...GUIDE_SPECIALTY_OPTIONS],
            countries: countryOptions,
            regions: regionOptions,
            cities: cityOptions,
          }}
        />
      </div>
    );
  }

  if (["agency", "dmc", "transport"].includes(profileRow.role) && profileRow.organization_id) {
    const type = profileRow.role === "transport" ? "transport" : profileRow.role === "dmc" ? "dmc" : "agency";
    const segments = await loadOrganizationSegments(profileRow.organization_id, type, supabase);

    return (
      <div className="flex flex-col gap-6">
        <OrganizationProfileForm
          locale={locale}
          organizationType={type}
          initial={segments}
          options={{
            languages: languageOptions,
            specialtySuggestions: [...ORGANIZATION_SPECIALTY_OPTIONS],
            countries: countryOptions,
            regions: regionOptions,
            cities: cityOptions,
          }}
        />
      </div>
    );
  }

  return (
    <section className="rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 text-sm text-foreground/70">
      <p>Your profile role does not require additional coverage settings.</p>
    </section>
  );
}

