export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { AgencySignUpForm } from "@/components/auth/applications/agency-sign-up-form";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type AgencySignUpPageProps = {
  params: { locale: string };
  searchParams: { plan?: string };
};

export default async function AgencySignUpPage({ params, searchParams }: AgencySignUpPageProps) {
  const { locale } = params;
  const { plan } = searchParams;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const supabase = getSupabaseServerClient();
  const { data: countries } = await supabase
    .from('countries')
    .select('code, name')
    .order('name', { ascending: true });

  const countryOptions = (countries ?? []).map((country) => ({
    code: country.code,
    name: country.name ?? country.code,
  }));

  return (
    <div className="bg-background px-6 py-16 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Travel agency application
          </h1>
          <p className="text-sm text-foreground/70 sm:text-base">
            Tell us about your organisation so we can verify your credentials and publish your profile to trusted
            partners across the Guide Validator network.
          </p>
        </div>
        <AgencySignUpForm locale={locale as SupportedLocale} countries={countryOptions} preselectedPlan={plan} />
      </div>
    </div>
  );
}
