import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Check if user has completed their profile onboarding
 */
export async function hasCompletedOnboarding(userId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarded")
    .eq("id", userId)
    .single();

  return profile?.onboarded === true;
}

/**
 * Check if user has an active subscription (for roles that require payment)
 */
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  // Get user's billing customer
  const { data: billingCustomer } = await supabase
    .from("billing_customers")
    .select("id")
    .eq("profile_id", userId)
    .maybeSingle();

  if (!billingCustomer) {
    return false;
  }

  // Check for active subscription
  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("billing_customer_id", billingCustomer.id)
    .in("status", ["active", "trialing"])
    .maybeSingle();

  return subscription !== null;
}

/**
 * Get user's role from profile
 */
export async function getUserRole(userId: string): Promise<string | null> {
  const supabase = getSupabaseServerClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  return profile?.role ?? null;
}

/**
 * Check if role requires subscription payment
 */
export function roleRequiresSubscription(role: string | null): boolean {
  if (!role) return false;
  return ["agency", "dmc"].includes(role);
}

/**
 * Get onboarding status for a user
 */
export async function getOnboardingStatus(userId: string): Promise<{
  profileComplete: boolean;
  subscriptionActive: boolean;
  requiresSubscription: boolean;
  canAccessPlatform: boolean;
}> {
  const [profileComplete, role] = await Promise.all([
    hasCompletedOnboarding(userId),
    getUserRole(userId),
  ]);

  const requiresSubscription = roleRequiresSubscription(role);
  const subscriptionActive = requiresSubscription
    ? await hasActiveSubscription(userId)
    : true; // If no subscription required, consider it "active"

  const canAccessPlatform = profileComplete && subscriptionActive;

  return {
    profileComplete,
    subscriptionActive,
    requiresSubscription,
    canAccessPlatform,
  };
}