import { NextResponse } from "next/server";
import type { StripeWebhookEvent } from "@/lib/payments/stripe";
import { verifyStripeSignature } from "@/lib/payments/stripe";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type StripeSubscription = {
  id: string;
  customer?: string | null;
  status?: string | null;
  items?: { data?: Array<{ price?: { id?: string | null } | null; plan?: { id?: string | null } | null } | null> } | null;
  current_period_start?: number | null;
  current_period_end?: number | null;
  cancel_at?: number | null;
  canceled_at?: number | null;
};

type StripeInvoice = {
  id: string;
  customer?: string | null;
  subscription?: string | null;
  payment_intent?: string | null;
  hosted_invoice_url?: string | null;
  invoice_pdf?: string | null;
  amount_paid?: number | null;
  total?: number | null;
  currency?: string | null;
  status?: string | null;
  status_transitions?: { paid_at?: number | null } | null;
  created?: number | null;
  lines?: { data?: Array<{ price?: { id?: string | null } | null; plan?: { id?: string | null } | null } | null> } | null;
  metadata?: Record<string, string | null | undefined> | null;
};

type StripeCheckoutSession = {
  id: string;
  customer?: string | null;
  mode?: string | null;
  payment_status?: string | null;
  payment_intent?: string | null;
  amount_total?: number | null;
  currency?: string | null;
  metadata?: Record<string, string | null | undefined> | null;
  created?: number | null;
};

type BillingCustomerRecord = {
  id: string;
  profile_id: string | null;
  organization_id: string | null;
};

const planCodeCache = new Map<string, string | null>();
const customerCache = new Map<string, BillingCustomerRecord | null>();

function toIsoTimestamp(value?: number | null): string | null {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return null;
  }
  return new Date(value * 1000).toISOString();
}

function firstPriceId(collection?: { data?: Array<{ price?: { id?: string | null } | null; plan?: { id?: string | null } | null } | null> | null }): string | null {
  const line = collection?.data?.find((entry) => !!entry);
  if (!line) {
    return null;
  }
  const fromPrice = line?.price?.id;
  const fromPlan = line?.plan?.id;
  const value = (typeof fromPrice === "string" && fromPrice) || (typeof fromPlan === "string" && fromPlan) || null;
  return value;
}

async function resolvePlanCode(priceId: string | null | undefined) {
  if (!priceId) {
    return null;
  }

  if (planCodeCache.has(priceId)) {
    return planCodeCache.get(priceId) ?? null;
  }

  const supabase = getSupabaseServiceClient();
  const { data: plan } = await supabase
    .from("billing_plans")
    .select("plan_code")
    .eq("stripe_price_id", priceId)
    .maybeSingle();

  const planCode = plan?.plan_code ?? null;
  planCodeCache.set(priceId, planCode);
  return planCode;
}

async function fetchBillingCustomer(stripeCustomerId: string | null | undefined) {
  if (!stripeCustomerId) {
    return null;
  }

  if (customerCache.has(stripeCustomerId)) {
    return customerCache.get(stripeCustomerId) ?? null;
  }

  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("billing_customers")
    .select("id, profile_id, organization_id")
    .eq("stripe_customer_id", stripeCustomerId)
    .maybeSingle();

  customerCache.set(stripeCustomerId, data ?? null);
  return data ?? null;
}

async function upsertSubscription(subscription: StripeSubscription) {
  if (!subscription?.id || !subscription.customer) {
    return;
  }

  const [planCode, billingCustomer] = await Promise.all([
    resolvePlanCode(firstPriceId(subscription.items ?? undefined)),
    fetchBillingCustomer(subscription.customer),
  ]);

  if (!billingCustomer || !planCode) {
    return;
  }

  const supabase = getSupabaseServiceClient();
  const payload = {
    stripe_subscription_id: subscription.id,
    plan_code: planCode,
    status: subscription.status ?? "unknown",
    current_period_start: toIsoTimestamp(subscription.current_period_start),
    current_period_end: toIsoTimestamp(subscription.current_period_end),
    cancel_at: toIsoTimestamp(subscription.cancel_at),
    canceled_at: toIsoTimestamp(subscription.canceled_at),
    billing_customer_id: billingCustomer.id,
    organization_id: billingCustomer.organization_id,
    profile_id: billingCustomer.profile_id,
  };

  const { error } = await supabase
    .from("subscriptions")
    .upsert(payload, { onConflict: "stripe_subscription_id" });

  if (error) {
    throw error;
  }
}

