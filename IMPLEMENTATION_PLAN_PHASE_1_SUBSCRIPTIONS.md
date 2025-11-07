# Phase 1: Subscription & Payment System - Complete Implementation Plan

## Overview

**Goal**: Make subscription management, onboarding, and payments fully functional for all user types (Guides, Agencies, DMCs, Transport).

**Timeline**: 6-8 weeks
**Priority**: CRITICAL - Core revenue functionality

---

## Current State Analysis

### ✅ What Exists

1. **Database Schema**
   - `billing_plans` table with plan codes and Stripe IDs
   - `billing_customers` table linking Stripe customers to profiles/orgs
   - `subscriptions` table tracking active subscriptions
   - `payments` table recording payment history
   - `billing_events` table for webhook event logging

2. **Stripe Integration**
   - Basic Stripe API wrapper (`lib/payments/stripe.ts`)
   - Webhook handler for events (`app/api/webhooks/stripe/route.ts`)
   - Checkout session creation
   - Customer management

3. **Pricing Page**
   - All plans displayed with pricing
   - Links to sign-up with plan pre-selected

4. **Billing Dashboard**
   - View subscription status
   - View payment history
   - Buttons to purchase premium/verification

### ❌ What's Missing/Broken

1. **No Stripe Price IDs in Database**
   - `billing_plans` table likely empty or missing Stripe price IDs
   - Need to populate with actual Stripe products/prices

2. **Incomplete Webhook Handling**
   - Webhooks may not properly update subscription status
   - No handling for failed payments, cancellations, renewals

3. **No Onboarding → Payment Flow**
   - Users sign up but aren't prompted to complete payment
   - No trial period management
   - No grace period for expired subscriptions

4. **Missing Subscription Enforcement**
   - No checks to verify user has active subscription before accessing features
   - Free users can access paid features

5. **No Subscription Management UI**
   - Can't upgrade/downgrade plans
   - Can't cancel subscriptions
   - Can't update payment methods
   - No Stripe Customer Portal integration

6. **Incomplete Data Migration**
   - Existing users may not have billing_customer records
   - Profiles may be missing subscription data

---

## Phase 1.1: Database & Stripe Setup (Week 1-2)

### Task 1.1.1: Create Stripe Products & Prices

**Action**: Create all products and prices in Stripe Dashboard

**Products to Create:**

```
GUIDES:
├── Guide Free (Product: guide-free)
│   └── Price: Free (no Stripe price needed)
├── Guide Premium (Product: guide-premium)
│   └── Price: €9.99/month (Recurring)
└── Guide Verification (Product: guide-verification)
    └── Price: €40/year (Recurring)

AGENCIES:
├── Agency Basic (Product: agency-basic)
│   └── Price: €99/month (Recurring)
└── Agency Pro (Product: agency-pro)
    └── Price: €199/month (Recurring)

DMCs:
├── DMC Regional (Product: dmc-core)
│   └── Price: €199/month (Recurring)
├── DMC Multi-market (Product: dmc-multimarket)
│   └── Price: €299/month (Recurring)
└── DMC Enterprise (Product: dmc-enterprise)
    └── Price: Custom (Contact sales)

TRANSPORT:
├── Transport Fleet (Product: transport-subscription)
│   └── Price: €49/month (Recurring)
├── Transport Verified (Product: transport-verified)
│   └── Price: €40/year (Recurring)
└── Transport Growth (Product: transport-growth)
    └── Price: €79/month (Recurring)
```

**Stripe Dashboard Steps:**
1. Go to Products → Create Product
2. For each product above:
   - Name: [Product Name]
   - Description: [From pricing page]
   - Create recurring price with specified amount
   - Save price ID

### Task 1.1.2: Populate `billing_plans` Table

**Script to Create**: `scripts/populate-billing-plans.ts`

```typescript
import { getSupabaseServiceClient } from '@/lib/supabase/service';

const PLANS = [
  {
    plan_code: 'guide-free',
    stripe_product_id: null,
    stripe_price_id: null,
    amount_cents: 0,
    currency: 'EUR',
    interval: 'one_time',
    target_role: 'guide',
    description: 'Free guide profile',
    is_active: true,
  },
  {
    plan_code: 'guide-premium',
    stripe_product_id: 'prod_xxx', // Replace with actual ID
    stripe_price_id: 'price_xxx', // Replace with actual ID
    amount_cents: 999,
    currency: 'EUR',
    interval: 'month',
    target_role: 'guide',
    description: 'Premium guide profile',
    is_active: true,
  },
  // ... add all other plans
];

async function populatePlans() {
  const supabase = getSupabaseServiceClient();

  for (const plan of PLANS) {
    const { error } = await supabase
      .from('billing_plans')
      .upsert(plan, { onConflict: 'plan_code' });

    if (error) {
      console.error(`Failed to insert ${plan.plan_code}:`, error);
    } else {
      console.log(`✓ ${plan.plan_code} inserted`);
    }
  }
}

populatePlans();
```

**Run**:
```bash
npx tsx scripts/populate-billing-plans.ts
```

