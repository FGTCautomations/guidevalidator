import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { SignInForm } from "@/components/auth/sign-in-form";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";

type SignInPageProps = {
  params: { locale: string };
};

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale: locale as SupportedLocale, namespace: "auth.signIn" });

  return (
    <SignInForm
      locale={locale}
      strings={{
        title: t("title"),
        description: t("description"),
        emailLabel: t("emailLabel"),
        passwordLabel: t("passwordLabel"),
        rememberMe: t("rememberMe"),
        forgotPassword: t("forgotPassword"),
        submit: t("submit"),
        noAccount: t("noAccount"),
        createAccount: t("createAccount"),
        error: t("error"),
      }}
    />
  );
}
