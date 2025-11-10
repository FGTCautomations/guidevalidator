export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ReviewSubmissionForm } from "@/components/reviews/review-submission-form";
import type { Route } from "next";

export const runtime = "nodejs";

type ReviewSubmitPageProps = {
  params: { locale: string };
  searchParams: { revieweeId?: string; revieweeType?: string };
};

export default async function ReviewSubmitPage({
  params,
  searchParams,
}: ReviewSubmitPageProps) {
  const { locale } = params;
  const { revieweeId, revieweeType } = searchParams;

  if (!revieweeId || !revieweeType) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-2xl font-semibold text-foreground">Invalid Request</h1>
        <p className="text-sm text-foreground/70">
          Missing required parameters. Please navigate to a profile page and click "Write Review".
        </p>
      </div>
    );
  }

  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in?redirect=${encodeURIComponent(`/${locale}/reviews/submit?revieweeId=${revieweeId}&revieweeType=${revieweeType}`)}` as Route);
  }

  // Get current user's profile
  const { data: currentProfile, error: profileError } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!currentProfile) {
    console.error("Profile not found for user:", user.id, profileError);
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-2xl font-semibold text-foreground">Profile Not Found</h1>
        <p className="text-sm text-foreground/70">
          Your profile could not be loaded. Please complete your profile setup first.
        </p>
      </div>
    );
  }

  // Validate review direction
  const validReviewerRoles = {
    guide: ["agency", "dmc", "transport"],
    agency: ["guide"],
    dmc: ["guide"],
    transport: ["guide"],
  };

  const reviewerRole = currentProfile.role as "guide" | "agency" | "dmc" | "transport";
  const validRevieweeTypes = validReviewerRoles[reviewerRole] || [];

  console.log("[ReviewSubmit] Validation:", {
    reviewerId: user.id,
    reviewerRole,
    revieweeId,
    revieweeType,
    validRevieweeTypes,
    canReview: validRevieweeTypes.includes(revieweeType)
  });

  if (!validRevieweeTypes.includes(revieweeType)) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-2xl font-semibold text-foreground">Cannot Submit Review</h1>
        <p className="text-sm text-foreground/70">
          Your account type ({reviewerRole || 'unknown'}) cannot review {revieweeType} profiles.
        </p>
        <p className="text-xs text-foreground/50 mt-2">
          Valid reviewer roles for {revieweeType}: {validReviewerRoles[revieweeType as keyof typeof validReviewerRoles]?.join(', ') || 'none'}
        </p>
      </div>
    );
  }

  // Check if user has already reviewed this profile
  const { data: existingReview } = await supabase
    .from("reviews")
    .select("id")
    .eq("reviewer_id", user.id)
    .eq("reviewee_id", revieweeId)
    .maybeSingle();

  if (existingReview) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl flex-col items-center justify-center gap-4 text-center px-6">
        <h1 className="text-2xl font-semibold text-foreground">Already Reviewed</h1>
        <p className="text-sm text-foreground/70">
          You have already submitted a review for this profile.
        </p>
      </div>
    );
  }

  // Get reviewee profile
  let revieweeProfile: any;
  let revieweeName: string;

  if (revieweeType === "guide") {
    const { data, error: revieweeError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", revieweeId)
      .maybeSingle();

    if (!data) {
      console.error("Reviewee profile not found:", revieweeId, revieweeType, revieweeError);
      return (
        <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl flex-col items-center justify-center gap-4 text-center px-6">
          <h1 className="text-2xl font-semibold text-foreground">Profile Not Found</h1>
          <p className="text-sm text-foreground/70">
            The profile you're trying to review could not be found.
          </p>
        </div>
      );
    }

    revieweeProfile = data;
    revieweeName = data.full_name || "Unknown";
  } else {
    // For agencies, DMCs, transport - query agencies table
    const { data, error: revieweeError } = await supabase
      .from("agencies")
      .select("id, name")
      .eq("id", revieweeId)
      .maybeSingle();

    if (!data) {
      console.error("Reviewee agency not found:", revieweeId, revieweeType, revieweeError);
      return (
        <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl flex-col items-center justify-center gap-4 text-center px-6">
          <h1 className="text-2xl font-semibold text-foreground">Profile Not Found</h1>
          <p className="text-sm text-foreground/70">
            The agency/organization you're trying to review could not be found.
          </p>
        </div>
      );
    }

    revieweeProfile = data;
    revieweeName = data.name || "Unknown";
  }

  const t = await getTranslations({ locale, namespace: "reviews" });

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-12">
      <ReviewSubmissionForm
        revieweeId={revieweeId}
        revieweeType={revieweeType as "guide" | "agency" | "dmc" | "transport"}
        revieweeName={revieweeName}
        reviewerType={reviewerRole}
        locale={locale}
        translations={{
          title: t("submit.title"),
          subtitle: t("submit.subtitle", { name: revieweeName }),
          overallRating: t("submit.overallRating"),
          reviewTitle: t("submit.reviewTitle"),
          reviewTitlePlaceholder: t("submit.reviewTitlePlaceholder"),
          comment: t("submit.comment"),
          commentPlaceholder: t("submit.commentPlaceholder"),
          submit: t("submit.submit"),
          submitting: t("submit.submitting"),
          success: t("submit.success"),
          error: t("submit.error"),
          cancel: t("submit.cancel"),
          serviceRating: t("submit.serviceRating"),
          communicationRating: t("submit.communicationRating"),
          valueRating: t("submit.valueRating"),
          professionalismRating: t("submit.professionalismRating"),
          paymentSpeedRating: t("submit.paymentSpeedRating"),
          trustRating: t("submit.trustRating"),
          clarityRating: t("submit.clarityRating"),
          supportRating: t("submit.supportRating"),
        }}
      />
    </div>
  );
}
