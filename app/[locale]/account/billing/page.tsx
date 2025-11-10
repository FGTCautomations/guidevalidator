export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { BILLING_PLAN_CODES } from "@/lib/payments/plans";
import { isSupportedLocale, type SupportedLocale, defaultLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { guidePremiumCheckoutAction, guideVerificationCheckoutAction } from "@/app/_actions/billing";
import { GuideBillingActions } from "@/components/account/guide-billing-actions";

type Translator = Awaited<ReturnType<typeof getTranslations>>;

type SubscriptionRow = {
  plan_code: string | null;
  status: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  canceled_at: string | null;
  updated_at: string | null;
};

type PaymentRow = {
  id: string;
  amount_cents: number | null;
  currency: string | null;
  status: string;
  created_at: string;
  paid_at: string | null;
  plan_code: string | null;
};

type BillingPlanRow = {
  plan_code: string;
  amount_cents: number | null;
  currency: string | null;
  interval: string | null;
};

type Tone = "success" | "warning" | "danger" | "muted";

type StatusMessage = {
  message: string;
  tone: Tone;
};

const toneClasses: Record<Tone, string> = {
  success: "text-emerald-600",
  warning: "text-amber-600",
  danger: "text-red-600",
  muted: "text-foreground/60",
};

const alertClasses: Record<"success" | "warning" | "error", string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  error: "border-red-200 bg-red-50 text-red-700",
};

