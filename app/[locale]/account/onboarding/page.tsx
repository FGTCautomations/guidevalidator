export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale, defaultLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/account/onboarding-form";

export default async function OnboardingPage({ params }: { params: { locale: string } }) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${defaultLocale}/auth/sign-in`);
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "account.onboarding" });

  // Get user profile to check role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, onboarded")
    .eq("id", user.id)
    .single();

  // If already onboarded, redirect to account
  if (profile?.onboarded) {
    redirect(`/${locale}/account/profile`);
  }

  const role = profile?.role || "guide";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t("title")}
        </h1>
        <p className="text-sm text-foreground/70 sm:text-base">{t("description")}</p>
      </header>

      <OnboardingForm locale={locale} userId={user.id} role={role} />
    </div>
  );
}