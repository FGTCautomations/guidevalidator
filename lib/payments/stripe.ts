import { createHmac, timingSafeEqual } from "node:crypto";

const STRIPE_API_BASE = "https://api.stripe.com/v1";

export class StripeConfigurationError extends Error {}

function getStripeSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new StripeConfigurationError("STRIPE_SECRET_KEY is not configured");
  }
  return key;
}

function buildFormBody(input: Record<string, string | number | boolean | undefined | null>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined || value === null) continue;
    params.append(key, String(value));
  }
  return params;
}

async function stripeRequest<T>(path: string, init: {
  method?: "GET" | "POST" | "DELETE";
  body?: Record<string, string | number | boolean | undefined | null> | URLSearchParams;
} = {}): Promise<T> {
  const secret = getStripeSecretKey();
  const { method = "GET" } = init;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${secret}`,
  };

  let body: URLSearchParams | undefined;
  if (init.body instanceof URLSearchParams) {
    body = init.body;
  } else if (init.body) {
    body = buildFormBody(init.body);
  }

  if (body) {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
  }

  const response = await fetch(`${STRIPE_API_BASE}${path}`, {
    method,
    headers,
    body: body ? body.toString() : undefined,
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Stripe request failed (${response.status}): ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch (error) {
    throw new Error(`Unable to parse Stripe response JSON: ${text}`);
  }
}

export type StripeCustomerPayload = {
  email?: string;
  name?: string;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

function normaliseMetadata(metadata: StripeCustomerPayload["metadata"]): Record<string, string | number | boolean> {
  return Object.entries(metadata ?? {}).reduce<Record<string, string | number | boolean>>((acc, [key, value]) => {
    if (value === undefined || value === null) return acc;
    acc[`metadata[${key}]`] = value;
    return acc;
  }, {});
}

export async function createStripeCustomer(payload: StripeCustomerPayload) {
  return stripeRequest<{ id: string }>("/customers", {
    method: "POST",
    body: {
      email: payload.email,
      name: payload.name,
      ...normaliseMetadata(payload.metadata),
    },
  });
}

export async function updateStripeCustomer(customerId: string, payload: StripeCustomerPayload) {
  return stripeRequest<{ id: string }>(`/customers/${customerId}`, {
    method: "POST",
    body: {
      email: payload.email,
      name: payload.name,
      ...normaliseMetadata(payload.metadata),
    },
  });
}

export async function createBillingPortalSession(params: { customerId: string; returnUrl: string }) {
  return stripeRequest<{ url: string }>("/billing_portal/sessions", {
    method: "POST",
    body: {
      customer: params.customerId,
      return_url: params.returnUrl,
    },
  });
}

export async function createCheckoutSession(body: Record<string, string | number | boolean | undefined | null>) {
  return stripeRequest<{ id: string; url?: string }>("/checkout/sessions", {
    method: "POST",
    body,
  });
}

export type CheckoutSessionParams = {
  priceId: string;
  mode: "subscription" | "payment";
  successUrl: string;
  cancelUrl: string;
  customerId?: string;
  allowPromotionCodes?: boolean;
  metadata?: Record<string, string | number | boolean | null | undefined>;
};

export async function createStripeCheckoutSession(params: CheckoutSessionParams) {
  const body: Record<string, string | number | boolean | undefined | null> = {
    mode: params.mode,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    "line_items[0][price]": params.priceId,
    "line_items[0][quantity]": 1,
    customer: params.customerId,
    allow_promotion_codes: params.allowPromotionCodes ? "true" : undefined,
    ...normaliseMetadata(params.metadata),
  };

  return createCheckoutSession(body);
}

export type StripeWebhookEvent = {
  id: string;
  type: string;
  data?: { object?: Record<string, unknown> };
};

export function verifyStripeSignature(payload: string, signatureHeader: string | null, webhookSecret: string, toleranceSeconds = 300): boolean {
  if (!signatureHeader || !webhookSecret) {
    return false;
  }

  const parts = signatureHeader.split(",").reduce<Record<string, string>>((acc, part) => {
    const [key, value] = part.split("=");
    if (key && value) {
      acc[key.trim()] = value.trim();
    }
    return acc;
  }, {});

  const timestampRaw = parts["t"];
  const signature = parts["v1"];

  if (!timestampRaw || !signature) {
    return false;
  }

  const timestamp = Number(timestampRaw);
  if (!Number.isFinite(timestamp)) {
    return false;
  }

  const toleranceMs = toleranceSeconds * 1000;
  const age = Math.abs(Date.now() - timestamp * 1000);
  if (age > toleranceMs) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = createHmac("sha256", webhookSecret).update(signedPayload, "utf8").digest("hex");

  try {
    return timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}