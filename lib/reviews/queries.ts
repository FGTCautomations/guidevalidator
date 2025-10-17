import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Review, ProfileRatings } from "./types";

/**
 * Fetch aggregate ratings for a profile
 */
export async function fetchProfileRating(profileId: string): Promise<ProfileRatings | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("profile_ratings")
    .select("*")
    .eq("reviewee_id", profileId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch profile rating", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    revieweeId: data.reviewee_id,
    totalReviews: data.total_reviews ?? 0,
    avgOverallRating: data.avg_overall_rating ?? 0,
    avgServiceRating: data.avg_service_rating ?? null,
    avgCommunicationRating: data.avg_communication_rating ?? null,
    avgValueRating: data.avg_value_rating ?? null,
    avgProfessionalismRating: data.avg_professionalism_rating ?? null,
    avgPaymentSpeedRating: data.avg_payment_speed_rating ?? null,
    avgTrustRating: data.avg_trust_rating ?? null,
    avgClarityRating: data.avg_clarity_rating ?? null,
    avgSupportRating: data.avg_support_rating ?? null,
  };
}

/**
 * Fetch approved reviews for a profile with pagination
 */
export async function fetchProfileReviews(
  profileId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<any[]> {
  const { limit = 10, offset = 0 } = options;
  const supabase = getSupabaseServerClient();

  // Fetch reviews without joins (to avoid issues with dual-table structure)
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewee_id", profileId)
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to fetch profile reviews", error);
    return [];
  }

  if (!data || !Array.isArray(data)) {
    return [];
  }

  // Enrich reviews with reviewer and reviewee information
  const enrichedReviews = await Promise.all(
    data.map(async (row: any) => {
      // Fetch reviewer (always from profiles)
      const { data: reviewer } = await supabase
        .from("profiles")
        .select("id, full_name, role")
        .eq("id", row.reviewer_id)
        .maybeSingle();

      // Fetch reviewee based on type
      let reviewee = null;
      if (row.reviewee_type === "guide") {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, role")
          .eq("id", row.reviewee_id)
          .maybeSingle();
        reviewee = data;
      } else {
        // agency, dmc, or transport
        const { data } = await supabase
          .from("agencies")
          .select("id, name")
          .eq("id", row.reviewee_id)
          .maybeSingle();
        reviewee = data ? { id: data.id, full_name: data.name, role: row.reviewee_type } : null;
      }

      return {
        id: row.id,
        reviewer_id: row.reviewer_id,
        reviewee_id: row.reviewee_id,
        reviewer_type: row.reviewer_type,
        reviewee_type: row.reviewee_type,
        reviewer: reviewer,
        reviewee: reviewee,
        service_rating: row.service_rating ?? null,
        communication_rating: row.communication_rating ?? null,
        value_rating: row.value_rating ?? null,
        professionalism_rating: row.professionalism_rating ?? null,
        payment_speed_rating: row.payment_speed_rating ?? null,
        trust_rating: row.trust_rating ?? null,
        clarity_rating: row.clarity_rating ?? null,
        support_rating: row.support_rating ?? null,
        overall_rating: row.overall_rating,
        title: row.title,
        comment: row.comment,
        status: row.status,
        locale: row.locale ?? "en",
        created_at: row.created_at,
        updated_at: row.updated_at ?? null,
      };
    })
  );

  return enrichedReviews;
}

/**
 * Check if the current user can review a profile
 */
export async function canUserReviewProfile(
  reviewerId: string,
  revieweeId: string
): Promise<boolean> {
  const supabase = getSupabaseServerClient();

  // Check if user has already reviewed this profile
  const { data: existingReview, error } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", reviewerId)
    .eq("reviewee_id", revieweeId)
    .maybeSingle();

  if (error) {
    console.error("Failed to check existing review", error);
    return false;
  }

  return !existingReview;
}