### Task 1.1.3: Set Up Stripe Webhook

**Action**: Configure webhook endpoint in Stripe Dashboard

1. Go to Developers → Webhooks → Add endpoint
2. Endpoint URL: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy webhook signing secret
5. Add to `.env.local`:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Task 1.1.4: Update Webhook Handler

**File**: `app/api/webhooks/stripe/route.ts`

**Improvements Needed**:
- Add better error handling
- Add logging for all events
- Handle subscription status updates properly
- Handle failed payments
- Send email notifications

**Changes**:
```typescript
// Add event handlers for:
- checkout.session.completed → Create billing_customer + subscription
- customer.subscription.updated → Update subscription status
- customer.subscription.deleted → Mark subscription as canceled
- invoice.payment_failed → Send email, mark payment as failed
- invoice.paid → Update payment record, extend subscription
```

---

## Phase 1.2: Onboarding & Payment Flow (Week 3-4)

### Task 1.2.1: Create Post-Sign-Up Flow

**Current Problem**: After sign-up → check email → verify → nothing happens

**New Flow**:
```
Sign Up → Email Verification → Admin Approval → Welcome Email with:
  ├── Profile completion link (if bulk upload OR all users)
  ├── Payment/subscription setup link (if paid plan)
  └── Dashboard access
```

### Task 1.2.2: Welcome Email with Payment Link

**File to Create**: `lib/email/templates/welcome-approved.ts`

```typescript
export function generateWelcomeEmail(user: User, plan: string) {
  const paymentRequired = plan !== 'guide-free';

  return {
    subject: 'Welcome to Guide Validator - Your Account is Approved!',
    html: `
      <h1>Welcome ${user.full_name}!</h1>
      <p>Your application has been approved. Here's what to do next:</p>

      <ol>
        <li><a href="${profileCompletionLink}">Complete your profile</a></li>
        ${paymentRequired ? `
          <li><a href="${checkoutLink}">Set up your subscription (${plan})</a></li>
        ` : ''}
        <li><a href="${dashboardLink}">Access your dashboard</a></li>
      </ol>

      ${paymentRequired ? `
        <p><strong>Note:</strong> You have 7 days to complete payment before your account is paused.</p>
      ` : ''}
    `
  };
}
```

### Task 1.2.3: Create Checkout Flow

**File to Create**: `app/[locale]/checkout/[plan]/page.tsx`

```typescript
export default async function CheckoutPage({ params }: { params: { plan: string } }) {
  // 1. Verify user is logged in
  // 2. Get plan details from database
  // 3. Create or get Stripe customer
  // 4. Create checkout session
  // 5. Redirect to Stripe Checkout
}
```

**API Route**: `app/api/checkout/create-session/route.ts`

```typescript
export async function POST(request: Request) {
  const { planCode } = await request.json();
  const user = await getUser();

  // 1. Get or create billing_customer
  // 2. Get plan from billing_plans
  // 3. Create Stripe checkout session
  // 4. Return session ID
}
```

### Task 1.2.4: Add Subscription Status to Profile

**Database Migration**: Add subscription status fields to profiles

```sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS subscription_plan_code TEXT,
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMPTZ;

CREATE INDEX idx_profiles_subscription_status ON profiles(subscription_status);
```

### Task 1.2.5: Create Subscription Middleware

**File**: `lib/middleware/subscription-check.ts`

```typescript
export async function requireActiveSubscription(userId: string, minPlan: string) {
  const supabase = getSupabaseServiceClient();

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_plan_code, grace_period_until')
    .eq('id', userId)
    .single();

  if (profile.subscription_status === 'active') {
    return true;
  }

  // Check grace period
  if (profile.grace_period_until && new Date(profile.grace_period_until) > new Date()) {
    return true;
  }

  return false;
}
```

---

## Phase 1.3: Subscription Management UI (Week 5-6)

### Task 1.3.1: Upgrade/Downgrade Flow

**Page**: `app/[locale]/account/billing/change-plan/page.tsx`

**Features**:
- Show current plan
- List available upgrade/downgrade options
- Show proration details
- Confirm change button

### Task 1.3.2: Cancel Subscription Flow

**Component**: `components/account/cancel-subscription-dialog.tsx`

**Features**:
- Warning about losing access
- Confirm cancellation
- Option to cancel immediately or at period end
- Feedback form (optional)

### Task 1.3.3: Update Payment Method

**Integration**: Stripe Customer Portal

**File**: `app/[locale]/account/billing/manage/page.tsx`

```typescript
export default async function ManageBillingPage() {
  // Create Stripe Customer Portal session
  // Redirect user to Stripe portal for:
  // - Update payment method
  // - View invoices
  // - Download receipts
}
```

### Task 1.3.4: Trial Period Management

**Database Addition**:
```sql
ALTER TABLE subscriptions
  ADD COLUMN IF NOT EXISTS trial_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_end TIMESTAMPTZ;
```

**Logic**:
- New paid sign-ups get 14-day trial
- Trial ends → automatic first charge
- Email 3 days before trial ends

