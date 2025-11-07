import { getSupabaseServerClient } from "@/lib/supabase/server";
import { subDays, subMonths } from "date-fns";

export type UserStatistics = {
  // Account info
  accountAge: number; // days since account created
  lastLoginAt: string | null;

  // Activity metrics
  totalMessages: number;
  messagesLast30Days: number;
  totalConversations: number;
  activeConversations: number;

  // Booking/availability metrics (for guides)
  totalBookings: number;
  completedBookings: number;
  canceledBookings: number;
  availabilityDaysSet: number;

  // Financial metrics
  totalRevenueCents: number;
  revenueThisMonth: number;
  revenueLastMonth: number;
  activeSubscriptions: number;
  totalPayments: number;

  // Directory metrics
  profileViews: number;
  profileViewsLast30Days: number;
  directoryListed: boolean;

  // Review metrics
  averageRating: number | null;
  totalReviews: number;
  reviewsLast30Days: number;
};

/**
 * Fetches comprehensive statistics for a user
 */
export async function fetchUserStatistics(userId: string, organizationId?: string | null): Promise<UserStatistics> {
  const supabase = getSupabaseServerClient();
  const now = new Date();
  const thirtyDaysAgo = subDays(now, 30);
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = subMonths(thisMonthStart, 1);

  // Determine which ID to use for queries (profile_id or organization_id)
  const profileFilter = `profile_id.eq.${userId}`;
  const orgFilter = organizationId ? `organization_id.eq.${organizationId}` : null;
  const orClause = orgFilter ? `${profileFilter},${orgFilter}` : profileFilter;

  // Fetch profile creation date for account age
  const { data: profileData } = await supabase
    .from("profiles")
    .select("created_at, last_sign_in_at")
    .eq("id", userId)
    .single();

  const createdAt = profileData?.created_at ? new Date(profileData.created_at) : now;
  const accountAge = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const lastLoginAt = profileData?.last_sign_in_at || null;

  // Run all queries in parallel for better performance
  const [
    messagesQuery,
    messagesLast30DaysQuery,
    conversationsQuery,
    activeConversationsQuery,
    subscriptionsQuery,
    paymentsQuery,
    paymentsThisMonthQuery,
    paymentsLastMonthQuery,
  ] = await Promise.all([
    // Messages
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", userId),

    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("sender_id", userId)
      .gte("created_at", thirtyDaysAgo.toISOString()),

    // Conversations
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`),

    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`)
      .eq("status", "active"),

    // Subscriptions
    supabase
      .from("subscriptions")
      .select("id, status", { count: "exact" })
      .or(orClause),

    // Payments
    supabase
      .from("payments")
      .select("amount_cents, status, created_at")
      .or(orClause)
      .in("status", ["paid", "succeeded"]),

    supabase
      .from("payments")
      .select("amount_cents")
      .or(orClause)
      .in("status", ["paid", "succeeded"])
      .gte("created_at", thisMonthStart.toISOString()),

    supabase
      .from("payments")
      .select("amount_cents")
      .or(orClause)
      .in("status", ["paid", "succeeded"])
      .gte("created_at", lastMonthStart.toISOString())
      .lt("created_at", thisMonthStart.toISOString()),
  ]);

  // Calculate financial metrics
  const totalRevenueCents = (paymentsQuery.data || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const revenueThisMonth = (paymentsThisMonthQuery.data || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const revenueLastMonth = (paymentsLastMonthQuery.data || []).reduce((sum, p) => sum + (p.amount_cents || 0), 0);
  const activeSubscriptions = (subscriptionsQuery.data || []).filter(s =>
    ["active", "trialing", "past_due"].includes(s.status)
  ).length;

  // For guides: fetch booking and availability data
  let totalBookings = 0;
  let completedBookings = 0;
  let canceledBookings = 0;
  let availabilityDaysSet = 0;

  // Check if user has guide profile
  const { data: guideData } = await supabase
    .from("guides")
    .select("id, availability")
    .eq("profile_id", userId)
    .maybeSingle();

  if (guideData) {
    // Count availability days if data exists
    if (guideData.availability && typeof guideData.availability === 'object') {
      const availability = guideData.availability as any;
      if (Array.isArray(availability)) {
        availabilityDaysSet = availability.length;
      } else if (typeof availability === 'object' && Object.keys(availability).length > 0) {
        availabilityDaysSet = Object.keys(availability).length;
      }
    }

    // Note: Bookings table doesn't exist yet in schema, so setting to 0
    // When bookings table is added, uncomment:
    // const bookingsQuery = await supabase
    //   .from("bookings")
    //   .select("id, status")
    //   .eq("guide_id", guideData.id);
    // if (bookingsQuery.data) {
    //   totalBookings = bookingsQuery.data.length;
    //   completedBookings = bookingsQuery.data.filter(b => b.status === 'completed').length;
    //   canceledBookings = bookingsQuery.data.filter(b => b.status === 'canceled').length;
    // }
  }

  // Profile views - check if profile_views table exists
  let profileViews = 0;
  let profileViewsLast30Days = 0;
  // Note: profile_views table doesn't exist yet, setting to 0
  // When implemented:
  // const viewsQuery = await supabase
  //   .from("profile_views")
  //   .select("id, created_at", { count: "exact" })
  //   .eq("profile_id", userId);
  // profileViews = viewsQuery.count || 0;
  // profileViewsLast30Days = viewsQuery.data?.filter(v =>
  //   new Date(v.created_at) >= thirtyDaysAgo
  // ).length || 0;

  // Directory listing status - check if profile meets directory criteria
  // A profile is listed in directory if:
  // 1. application_status is "approved"
  // 2. NOT frozen (rejection_reason doesn't start with "FROZEN:")
  const { data: profileStatus } = await supabase
    .from("profiles")
    .select("application_status, rejection_reason")
    .eq("id", userId)
    .single();

  const isApproved = profileStatus?.application_status === "approved";
  const isFrozen = profileStatus?.rejection_reason?.startsWith("FROZEN:");
  const directoryListed = isApproved && !isFrozen;

  // Reviews - fetch real review data
  let averageRating: number | null = null;
  let totalReviews = 0;
  let reviewsLast30Days = 0;

  const { data: reviewsData } = await supabase
    .from("reviews")
    .select("overall_rating, created_at")
    .eq("reviewee_id", userId);

  if (reviewsData && reviewsData.length > 0) {
    totalReviews = reviewsData.length;
    const ratingsSum = reviewsData.reduce((sum, r) => sum + (r.overall_rating || 0), 0);
    averageRating = ratingsSum / totalReviews;
    reviewsLast30Days = reviewsData.filter(r =>
      new Date(r.created_at) >= thirtyDaysAgo
    ).length;
  }

  return {
    accountAge,
    lastLoginAt,
    totalMessages: messagesQuery.count || 0,
    messagesLast30Days: messagesLast30DaysQuery.count || 0,
    totalConversations: conversationsQuery.count || 0,
    activeConversations: activeConversationsQuery.count || 0,
    totalBookings,
    completedBookings,
    canceledBookings,
    availabilityDaysSet,
    totalRevenueCents,
    revenueThisMonth,
    revenueLastMonth,
    activeSubscriptions,
    totalPayments: paymentsQuery.count || 0,
    profileViews,
    profileViewsLast30Days,
    directoryListed,
    averageRating,
    totalReviews,
    reviewsLast30Days,
  };
}
