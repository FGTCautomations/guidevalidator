export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ResetRequestForm } from "@/components/auth/reset-request-form";
import { ResetUpdateForm } from "@/components/auth/reset-update-form";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";

type ResetPasswordPageProps = {
  params: { locale: string };
  searchParams?: { token?: string };
};

export default async function ResetPasswordPage({ params, searchParams }: ResetPasswordPageProps) {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const baseLocale = locale as SupportedLocale;
  const rootTranslations = await getTranslations({ locale: baseLocale, namespace: "auth.reset" });

  if (searchParams?.token) {
    const t = await getTranslations({ locale: baseLocale, namespace: "auth.reset.update" });
    return (
      <ResetUpdateForm
        locale={locale}
        strings={{
          title: t("title"),
          passwordLabel: t("passwordLabel"),
          confirmPasswordLabel: t("confirmPasswordLabel"),
          submit: t("submit"),
          success: t("success"),
          backToSignIn: rootTranslations("backToSignIn"),
        }}
      />
    );
  }

  const requestTranslations = await getTranslations({ locale: baseLocale, namespace: "auth.reset.request" });

  return (
    <ResetRequestForm
      locale={locale}
      strings={{
        title: requestTranslations("title"),
        description: requestTranslations("description"),
        emailLabel: requestTranslations("emailLabel"),
        submit: requestTranslations("submit"),
        success: requestTranslations("success"),
        backToSignIn: rootTranslations("backToSignIn"),
      }}
    />
  );
}
