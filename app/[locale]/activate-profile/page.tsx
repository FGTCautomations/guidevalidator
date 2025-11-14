export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { ActivateProfileForm } from "@/components/auth/activate-profile-form";

type PageProps = {
  params: { locale: string };
};

export default async function ActivateProfilePage({ params }: PageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect("/" + requestedLocale);
  }

  const locale = requestedLocale as SupportedLocale;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-lg bg-white p-8 shadow-sm">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Activate Your Guide Profile
            </h1>
            <p className="text-foreground/70">
              Enter your license number to claim your profile and create your account on Guide Validator.
            </p>
          </header>

          <ActivateProfileForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
