import { redirect, notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewModerationQueue } from "@/components/admin/review-moderation-queue";

export const runtime = "nodejs";

export default async function AdminReviewsPage({ params }: { params: { locale: string } }) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "admin.reviews" });

  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect(`/${locale}`);
  }

  // Fetch pending and reported reviews
  const { data: pendingReviews } = await supabase
    .from("reviews")
    .select("*")
    .in("status", ["pending", "reported"])
    .order("created_at", { ascending: true });

  // Enrich reviews with reviewer and reviewee information
  const enrichedReviews = await Promise.all(
    (pendingReviews || []).map(async (review) => {
      // Fetch reviewer (always from profiles)
      const { data: reviewer } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .eq("id", review.reviewer_id)
        .maybeSingle();

      // Fetch reviewee based on type
      let reviewee = null;
      if (review.reviewee_type === "guide") {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .eq("id", review.reviewee_id)
          .maybeSingle();
        reviewee = data;
      } else {
        // agency, dmc, or transport
        const { data } = await supabase
          .from("agencies")
          .select("id, name, logo_url")
          .eq("id", review.reviewee_id)
          .maybeSingle();
        reviewee = data ? { id: data.id, full_name: data.name, avatar_url: data.logo_url } : null;
      }

      return {
        ...review,
        reviewer,
        reviewee,
      };
    })
  );

  const pending = enrichedReviews?.filter((r) => r.status === "pending") || [];
  const reported = enrichedReviews?.filter((r) => r.status === "reported") || [];

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">
                {t("title")}
              </h1>
              <p className="text-sm text-foreground/70 sm:text-base">
                {t("subtitle")}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-semibold text-blue-700">
                {pending.length} {t("pending")}
              </span>
              <span className="rounded-full bg-red-100 px-4 py-2 text-sm font-semibold text-red-700">
                {reported.length} {t("reported")}
              </span>
            </div>
          </div>
        </header>

        <ReviewModerationQueue
          pendingReviews={pending}
          reportedReviews={reported}
          locale={locale}
          translations={{
            pendingTab: t("pendingTab"),
            reportedTab: t("reportedTab"),
            noReviews: t("noReviews"),
            reviewer: t("reviewer"),
            reviewee: t("reviewee"),
            rating: t("rating"),
            submitted: t("submitted"),
            actions: t("actions"),
            approve: t("approve"),
            reject: t("reject"),
            approving: t("approving"),
            rejecting: t("rejecting"),
            notes: t("notes"),
            notesPlaceholder: t("notesPlaceholder"),
            cancel: t("cancel"),
            confirm: t("confirm"),
            success: t("success"),
            error: t("error"),
            viewDetails: t("viewDetails"),
            reportReason: t("reportReason"),
            service: t("service"),
            communication: t("communication"),
            value: t("value"),
            professionalism: t("professionalism"),
            paymentSpeed: t("paymentSpeed"),
            trust: t("trust"),
            clarity: t("clarity"),
            support: t("support"),
          }}
        />
      </div>
    </div>
  );
}