function formatCurrency(amountCents?: number | null, currency: string = "EUR", locale?: string) {
  if (amountCents == null) return "--";
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

function formatDate(value: string | Date | null | undefined, locale: string): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  try {
    return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function addYears(value: string | null | undefined, years: number): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  date.setFullYear(date.getFullYear() + years);
  return date;
}

function premiumStatusInfo(sub: SubscriptionRow | null, locale: SupportedLocale, t: Translator): StatusMessage {
  if (!sub) {
    return { message: t("status.premium.statuses.inactive"), tone: "muted" };
  }

  const status = (sub.status ?? "").toLowerCase();
  switch (status) {
    case "active": {
      const date = formatDate(sub.current_period_end, locale) ?? "--";
      return { message: t("status.premium.statuses.active", { date }), tone: "success" };
    }
    case "trialing": {
      const date = formatDate(sub.current_period_end, locale) ?? "--";
      return { message: t("status.premium.statuses.trialing", { date }), tone: "success" };
    }
    case "past_due": {
      const date = formatDate(sub.updated_at ?? sub.current_period_end, locale) ?? "--";
      return { message: t("status.premium.statuses.past_due", { date }), tone: "warning" };
    }
    case "canceled": {
      const date = formatDate(sub.canceled_at ?? sub.cancel_at ?? sub.current_period_end, locale) ?? "--";
      return { message: t("status.premium.statuses.canceled", { date }), tone: "muted" };
    }
    case "incomplete":
      return { message: t("status.premium.statuses.incomplete"), tone: "warning" };
    case "incomplete_expired":
      return { message: t("status.premium.statuses.incomplete_expired"), tone: "warning" };
    case "unpaid":
      return { message: t("status.premium.statuses.unpaid"), tone: "danger" };
    case "paused":
      return { message: t("status.premium.statuses.paused"), tone: "warning" };
    case "":
      return { message: t("status.premium.statuses.inactive"), tone: "muted" };
    default:
      return { message: t("status.premium.statuses.default", { status }), tone: "muted" };
  }
}

function verificationStatusInfo(payment: PaymentRow | null, locale: SupportedLocale, t: Translator): StatusMessage {
  if (!payment) {
    return { message: t("status.verification.statuses.none"), tone: "muted" };
  }

  const status = (payment.status ?? "").toLowerCase();
  const paidAt = payment.paid_at ?? payment.created_at;
  const expiry = addYears(paidAt, 1);
  const formattedExpiry = expiry ? formatDate(expiry, locale) ?? "--" : "--";

  if (status === "paid" || status === "succeeded") {
    if (expiry && expiry.getTime() < Date.now()) {
      return { message: t("status.verification.statuses.expired", { date: formattedExpiry }), tone: "danger" };
    }
    return { message: t("status.verification.statuses.valid", { date: formattedExpiry }), tone: "success" };
  }

  if (["processing", "pending", "requires_action"].includes(status)) {
    return { message: t("status.verification.statuses.pending"), tone: "warning" };
  }

  if (["payment_failed", "requires_payment_method", "failed", "canceled"].includes(status)) {
    return { message: t("status.verification.statuses.failed"), tone: "danger" };
  }

  return { message: t("status.verification.statuses.pending"), tone: "warning" };
}

function paymentStatusTone(status: string | null | undefined): Tone {
  const normalized = (status ?? "").toLowerCase();
  if (normalized === "paid" || normalized === "succeeded") {
    return "success";
  }
  if (["processing", "pending", "requires_action"].includes(normalized)) {
    return "warning";
  }
  if (["payment_failed", "failed", "canceled", "requires_payment_method", "uncollectible"].includes(normalized)) {
    return "danger";
  }
  return "muted";
}

function planLabel(planCode: string | null | undefined, labels: Record<string, string>, fallback: string) {
  if (!planCode) return fallback;
  return labels[planCode] ?? fallback;
}

export default async function AccountBillingPage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams?: Record<string, string | string[] | undefined>;
}) {
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
  const t = await getTranslations({ locale, namespace: "account.billing" });

  const checkoutParamRaw = searchParams?.checkout;
  const checkoutParam = Array.isArray(checkoutParamRaw) ? checkoutParamRaw[0] : checkoutParamRaw;
  let checkoutAlert: { tone: "success" | "warning" | "error"; message: string } | null = null;

  if (checkoutParam === "success") {
    checkoutAlert = { tone: "success", message: t("alerts.success") };
  } else if (checkoutParam === "cancel") {
    checkoutAlert = { tone: "warning", message: t("alerts.cancel") };
  } else if (checkoutParam === "error") {
    checkoutAlert = { tone: "error", message: t("alerts.error") };
  }

  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("id, stripe_customer_id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const planCodes = [
    BILLING_PLAN_CODES.guidePremiumMonthly,
    BILLING_PLAN_CODES.guideVerificationAnnual,
  ];

  const { data: planRows } = await supabase
    .from("billing_plans")
    .select("plan_code, amount_cents, currency, interval")
    .in("plan_code", planCodes);

  let guideSubscriptions: SubscriptionRow[] = [];
  let recentPayments: PaymentRow[] = [];
  let latestVerification: PaymentRow | null = null;

  if (billingCustomer?.id) {
    const [subscriptionsResult, paymentsResult, verificationResult] = await Promise.all([
      supabase
        .from("subscriptions")
        .select("plan_code, status, current_period_end, cancel_at, canceled_at, updated_at")
        .eq("billing_customer_id", billingCustomer.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("payments")
        .select("id, amount_cents, currency, status, created_at, paid_at, plan_code")
        .eq("billing_customer_id", billingCustomer.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("payments")
        .select("id, amount_cents, currency, status, created_at, paid_at, plan_code")
        .eq("billing_customer_id", billingCustomer.id)
        .eq("plan_code", BILLING_PLAN_CODES.guideVerificationAnnual)
        .order("created_at", { ascending: false })
        .limit(1),
    ]);

    guideSubscriptions = subscriptionsResult.data ?? [];
    recentPayments = paymentsResult.data ?? [];
    latestVerification = verificationResult.data?.[0] ?? null;
  }

  const planMap = new Map<string, BillingPlanRow>();
  planRows?.forEach((plan) => {
    if (plan.plan_code) {
      planMap.set(plan.plan_code, plan);
    }
  });

  const premiumPlan = planMap.get(BILLING_PLAN_CODES.guidePremiumMonthly);
  const verificationPlan = planMap.get(BILLING_PLAN_CODES.guideVerificationAnnual);

  const premiumPriceLabel = premiumPlan?.amount_cents != null
    ? t("guide.pricing.premium", {
        amount: formatCurrency(
          premiumPlan.amount_cents,
          premiumPlan.currency ?? "EUR",
          locale
        ),
      })
    : null;

  const verificationPriceLabel = verificationPlan?.amount_cents != null
    ? t("guide.pricing.verification", {
        amount: formatCurrency(
          verificationPlan.amount_cents,
          verificationPlan.currency ?? "EUR",
          locale
        ),
      })
    : null;

  const premiumSubscription = guideSubscriptions.find(
    (sub) => sub.plan_code === BILLING_PLAN_CODES.guidePremiumMonthly
  ) ?? null;

  const premiumStatus = premiumStatusInfo(premiumSubscription, locale, t);
  const verificationStatus = verificationStatusInfo(latestVerification, locale, t);

  const planLabels = {
    [BILLING_PLAN_CODES.guidePremiumMonthly]: t("status.planLabels.guide_premium_monthly"),
    [BILLING_PLAN_CODES.guideVerificationAnnual]: t("status.planLabels.guide_verification_annual"),
  } as Record<string, string>;
  const defaultPlanLabel = t("status.planLabels.default");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t("title")}</h1>
        <p className="text-sm text-foreground/70 sm:text-base">{t("description")}</p>
      </header>

      {checkoutAlert ? (
        <div
          className={`rounded-[var(--radius-xl)] border px-4 py-3 text-sm shadow-sm ${alertClasses[checkoutAlert.tone]}`}
        >
          {checkoutAlert.message}
        </div>
      ) : null}

      <section className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-foreground">{t("guide.heading")}</h2>
          <p className="text-sm text-foreground/70">{t("guide.body")}</p>
          {(premiumPriceLabel || verificationPriceLabel) && (
            <ul className="space-y-1 text-xs text-foreground/60">
              {premiumPriceLabel ? <li>{premiumPriceLabel}</li> : null}
              {verificationPriceLabel ? <li>{verificationPriceLabel}</li> : null}
            </ul>
          )}
          <GuideBillingActions
            locale={locale}
            premiumAction={guidePremiumCheckoutAction}
            verificationAction={guideVerificationCheckoutAction}
            labels={{
              premiumCta: t("guide.actions.premium"),
              verificationCta: t("guide.actions.verification"),
              pending: t("guide.actions.pending"),
              errorPrefix: t("guide.actions.errorPrefix"),
            }}
          />
        </div>
        <div className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/60 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-foreground">{t("status.heading")}</h3>
          <div className="text-sm text-foreground/70">
            {billingCustomer ? (
              <p>{t("status.customer", { id: billingCustomer.stripe_customer_id })}</p>
            ) : (
              <p>{t("status.none")}</p>
            )}
          </div>

          <div className="space-y-3 border-t border-foreground/10 pt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/60">{t("status.planHeading")}</h4>
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{t("status.premium.title")}</p>
                <p className={toneClasses[premiumStatus.tone]}>{premiumStatus.message}</p>
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{t("status.verification.title")}</p>
                <p className={toneClasses[verificationStatus.tone]}>{verificationStatus.message}</p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold uppercase tracking-wide text-foreground/60">{t("status.recentPayments")}</h4>
            {recentPayments.length === 0 ? (
              <p className="text-xs text-foreground/50">{t("status.noPayments")}</p>
            ) : (
              <ul className="space-y-2 text-xs text-foreground/70">
                {recentPayments.map((payment) => {
                  const paymentDate =
                    formatDate(payment.created_at, locale) ?? new Date(payment.created_at).toLocaleDateString(locale);
                  return (
                    <li
                      key={payment.id}
                      className="flex flex-col gap-2 rounded-[var(--radius-lg)] border border-foreground/10 bg-white/40 px-3 py-2 shadow-sm md:flex-row md:items-center md:justify-between"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{paymentDate}</span>
                        <span className="text-foreground/60">
                          {planLabel(payment.plan_code, planLabels, defaultPlanLabel)}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm font-semibold text-foreground">
                        <span>{formatCurrency(payment.amount_cents, payment.currency ?? "EUR", locale)}</span>
                        <span className={`uppercase text-xs ${toneClasses[paymentStatusTone(payment.status)]}`}>
                          {payment.status}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
