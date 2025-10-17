"use server";

import { redirect } from "next/navigation";
import { defaultLocale, isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { BILLING_PLAN_CODES } from "@/lib/payments/plans";
import {
  createStripeCheckoutSession,
  createStripeCustomer,
  StripeConfigurationError,
} from "@/lib/payments/stripe";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export type CheckoutActionState = {
  ok: boolean;
  message?: string;
};

type CheckoutKind = "guide_premium" | "guide_verification";

async function getAuthenticatedProfile() {
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { error: "NOT_AUTHENTICATED" as const };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, locale")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile };
}

async function ensureBillingCustomer(params: {
  profileId: string;
  profileName?: string | null;
  email?: string | null;
}) {
  const service = getSupabaseServiceClient();

  const { data: existing } = await service
    .from("billing_customers")
    .select("id, stripe_customer_id")
    .eq("profile_id", params.profileId)
    .maybeSingle();

  if (existing) {
    return existing;
  }

  const stripeCustomer = await createStripeCustomer({
    email: params.email ?? undefined,
    name: params.profileName ?? params.email ?? undefined,
    metadata: {
      profile_id: params.profileId,
      source: "guide-validator",
    },
  });

  const { data: inserted, error } = await service
    .from("billing_customers")
    .insert({
      stripe_customer_id: stripeCustomer.id,
      profile_id: params.profileId,
      metadata: { source: "guide-validator", created_via: "app_action" },
    })
    .select("id, stripe_customer_id")
    .single();

  if (error || !inserted) {
    throw error ?? new Error("Unable to persist billing customer");
  }

  return inserted;
}

async function resolvePlan(planCode: string) {
  const service = getSupabaseServiceClient();
  const { data: plan, error } = await service
    .from("billing_plans")
    .select("plan_code, stripe_price_id, description")
    .eq("plan_code", planCode)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return plan;
}

function buildUrls(locale: SupportedLocale, path: string) {
  const normalized = isSupportedLocale(locale) ? locale : defaultLocale;
  return {
    successUrl: `${APP_URL}/${normalized}/${path}?checkout=success`,
    cancelUrl: `${APP_URL}/${normalized}/${path}?checkout=cancel`,
  };
}

async function handleCheckout(locale: string, kind: CheckoutKind): Promise<CheckoutActionState> {
  const { user, profile, error } = await getAuthenticatedProfile();
  if (error || !user) {
    return { ok: false, message: "NOT_AUTHENTICATED" };
  }

  try {
    const planCode =
      kind === "guide_premium"
        ? BILLING_PLAN_CODES.guidePremiumMonthly
        : BILLING_PLAN_CODES.guideVerificationAnnual;

    const plan = await resolvePlan(planCode);
    if (!plan?.stripe_price_id) {
      return { ok: false, message: "PLAN_NOT_CONFIGURED" };
    }

    const customer = await ensureBillingCustomer({
      profileId: user.id,
      profileName: profile?.full_name,
      email: user.email,
    });

    const userLocale = (profile?.locale as SupportedLocale) ?? (locale as SupportedLocale) ?? defaultLocale;
    const { successUrl, cancelUrl } = buildUrls(userLocale, kind === "guide_premium" ? "account/billing" : "account/verification");

    const session = await createStripeCheckoutSession({
      priceId: plan.stripe_price_id,
      mode: kind === "guide_premium" ? "subscription" : "payment",
      customerId: customer.stripe_customer_id,
      successUrl,
      cancelUrl,
      allowPromotionCodes: kind === "guide_premium",
      metadata: {
        plan_code: plan.plan_code,
        price_id: plan.stripe_price_id ?? "",
        profile_id: user.id,
        kind,
      },
    });

    redirect(session.url ?? successUrl);
  } catch (err) {
    if (err instanceof StripeConfigurationError) {
      return { ok: false, message: "STRIPE_NOT_CONFIGURED" };
    }

    console.error("handleCheckout", kind, err);
    return { ok: false, message: "CHECKOUT_FAILED" };
  }
}

export async function guidePremiumCheckoutAction(
  _prevState: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  const locale = String(formData.get("locale") ?? defaultLocale);
  return handleCheckout(locale, "guide_premium");
}

export async function guideVerificationCheckoutAction(
  _prevState: CheckoutActionState,
  formData: FormData
): Promise<CheckoutActionState> {
  const locale = String(formData.get("locale") ?? defaultLocale);
  return handleCheckout(locale, "guide_verification");
}

