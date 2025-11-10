export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getCountryName, getLanguageName } from "@/lib/utils/locale";
import { loadCoverageOptions } from "@/lib/profile/segments";
import { JobPostingForm } from "@/components/jobs/job-posting-form";

export default async function CreateJobPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect("/" + requestedLocale);
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "jobs.create" });
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, organization_id")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile || !["agency", "dmc"].includes(profile.role)) {
    redirect(`/${locale}/jobs`);
  }

  const coverageOptions = await loadCoverageOptions(locale);

  const languageOptions = coverageOptions.languages.map((option) => ({
    value: option.value,
    label: getLanguageName(locale, option.value) ?? option.label,
  }));

  const specialtyOptions = [
    "Luxury experiences",
    "Corporate travel",
    "Family friendly",
    "Cultural tours",
    "Adventure",
    "Wellness",
  ].map((label) => ({ value: label, label }));

  const countryOptions = coverageOptions.countries.map((option) => ({
    value: option.value,
    label: getCountryName(locale, option.value) ?? option.label,
  }));

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <header className="space-y-3">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {t("badge")}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
          <p className="max-w-2xl text-sm text-foreground/70 sm:text-base">{t("description")}</p>
        </header>

        <JobPostingForm
          locale={locale}
options={{
            countries: countryOptions,
            regions: coverageOptions.regions,
            cities: coverageOptions.cities,
            languages: languageOptions,
            specialties: specialtyOptions,
          }}
          copy={{
            detailsHeading: t("sections.details.heading"),
            detailsDescription: t("sections.details.description"),
            titleLabel: t("fields.title.label"),
            titlePlaceholder: t("fields.title.placeholder"),
            descriptionLabel: t("fields.description.label"),
            descriptionPlaceholder: t("fields.description.placeholder"),
            countryLabel: t("fields.country.label"),
            regionLabel: t("fields.region.label"),
            cityLabel: t("fields.city.label"),
            datesHeading: t("sections.dates.heading"),
            startDateLabel: t("fields.startDate.label"),
            endDateLabel: t("fields.endDate.label"),
            applicationDeadlineLabel: t("fields.applicationDeadline.label"),
            budgetHeading: t("sections.budget.heading"),
            budgetMinLabel: t("fields.budgetMin.label"),
            budgetMaxLabel: t("fields.budgetMax.label"),
            currencyLabel: t("fields.currency.label"),
            requirementsHeading: t("sections.requirements.heading"),
            languagesLabel: t("fields.languages.label"),
            specialtiesLabel: t("fields.specialties.label"),
            statusLabel: t("fields.status.label"),
            languagesPlaceholder: t("fields.languages.placeholder"),
            specialtiesPlaceholder: t("fields.specialties.placeholder"),
            submitLabel: t("actions.submit"),
            cancelLabel: t("actions.cancel"),
            successMessage: t("flash.success"),
            errorMessage: t("flash.error"),
          }}
        />
      </div>
    </div>
  );
}
