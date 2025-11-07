import { subDays } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type AdminMetricSummary = {
  totalUsers: number;
  newUsers7d: number;
  totalIncomeCents: number;
  activeSubscriptions: number;
};

export type AdminUserSummary = {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  verified: boolean;
  licenseVerified: boolean;
  createdAt: string;
  organizationName?: string | null;
  organizationType?: string | null;
  isFrozen?: boolean;
  rejectionReason?: string | null;
};

export type AdminDashboardData = {
  metrics: AdminMetricSummary;
  users: AdminUserSummary[];
  pendingApplicationsCount: number;
};

export type AdminUserDetail = {
  id: string;
  email: string | null;
  isFrozen: boolean;
  profile: {
    fullName: string | null;
    role: string;
    verified: boolean;
    licenseVerified: boolean;
    locale: string;
    countryCode: string | null;
    timezone: string | null;
    createdAt: string;
    languages?: string[];
    specialties?: string[];
    organizationId: string | null;
    organizationName: string | null;
    organizationType: string | null;
    applicationStatus: string | null;
    applicationSubmittedAt: string | null;
    applicationReviewedAt: string | null;
    rejectionReason: string | null;
  };
  applicationData: any | null;
  guideData: any | null;
  agencyData: any | null;
  subscriptions: Array<{
    id: string;
    planCode: string | null;
    status: string;
    currentPeriodEnd: string | null;
    cancelAt: string | null;
    canceledAt: string | null;
    createdAt: string;
  }>;
  payments: Array<{
    id: string;
    planCode: string | null;
    amountCents: number | null;
    currency: string | null;
    status: string;
    paidAt: string | null;
    createdAt: string;
  }>;
  totalIncomeCents: number;
};

const PAID_STATUSES = ["paid", "succeeded"];
const ACTIVE_SUBSCRIPTION_STATUSES = ["active", "trialing", "past_due"];
export const ADMIN_ALLOWED_ROLES = ["super_admin", "admin", "agency", "dmc", "transport", "guide"] as const;

function sumPaymentsCents(payments: Array<{ amount_cents?: number | null; status?: string | null }>) {
  return payments.reduce((acc, payment) => {
    if (!payment || typeof payment.amount_cents !== "number") {
      return acc;
    }
    if (!payment.status || !PAID_STATUSES.includes(payment.status)) {
      return acc;
    }
    return acc + payment.amount_cents;
  }, 0);
}

