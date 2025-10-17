import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale, localeLabels } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAdminUserDetail, ADMIN_ALLOWED_ROLES } from "@/lib/admin/queries";
import { AdminUpdateUserForm } from "@/components/admin/update-user-form";
import { AdminDeleteUserForm } from "@/components/admin/delete-user-form";
import { AdminGuideSegmentsForm } from "@/components/admin/guide-segments-form";
import { AdminOrganizationSegmentsForm } from "@/components/admin/organization-segments-form";
import {
  loadCoverageOptions,
  loadGuideSegments,
  loadOrganizationSegments,
  type SegmentSelection,
} from "@/lib/profile/segments";
import { GUIDE_SPECIALTY_OPTIONS, ORGANIZATION_SPECIALTY_OPTIONS } from "@/lib/constants/profile";

function formatCurrency(amountCents: number, currency: string | null, locale: string) {
  if (typeof amountCents !== "number") {
    return "--";
  }
  const amount = amountCents / 100;
  const currencyCode = currency ?? "EUR";
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency: currencyCode }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currencyCode}`;
  }
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale: requestedLocale, id } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "admin.detail" });
  const tRoles = await getTranslations({ locale, namespace: "admin.roles" });

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect(`/${locale}`);
  }

  const detail = await fetchAdminUserDetail(id);
  if (!detail) {
    notFound();
  }

  const coverageOptions = await loadCoverageOptions(locale, supabase);

  const countryOptions = coverageOptions.countries;
  const regionOptions = coverageOptions.regions;
  const cityOptions = coverageOptions.cities;
  const languageOptions = coverageOptions.languages;

  const countryNameMap = new Map(countryOptions.map((option) => [option.value, option.label]));

  const localeOptions = Object.entries(localeLabels).map(([value, label]) => ({
    value,
    label,
  }));

  const profileLocaleLabel =
    detail.profile.locale && isSupportedLocale(detail.profile.locale)
      ? localeLabels[detail.profile.locale]
      : detail.profile.locale ?? t("unknown");

  const profileCountryLabel = detail.profile.countryCode
    ? countryNameMap.get(detail.profile.countryCode) ?? detail.profile.countryCode
    : t("unknown");

  const profileTimezoneLabel = detail.profile.timezone ?? t("unknown");

  const roleOptions = ADMIN_ALLOWED_ROLES.map((value) => ({
    value,
    label: tRoles(value),
  }));

  const joinedLabel = new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
    new Date(detail.profile.createdAt)
  );

  const totalIncomeFormatted = formatCurrency(detail.totalIncomeCents, detail.payments[0]?.currency ?? "EUR", locale);
  const shouldShowGuideSegments = detail.profile.role === "guide";
  const shouldShowOrganizationSegments =
    Boolean(detail.profile.organizationId) && ["agency", "dmc", "transport"].includes(detail.profile.role);

  const guideSegments: SegmentSelection | null = shouldShowGuideSegments
    ? await loadGuideSegments(detail.id, supabase)
    : null;

  let organizationSegments: SegmentSelection | null = null;
  let organizationType: "agency" | "dmc" | "transport" | null = null;

  if (shouldShowOrganizationSegments && detail.profile.organizationId) {
    organizationType =
      detail.profile.role === "transport"
        ? "transport"
        : detail.profile.role === "dmc"
          ? "dmc"
          : "agency";
    organizationSegments = await loadOrganizationSegments(detail.profile.organizationId, organizationType, supabase);
  }

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{t("title")}</h1>
            <p className="text-sm text-foreground/70 sm:text-base">{detail.email ?? t("unknownEmail")}</p>
          </div>
          <AdminDeleteUserForm
            userId={detail.id}
            locale={locale}
            redirectTo={`/${locale}/admin`}
            translations={{
              heading: t("actions.delete.heading"),
              confirm: t("actions.delete.confirm"),
              cancel: t("actions.delete.cancel"),
              submit: t("actions.delete.submit"),
              success: t("actions.delete.success"),
              error: t("actions.delete.error"),
            }}
          />
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-2 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">{t("cards.joined")}</p>
            <p className="text-lg font-semibold text-foreground">{joinedLabel}</p>
          </div>
          <div className="space-y-2 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">{t("cards.role")}</p>
            <p className="text-lg font-semibold text-foreground">{tRoles(detail.profile.role)}</p>
          </div>
          <div className="space-y-2 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">{t("cards.verified")}</p>
            <p className="text-lg font-semibold text-foreground">
              {detail.profile.verified ? t("labels.yes") : t("labels.no")}
            </p>
          </div>
          <div className="space-y-2 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">{t("cards.totalIncome")}</p>
            <p className="text-lg font-semibold text-foreground">{totalIncomeFormatted}</p>
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_0.6fr]">
          <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">{t("sections.profile")}</h2>
            <div className="grid gap-4 text-sm text-foreground/80 sm:grid-cols-2">
              <div>
                <p className="font-semibold text-foreground/70">{t("fields.fullName")}</p>
                <p>{detail.profile.fullName ?? t("unknown")}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground/70">{t("fields.role")}</p>
                <p>{tRoles(detail.profile.role)}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground/70">{t("fields.verified")}</p>
                <p>{detail.profile.verified ? t("labels.yes") : t("labels.no")}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground/70">{t("fields.licenseVerified")}</p>
                <p>{detail.profile.licenseVerified ? t("labels.yes") : t("labels.no")}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground/70">{t("fields.locale")}</p>
                <p>{profileLocaleLabel}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground/70">{t("fields.country")}</p>
                <p>{profileCountryLabel}</p>
              </div>
              <div>
                <p className="font-semibold text-foreground/70">{t("fields.timezone")}</p>
                <p>{profileTimezoneLabel}</p>
              </div>
              {detail.profile.organizationName ? (
                <div>
                  <p className="font-semibold text-foreground/70">{t("fields.organization")}</p>
                  <p>
                    {detail.profile.organizationName}
                    {detail.profile.organizationType ? ` - ${tRoles(detail.profile.organizationType as any)}` : ""}
                  </p>
                </div>
              ) : null}
            </div>

            <AdminUpdateUserForm
              userId={detail.id}
              locale={locale}
              initial={{
                fullName: detail.profile.fullName,
                role: detail.profile.role,
                verified: detail.profile.verified,
                licenseVerified: detail.profile.licenseVerified,
                locale: detail.profile.locale,
                countryCode: detail.profile.countryCode,
                timezone: detail.profile.timezone,
              }}
              roles={roleOptions}
              localeOptions={localeOptions}
              countryOptions={countryOptions}
              translations={{
                heading: t("forms.update.heading"),
                fullName: t("fields.fullName"),
                role: t("fields.role"),
                verified: t("fields.verified"),
                licenseVerified: t("fields.licenseVerified"),
                localeLabel: t("fields.locale"),
                country: t("fields.country"),
                timezone: t("fields.timezone"),
                submit: t("forms.update.submit"),
                success: t("forms.update.success"),
                error: t("forms.update.error"),
              }}
            />

            {guideSegments ? (
              <AdminGuideSegmentsForm
                locale={locale}
                profileId={detail.id}
                initial={guideSegments}
                options={{
                  languages: languageOptions,
                  specialtySuggestions: [...GUIDE_SPECIALTY_OPTIONS],
                  countries: countryOptions,
                  regions: regionOptions,
                  cities: cityOptions,
                }}
              />
            ) : null}

            {organizationType && organizationSegments ? (
              <AdminOrganizationSegmentsForm
                locale={locale}
                agencyId={detail.profile.organizationId!}
                organizationType={organizationType}
                initial={organizationSegments}
                options={{
                  languages: languageOptions,
                  specialtySuggestions: [...ORGANIZATION_SPECIALTY_OPTIONS],
                  countries: countryOptions,
                  regions: regionOptions,
                  cities: cityOptions,
                }}
              />
            ) : null}

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("sections.subscriptions")}</h3>
              {detail.subscriptions.length === 0 ? (
                <p className="text-sm text-foreground/60">{t("subscriptions.none")}</p>
              ) : (
                <div className="space-y-2">
                  {detail.subscriptions.map((subscription) => {
                    const nextRenewal = subscription.currentPeriodEnd
                      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                          new Date(subscription.currentPeriodEnd)
                        )
                      : "--";
                    return (
                      <div
                        key={subscription.id}
                        className="rounded-[var(--radius-lg)] border border-foreground/10 bg-white/60 px-4 py-3 text-sm"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-medium text-foreground">
                            {subscription.planCode ?? t("subscriptions.unknownPlan")}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-foreground/60">
                            {subscription.status}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/60">{t("subscriptions.nextRenewal", { date: nextRenewal })}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground">{t("sections.payments")}</h3>
              {detail.payments.length === 0 ? (
                <p className="text-sm text-foreground/60">{t("payments.none")}</p>
              ) : (
                <div className="space-y-2">
                  {detail.payments.map((payment) => {
                    const paidAt = payment.paidAt
                      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(payment.paidAt))
                      : "--";
                    return (
                      <div
                        key={payment.id}
                        className="rounded-[var(--radius-lg)] border border-foreground/10 bg-white/60 px-4 py-3 text-sm"
                      >
                        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                          <span className="font-medium text-foreground">
                            {payment.planCode ?? t("payments.unknownPlan")}
                          </span>
                          <span className="text-xs uppercase tracking-wide text-foreground/60">
                            {payment.status}
                          </span>
                        </div>
                        <p className="text-xs text-foreground/60">
                          {t("payments.paidAt", { date: paidAt })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </section>

          <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-foreground">{t("sections.actions")}</h2>
            <p className="text-sm text-foreground/70">{t("actions.description")}</p>
            <AdminDeleteUserForm
              userId={detail.id}
              locale={locale}
              redirectTo={`/${locale}/admin`}
              translations={{
                heading: t("actions.delete.heading"),
                confirm: t("actions.delete.confirm"),
                cancel: t("actions.delete.cancel"),
                submit: t("actions.delete.submit"),
                success: t("actions.delete.success"),
                error: t("actions.delete.error"),
              }}
            />
          </section>
        </div>
      </div>
    </div>
  );
}












