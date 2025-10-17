export const BILLING_PLAN_CODES = {
  agentOnboardingFee: "agent_onboarding_fee",
  agentMonthlySubscription: "agent_monthly_subscription",
  dmcOnboardingFee: "dmc_onboarding_fee",
  dmcMonthlySubscription: "dmc_monthly_subscription",
  guidePremiumMonthly: "guide_premium_monthly",
  guideVerificationAnnual: "guide_verification_annual",
} as const;

export type BillingPlanCode = (typeof BILLING_PLAN_CODES)[keyof typeof BILLING_PLAN_CODES];

export const GUIDE_PLAN_CODES: BillingPlanCode[] = [
  BILLING_PLAN_CODES.guidePremiumMonthly,
  BILLING_PLAN_CODES.guideVerificationAnnual,
];

export const AGENCY_PLAN_CODES: BillingPlanCode[] = [
  BILLING_PLAN_CODES.agentOnboardingFee,
  BILLING_PLAN_CODES.agentMonthlySubscription,
];

export const DMC_PLAN_CODES: BillingPlanCode[] = [
  BILLING_PLAN_CODES.dmcOnboardingFee,
  BILLING_PLAN_CODES.dmcMonthlySubscription,
];

export function isGuidePlan(planCode: string): planCode is BillingPlanCode {
  return GUIDE_PLAN_CODES.includes(planCode as BillingPlanCode);
}

export function isAgencyPlan(planCode: string): planCode is BillingPlanCode {
  return AGENCY_PLAN_CODES.includes(planCode as BillingPlanCode);
}

export function isDmcPlan(planCode: string): planCode is BillingPlanCode {
  return DMC_PLAN_CODES.includes(planCode as BillingPlanCode);
}
