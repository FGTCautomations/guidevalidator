import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Route } from "next";

export const runtime = "nodejs";

type ReviewStatsPageProps = {
  params: { locale: string };
};

export default async function ReviewStatsPage({ params }: ReviewStatsPageProps) {
  const { locale } = params;
  const supabase = getSupabaseServerClient();

  // Check authentication and admin status
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/sign-in` as Route);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect(`/${locale}` as Route);
  }

  // Fetch review statistics
  const [
    totalReviewsResult,
    pendingReviewsResult,
    approvedReviewsResult,
    rejectedReviewsResult,
    reportedReviewsResult,
    avgRatingResult,
    recentReviewsResult,
    topRatedProfilesResult,
  ] = await Promise.all([
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "approved"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "rejected"),
    supabase.from("reviews").select("id", { count: "exact", head: true }).eq("status", "reported"),
    supabase.rpc("get_average_rating"),
    supabase
      .from("reviews")
      .select("id, overall_rating, title, created_at, reviewer:reviewer_id(full_name), reviewee:reviewee_id(full_name), status")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("profile_ratings")
      .select("reviewee_id, total_reviews, avg_overall_rating, reviewee:reviewee_id(full_name)")
      .order("avg_overall_rating", { ascending: false })
      .limit(10),
  ]);

  const stats = {
    total: totalReviewsResult.count || 0,
    pending: pendingReviewsResult.count || 0,
    approved: approvedReviewsResult.count || 0,
    rejected: rejectedReviewsResult.count || 0,
    reported: reportedReviewsResult.count || 0,
    avgRating: avgRatingResult.data || 0,
  };

  const recentReviews = (recentReviewsResult.data || []).map((r: any) => ({
    id: r.id,
    title: r.title,
    rating: r.overall_rating,
    reviewerName: Array.isArray(r.reviewer) ? r.reviewer[0]?.full_name : r.reviewer?.full_name || "Anonymous",
    revieweeName: Array.isArray(r.reviewee) ? r.reviewee[0]?.full_name : r.reviewee?.full_name || "Unknown",
    status: r.status,
    createdAt: r.created_at,
  }));

  const topRated = (topRatedProfilesResult.data || []).map((p: any) => ({
    id: p.reviewee_id,
    name: Array.isArray(p.reviewee) ? p.reviewee[0]?.full_name : p.reviewee?.full_name || "Unknown",
    totalReviews: p.total_reviews,
    avgRating: p.avg_overall_rating,
  }));

  const t = await getTranslations({ locale, namespace: "admin" });

  return (
    <div className="mx-auto w-full max-w-7xl px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Review Statistics</h1>
        <p className="mt-2 text-foreground/70">Overview of all review activity</p>
      </div>

      {/* Stats Grid */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Reviews" value={stats.total} color="blue" />
        <StatCard title="Pending" value={stats.pending} color="yellow" />
        <StatCard title="Approved" value={stats.approved} color="green" />
        <StatCard title="Rejected" value={stats.rejected} color="red" />
        <StatCard title="Reported" value={stats.reported} color="orange" />
        <StatCard
          title="Average Rating"
          value={stats.avgRating ? `${stats.avgRating.toFixed(1)} ⭐` : "N/A"}
          color="purple"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Reviews */}
        <div className="rounded-xl border border-foreground/10 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Recent Reviews</h2>
          <div className="space-y-4">
            {recentReviews.length === 0 ? (
              <p className="text-sm text-foreground/60">No reviews yet</p>
            ) : (
              recentReviews.map((review) => (
                <div
                  key={review.id}
                  className="flex items-start justify-between border-b border-foreground/5 pb-4 last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{review.title}</span>
                      <span className="text-xs text-yellow-600">
                        {"★".repeat(review.rating)}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60">
                      {review.reviewerName} → {review.revieweeName}
                    </p>
                    <p className="text-xs text-foreground/40">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      review.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : review.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : review.status === "rejected"
                        ? "bg-red-100 text-red-800"
                        : "bg-orange-100 text-orange-800"
                    }`}
                  >
                    {review.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Rated Profiles */}
        <div className="rounded-xl border border-foreground/10 bg-white p-6">
          <h2 className="mb-4 text-xl font-semibold text-foreground">Top Rated Profiles</h2>
          <div className="space-y-4">
            {topRated.length === 0 ? (
              <p className="text-sm text-foreground/60">No ratings yet</p>
            ) : (
              topRated.map((profile, index) => (
                <div
                  key={profile.id}
                  className="flex items-center justify-between border-b border-foreground/5 pb-4 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      #{index + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{profile.name}</p>
                      <p className="text-xs text-foreground/60">
                        {profile.totalReviews} reviews
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold text-foreground">
                      {profile.avgRating.toFixed(1)}
                    </span>
                    <span className="text-yellow-500">★</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  color,
}: {
  title: string;
  value: string | number;
  color: "blue" | "yellow" | "green" | "red" | "orange" | "purple";
}) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-900 border-blue-200",
    yellow: "bg-yellow-50 text-yellow-900 border-yellow-200",
    green: "bg-green-50 text-green-900 border-green-200",
    red: "bg-red-50 text-red-900 border-red-200",
    orange: "bg-orange-50 text-orange-900 border-orange-200",
    purple: "bg-purple-50 text-purple-900 border-purple-200",
  };

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color]}`}>
      <p className="text-sm font-medium opacity-80">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}