---

## Phase 1.4: Data Integrity & Migration (Week 7)

### Task 1.4.1: Audit Existing Users

**Script**: `scripts/audit-user-subscriptions.ts`

```typescript
// Check for users who:
// 1. Signed up for paid plan but have no billing_customer
// 2. Have expired subscriptions but still have access
// 3. Have billing_customer but no subscription record
// 4. Have mismatched data between profiles and subscriptions
```

### Task 1.4.2: Create Missing Billing Records

**Script**: `scripts/create-missing-billing-customers.ts`

```typescript
// For each user with:
// - No billing_customer BUT selected a paid plan
// Create billing_customer record
// Send "Complete Payment" email
```

### Task 1.4.3: Enforce Subscription Rules

**Add RLS Policies** or **API-level checks**:

```sql
-- Example: Guides can only post if they have premium
CREATE POLICY "Premium guides can post jobs"
ON jobs FOR INSERT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM profiles
    WHERE role = 'guide'
    AND subscription_status = 'active'
    AND subscription_plan_code = 'guide-premium'
  )
);
```

---

## Phase 1.5: Testing & Validation (Week 8)

### Task 1.5.1: End-to-End Testing

**Test Cases**:
1. ✅ Sign up for free plan → no payment required → profile works
2. ✅ Sign up for paid plan → redirect to checkout → complete payment → subscription activates
3. ✅ Trial period starts → 14 days → email reminder → auto-charge → subscription continues
4. ✅ Payment fails → email sent → grace period starts → retry payment
5. ✅ Upgrade plan → immediate upgrade → proration applied → invoice sent
6. ✅ Downgrade plan → change at period end → confirmation email
7. ✅ Cancel subscription → access until period end → account paused
8. ✅ Renew after cancellation → reactivate → access restored

### Task 1.5.2: Webhook Testing

**Use Stripe CLI**:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
stripe trigger checkout.session.completed
stripe trigger customer.subscription.updated
stripe trigger invoice.payment_failed
```

### Task 1.5.3: Edge Case Testing

- User cancels during trial
- User updates payment method mid-cycle
- User downgrades then immediately upgrades
- Subscription expires during active use
- Multiple subscriptions for same user (should block)

---

## Deliverables

### Week 1-2: Setup Complete
- ✅ Stripe products/prices created
- ✅ `billing_plans` populated
- ✅ Webhook endpoint configured
- ✅ Webhook handler improved

### Week 3-4: Payment Flow Complete
- ✅ Post-approval email with payment link
- ✅ Checkout page created
- ✅ Subscription status in profiles
- ✅ Middleware for subscription checks

### Week 5-6: Management UI Complete
- ✅ Plan change flow
- ✅ Cancellation flow
- ✅ Stripe Customer Portal integration
- ✅ Trial management

### Week 7: Data Clean
- ✅ Existing users audited
- ✅ Missing records created
- ✅ Subscription rules enforced

### Week 8: Tested & Ready
- ✅ All test cases passing
- ✅ Webhook events handled correctly
- ✅ Documentation complete

---

## Success Metrics

After Phase 1 completion:

1. **100% of new sign-ups** have correct billing records
2. **0 users** can access paid features without subscription
3. **All webhook events** are handled without errors
4. **Email notifications** sent for all subscription events
5. **Payment flow** works end-to-end with 0 manual intervention
6. **Subscription management** UI fully functional

---

## Files to Create/Modify

### New Files (25)
```
scripts/populate-billing-plans.ts
scripts/audit-user-subscriptions.ts
scripts/create-missing-billing-customers.ts
lib/email/templates/welcome-approved.ts
lib/email/templates/payment-reminder.ts
lib/email/templates/payment-failed.ts
lib/email/templates/trial-ending.ts
lib/middleware/subscription-check.ts
lib/payments/checkout.ts
app/[locale]/checkout/[plan]/page.tsx
app/api/checkout/create-session/route.ts
app/api/checkout/success/route.ts
app/[locale]/account/billing/change-plan/page.tsx
app/[locale]/account/billing/manage/page.tsx
components/account/cancel-subscription-dialog.tsx
components/account/plan-selector.tsx
components/account/subscription-status-badge.tsx
supabase/migrations/XXXXXX_add_subscription_fields_to_profiles.sql
supabase/migrations/XXXXXX_add_trial_fields_to_subscriptions.sql
```

### Modified Files (8)
```
app/api/webhooks/stripe/route.ts
app/[locale]/account/billing/page.tsx
app/[locale]/admin/applications/page.tsx (send welcome email on approval)
lib/payments/stripe.ts (add customer portal methods)
app/[locale]/pricing/page.tsx (update links to checkout)
.env.local (add STRIPE_WEBHOOK_SECRET)
```

---

## Next Steps After Phase 1

Once subscriptions/payments are solid, move to:
- **Phase 2**: Complete Onboarding Flow (profile completion, data validation)
- **Phase 3**: Feature Access Control (job applications, messaging limits, etc.)
