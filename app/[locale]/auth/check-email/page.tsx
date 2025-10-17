import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AuthCard, AuthCardFooterLink } from "@/components/auth/auth-card";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";

type CheckEmailPageProps = {
  params: { locale: string };
  searchParams?: { email?: string };
};

export default async function CheckEmailPage({ params, searchParams }: CheckEmailPageProps) {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    notFound();
  }

  const t = await getTranslations({ locale: locale as SupportedLocale, namespace: "auth.status" });
  const displayEmail = searchParams?.email ? decodeURIComponent(searchParams.email) : undefined;

  return (
    <AuthCard
      title={t("checkEmailTitle")}
      footer={
        <AuthCardFooterLink href={`/${locale}/auth/sign-in`}>
          {t("backToSignIn")}
        </AuthCardFooterLink>
      }
    >
      <div className="space-y-4">
        <p className="rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3 text-sm text-secondary">
          {t("checkEmailBody", { email: displayEmail ?? "your inbox" })}
        </p>
        <button
          type="button"
          className="w-full rounded-full border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground disabled:opacity-60"
          disabled
        >
          {t("resend")}
        </button>
      </div>
    </AuthCard>
  );
}