export async function fetchAdminDashboardData(): Promise<AdminDashboardData> {
  const supabase = getSupabaseServerClient();
  const sevenDaysAgoIso = subDays(new Date(), 7).toISOString();

  const [
    totalUsersQuery,
    newUsersQuery,
    activeSubscriptionsQuery,
    paymentsQuery,
    profilesQuery,
    guidePendingQuery,
    agencyPendingQuery,
    dmcPendingQuery,
    transportPendingQuery,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgoIso),
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .in("status", ACTIVE_SUBSCRIPTION_STATUSES),
    supabase
      .from("payments")
      .select("amount_cents, status")
      .in("status", PAID_STATUSES),
    supabase
      .from("profiles")
      .select(
        "id, full_name, role, verified, license_verified, created_at, organization_id, rejection_reason, agencies!organization_id (id, name, type, verified)"
      )
      .order("created_at", { ascending: false }),
    supabase.from("guide_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("agency_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("dmc_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("transport_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const totalUsers = totalUsersQuery.count ?? 0;
  const newUsers7d = newUsersQuery.count ?? 0;
  const activeSubscriptions = activeSubscriptionsQuery.count ?? 0;
  const totalIncomeCents = paymentsQuery.data ? sumPaymentsCents(paymentsQuery.data) : 0;

  const pendingApplicationsCount =
    (guidePendingQuery.count ?? 0) +
    (agencyPendingQuery.count ?? 0) +
    (dmcPendingQuery.count ?? 0) +
    (transportPendingQuery.count ?? 0);

  const service = getSupabaseServiceClient();
  const emailMap = new Map<string, string | null>();
  const frozenMap = new Map<string, boolean>();
  let page = 1;
  const perPage = 200;
  while (page <= 3) {
    const { data, error } = await service.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error("Failed to list auth users", error);
      break;
    }
    data.users.forEach((user) => {
      emailMap.set(user.id, user.email ?? null);
      // Check if user is frozen (banned)
      const bannedUntil = (user as any).banned_until;
      frozenMap.set(
        user.id,
        bannedUntil ? new Date(bannedUntil) > new Date() : false
      );
    });
    if (data.users.length < perPage) {
      break;
    }
    page += 1;
  }

  const users: AdminUserSummary[] = (profilesQuery.data ?? []).map((row: any) => {
    // For organization users (agency, dmc, transport), check if organization has verified field
    // Otherwise use profile verified field (for guides and other users)
    const isOrgUser = ["agency", "dmc", "transport"].includes(row.role);
    const agency = row.agencies;
    const orgVerified = agency?.verified;
    const verified = isOrgUser && orgVerified !== undefined ? Boolean(orgVerified) : Boolean(row.verified);

    return {
      id: row.id,
      name: row.full_name ?? null,
      email: emailMap.get(row.id) ?? null,
      role: row.role,
      verified,
      licenseVerified: Boolean(row.license_verified),
      createdAt: row.created_at,
      organizationName: agency?.name ?? null,
      organizationType: agency?.type ?? null,
      isFrozen: frozenMap.get(row.id) || row.rejection_reason?.startsWith("FROZEN:") || false,
      rejectionReason: row.rejection_reason ?? null,
    };
  });

  return {
    metrics: {
      totalUsers,
      newUsers7d,
      totalIncomeCents,
      activeSubscriptions,
    },
    users,
    pendingApplicationsCount,
  };
}

export async function fetchAdminUserDetail(userId: string): Promise<AdminUserDetail | null> {
  const supabase = getSupabaseServerClient();

  const profileQuery = await supabase
    .from("profiles")
    .select(
      "id, full_name, role, verified, license_verified, locale, country_code, timezone, created_at, organization_id, application_status, application_submitted_at, application_reviewed_at, rejection_reason, organization:organization_id (id, name, type)"
    )
    .eq("id", userId)
    .maybeSingle();

  if (profileQuery.error) {
    console.error("Failed to fetch admin user profile", profileQuery.error);
    return null;
  }

  const profile = profileQuery.data as any;
  if (!profile) {
    return null;
  }

  // Fetch guide data if user is a guide
  let guideData = null;
  if (profile.role === "guide") {
    const guideQuery = await supabase
      .from("guides")
      .select("*")
      .eq("profile_id", userId)
      .maybeSingle();
    guideData = guideQuery.data;
  }

  // Fetch agency data if user has organization
  let agencyData = null;
  if (profile.organization_id) {
    const agencyQuery = await supabase
      .from("agencies")
      .select("*")
      .eq("id", profile.organization_id)
      .maybeSingle();
    agencyData = agencyQuery.data;
  }

  const orFilters: string[] = [`profile_id.eq.${userId}`];
  if (profile.organization_id) {
    orFilters.push(`organization_id.eq.${profile.organization_id}`);
  }
  const orClause = orFilters.join(",");

  const [subscriptionsQuery, paymentsQuery] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id, plan_code, status, current_period_end, cancel_at, canceled_at, created_at")
      .or(orClause)
      .order("created_at", { ascending: false }),
    supabase
      .from("payments")
      .select("id, plan_code, amount_cents, currency, status, paid_at, created_at")
      .or(orClause)
      .order("created_at", { ascending: false }),
  ]);

  const service = getSupabaseServiceClient();
  let email: string | null = null;
  let isFrozen = false;
  try {
    const { data } = await service.auth.admin.getUserById(userId);
    email = data?.user?.email ?? null;
    // Check if user is banned (frozen)
    const bannedUntil = (data?.user as any)?.banned_until;
    isFrozen = bannedUntil ? new Date(bannedUntil) > new Date() : false;
  } catch (error) {
    console.error("Unable to fetch admin user email", error);
  }

  const subscriptions = (subscriptionsQuery.data ?? []).map((row: any) => ({
    id: row.id,
    planCode: row.plan_code,
    status: row.status,
    currentPeriodEnd: row.current_period_end,
    cancelAt: row.cancel_at,
    canceledAt: row.canceled_at,
    createdAt: row.created_at,
  }));

  const payments = (paymentsQuery.data ?? []).map((row: any) => ({
    id: row.id,
    planCode: row.plan_code,
    amountCents: row.amount_cents,
    currency: row.currency,
    status: row.status,
    paidAt: row.paid_at,
    createdAt: row.created_at,
  }));

  const totalIncomeCents = paymentsQuery.data ? sumPaymentsCents(paymentsQuery.data) : 0;

  return {
    id: profile.id,
    email,
    isFrozen,
    profile: {
      fullName: profile.full_name ?? null,
      role: profile.role,
      verified: Boolean(profile.verified),
      licenseVerified: Boolean(profile.license_verified),
      locale: profile.locale ?? "en",
      countryCode: profile.country_code ?? null,
      timezone: profile.timezone ?? null,
      createdAt: profile.created_at,
      organizationId: profile.organization_id ?? null,
      organizationName: profile.organization?.name ?? null,
      organizationType: profile.organization?.type ?? null,
      applicationStatus: profile.application_status ?? null,
      applicationSubmittedAt: profile.application_submitted_at ?? null,
      applicationReviewedAt: profile.application_reviewed_at ?? null,
      rejectionReason: profile.rejection_reason ?? null,
    },
    applicationData: guideData?.application_data ?? agencyData?.application_data ?? null,
    guideData,
    agencyData,
    subscriptions,
    payments,
    totalIncomeCents,
  };
}