async function resolveSubscriptionId(stripeSubscriptionId: string | null | undefined) {
  if (!stripeSubscriptionId) {
    return null;
  }
  const supabase = getSupabaseServiceClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", stripeSubscriptionId)
    .maybeSingle();
  return data?.id ?? null;
}

async function upsertInvoicePayment(invoice: StripeInvoice) {
  if (!invoice?.id || !invoice.customer) {
    return;
  }

  const billingCustomer = await fetchBillingCustomer(invoice.customer);
  if (!billingCustomer) {
    return;
  }

  const priceId = firstPriceId(invoice.lines ?? undefined);
  const [planCode, subscriptionId] = await Promise.all([
    resolvePlanCode(priceId),
    resolveSubscriptionId(invoice.subscription ?? undefined),
  ]);

  const paymentIntentId = typeof invoice.payment_intent === "string" ? invoice.payment_intent : null;
  const amountCents = typeof invoice.total === "number" ? invoice.total : invoice.amount_paid ?? null;
  const status = invoice.status ?? "unknown";
  const paidAt =
    status === "paid"
      ? toIsoTimestamp(invoice.status_transitions?.paid_at ?? invoice.created)
      : null;

  const supabase = getSupabaseServiceClient();
  const payload = {
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: paymentIntentId,
    plan_code: planCode ?? null,
    amount_cents: amountCents,
    currency: invoice.currency?.toUpperCase() ?? "EUR",
    status,
    paid_at: paidAt,
    invoice_url: invoice.hosted_invoice_url ?? invoice.invoice_pdf ?? null,
    subscription_id: subscriptionId,
    billing_customer_id: billingCustomer.id,
    organization_id: billingCustomer.organization_id,
    profile_id: billingCustomer.profile_id,
  };

  const { error } = await supabase
    .from("payments")
    .upsert(payload, { onConflict: "stripe_invoice_id" });

  if (error) {
    throw error;
  }
}

async function recordOneTimeCheckout(session: StripeCheckoutSession) {
  if (!session?.id || !session.customer || session.mode !== "payment") {
    return;
  }

  const paymentIntentId = typeof session.payment_intent === "string" ? session.payment_intent : null;
  if (!paymentIntentId) {
    return;
  }

  const billingCustomer = await fetchBillingCustomer(session.customer);
  if (!billingCustomer) {
    return;
  }

  let planCode = session.metadata?.plan_code ?? null;
  if (!planCode) {
    planCode = await resolvePlanCode(session.metadata?.price_id ?? null);
  }

  const supabase = getSupabaseServiceClient();
  const payload = {
    stripe_payment_intent_id: paymentIntentId,
    plan_code: planCode,
    amount_cents: session.amount_total ?? null,
    currency: session.currency?.toUpperCase() ?? "EUR",
    status: session.payment_status ?? "unknown",
    paid_at: session.payment_status === "paid" ? toIsoTimestamp(session.created) : null,
    invoice_url: null,
    subscription_id: null,
    billing_customer_id: billingCustomer.id,
    organization_id: billingCustomer.organization_id,
    profile_id: billingCustomer.profile_id,
  };

  const { error } = await supabase
    .from("payments")
    .upsert(payload, { onConflict: "stripe_payment_intent_id" });

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook secret not configured" }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  const payload = await request.text();

  const isValid = verifyStripeSignature(payload, signature, webhookSecret);
  if (!isValid) {
    return NextResponse.json({ error: "Invalid Stripe signature" }, { status: 400 });
  }

  let event: StripeWebhookEvent;
  try {
    event = JSON.parse(payload) as StripeWebhookEvent;
  } catch (error) {
    return NextResponse.json({ error: "Unable to parse webhook payload" }, { status: 400 });
  }

  const supabase = getSupabaseServiceClient();
  const { error } = await supabase
    .from("billing_events")
    .upsert(
      {
        stripe_event_id: event.id,
        type: event.type,
        payload: event as unknown as Record<string, unknown>,
      },
      { onConflict: "stripe_event_id" }
    );

  if (error) {
    console.error("Failed to persist Stripe event", error);
    return NextResponse.json({ error: "Failed to persist event" }, { status: 500 });
  }

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await upsertSubscription(event.data?.object as StripeSubscription);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        await upsertInvoicePayment(event.data?.object as StripeInvoice);
        break;
      }
      case "checkout.session.completed": {
        await recordOneTimeCheckout(event.data?.object as StripeCheckoutSession);
        break;
      }
      default:
        break;
    }
  } catch (processingError) {
    console.error("Stripe webhook processing failed", event.type, processingError);
    return NextResponse.json({ error: "Failed to process event" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

