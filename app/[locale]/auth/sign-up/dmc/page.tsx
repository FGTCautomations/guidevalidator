export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";

import { DmcSignUpForm } from "@/components/auth/applications/dmc-sign-up-form";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type DmcSignUpPageProps = {
  params: { locale: string };
  searchParams: { plan?: string };
};

export default async function DmcSignUpPage({ params, searchParams }: DmcSignUpPageProps) {
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
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">DMC application</h1>
          <p className="text-sm text-foreground/70 sm:text-base">
            Tell us about your destination management services, coverage, and portfolio so we can connect you with
            verified travel partners.
          </p>
        </div>
        <DmcSignUpForm locale={locale as SupportedLocale} countries={countryOptions} preselectedPlan={plan} />
      </div>
    </div>
  );
}