export type PendingVerificationItem = {
  id: string;
  type: "guide" | "agency" | "dmc" | "transport";
  applicantName: string;
  applicantEmail: string;
  selfieUrl?: string | null;
  licenseProofUrl?: string | null;
  idDocumentUrl?: string | null;
  logoUrl?: string | null;
  createdAt: string;
  locale: string;
  verificationStatus: string;
};

export async function fetchPendingVerifications(): Promise<PendingVerificationItem[]> {
  const supabase = getSupabaseServerClient();

  const [guideApps, agencyApps, dmcApps, transportApps] = await Promise.all([
    supabase
      .from("guide_applications")
      .select("id, full_name, contact_email, selfie_url, license_proof_url, id_document_url, created_at, locale, verification_status")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("agency_applications")
      .select("id, legal_company_name, contact_email, logo_url, proof_of_license_url, created_at, locale, verification_status")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("dmc_applications")
      .select("id, legal_entity_name, contact_email, logo_url, license_proof_url, created_at, locale, verification_status")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true }),
    supabase
      .from("transport_applications")
      .select("id, legal_entity_name, contact_email, logo_url, license_proof_url, created_at, locale, verification_status")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true }),
  ]);

  const items: PendingVerificationItem[] = [];

  // Process guide applications
  if (guideApps.data) {
    items.push(
      ...guideApps.data.map((app: any) => ({
        id: app.id,
        type: "guide" as const,
        applicantName: app.full_name,
        applicantEmail: app.contact_email,
        selfieUrl: app.selfie_url,
        licenseProofUrl: app.license_proof_url,
        idDocumentUrl: app.id_document_url,
        createdAt: app.created_at,
        locale: app.locale ?? "en",
        verificationStatus: app.verification_status ?? "pending",
      }))
    );
  }

  // Process agency applications
  if (agencyApps.data) {
    items.push(
      ...agencyApps.data.map((app: any) => ({
        id: app.id,
        type: "agency" as const,
        applicantName: app.legal_company_name,
        applicantEmail: app.contact_email,
        logoUrl: app.logo_url,
        licenseProofUrl: app.proof_of_license_url,
        createdAt: app.created_at,
        locale: app.locale ?? "en",
        verificationStatus: app.verification_status ?? "pending",
      }))
    );
  }

  // Process DMC applications
  if (dmcApps.data) {
    items.push(
      ...dmcApps.data.map((app: any) => ({
        id: app.id,
        type: "dmc" as const,
        applicantName: app.legal_entity_name,
        applicantEmail: app.contact_email,
        logoUrl: app.logo_url,
        licenseProofUrl: app.license_proof_url,
        createdAt: app.created_at,
        locale: app.locale ?? "en",
        verificationStatus: app.verification_status ?? "pending",
      }))
    );
  }

  // Process transport applications
  if (transportApps.data) {
    items.push(
      ...transportApps.data.map((app: any) => ({
        id: app.id,
        type: "transport" as const,
        applicantName: app.legal_entity_name,
        applicantEmail: app.contact_email,
        logoUrl: app.logo_url,
        licenseProofUrl: app.license_proof_url,
        createdAt: app.created_at,
        locale: app.locale ?? "en",
        verificationStatus: app.verification_status ?? "pending",
      }))
    );
  }

  // Sort all items by creation date
  items.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  return items;
}

/**
 * Check if the current user has admin access
 * @returns Object with authorized boolean and optional user info
 */
export async function checkAdminAccess(): Promise<{
  authorized: boolean;
  userId?: string;
  role?: string;
}> {
  try {
    const supabase = await getSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return { authorized: false };
    }

    // Get user profile to check role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return { authorized: false };
    }

    // Check if user is admin or super_admin
    const isAdmin = profile.role === "admin" || profile.role === "super_admin";

    return {
      authorized: isAdmin,
      userId: user.id,
      role: profile.role,
    };
  } catch (error) {
    console.error("Error checking admin access:", error);
    return { authorized: false };
  }
}
