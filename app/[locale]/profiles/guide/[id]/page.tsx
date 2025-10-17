import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { InfoSection } from "@/components/profile/info-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { InteractiveAvailabilityCalendar } from "@/components/profile/interactive-availability-calendar";
import { MessageUserButton } from "@/components/chat/message-user-button";
import { CopyProtection } from "@/components/profile/copy-protection";
import { RequestHoldButton } from "@/components/availability/request-hold-button";
import { fetchGuideProfile } from "@/lib/profile/queries";
import { formatGuideProfile } from "@/lib/profile/formatters";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchProfileRating, fetchProfileReviews, canUserReviewProfile } from "@/lib/reviews/queries";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewsList } from "@/components/reviews/reviews-list";
import Link from "next/link";
import type { Route } from "next";

function formatCurrency(amountCents?: number | null, currency?: string | null) {
  if (amountCents == null || currency == null) return undefined;
  const value = amountCents / 100;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return `${value.toFixed(0)} ${currency}`;
  }
}

type GuideProfilePageProps = {
  params: { locale: string; id: string };
};

export default async function GuideProfilePage({ params }: GuideProfilePageProps) {
  const { locale: requestedLocale, id } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "profile" });
  const reviewsT = await getTranslations({ locale, namespace: "reviews" });

  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [profile, profileRating, profileReviews] = await Promise.all([
    fetchGuideProfile(id),
    fetchProfileRating(id),
    fetchProfileReviews(id, { limit: 5 }),
  ]);

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{t("fallback.title")}</h1>
        <p className="text-sm text-foreground/70">{t("fallback.description")}</p>
      </div>
    );
  }

  const formatted = formatGuideProfile(profile, locale);
  const location = formatted.countryLabel ?? (profile.countryCode ? profile.countryCode.toUpperCase() : "--");
  const rate = formatCurrency(profile.hourlyRateCents, profile.currency) ?? "--";
  const languageLabels = formatted.languageLabels.length > 0
    ? formatted.languageLabels
    : profile.languages.map((language: string) => language.toUpperCase());
  const badges = [profile.verified ? t("meta.verified") : undefined].filter(Boolean) as string[];

  // Determine if current user can submit a review
  let canReview = false;
  let currentUserRole = "";
  if (user) {
    const { data: currentProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    currentUserRole = currentProfile?.role ?? "";
    const validReviewerRoles = ["agency", "dmc", "transport"];

    if (validReviewerRoles.includes(currentUserRole)) {
      canReview = await canUserReviewProfile(user.id, id);
    }
  }

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24 contact-protected">
      <CopyProtection />
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <RequestHoldButton
            targetId={profile.id}
            targetName={profile.name}
            targetRole="guide"
            currentUserId={user?.id || ""}
            currentUserRole={user?.user_metadata?.role || ""}
            locale={locale}
          />
          <MessageUserButton
            userId={profile.id}
            userName={profile.name || undefined}
            locale={locale}
            variant="primary"
            size="md"
          />
        </div>

        <ProfileHeader
          title={formatted.name ?? profile.name}
          subtitle={formatted.headline ?? profile.headline ?? undefined}
          breadcrumbs={[
            { label: t("breadcrumbs.directory"), href: `/${locale}/directory` },
            { label: t("breadcrumbs.guides"), href: `/${locale}/directory?tab=guides` },
          ]}
          badges={badges}
          actions={[{ label: t("actions.contact"), href: `/${locale}/contact?guide=${profile.id}` }]}
        />

        {/* Rating Section */}
        {profileRating && profileRating.totalReviews > 0 && (
          <div className="flex items-center gap-4 rounded-xl border border-foreground/10 bg-white/60 p-6">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <StarRating rating={profileRating.avgOverallRating} readonly showValue size="lg" />
                <span className="text-sm text-foreground/60">
                  ({profileRating.totalReviews} {reviewsT("list.reviews")})
                </span>
              </div>
              {/* Category Ratings Breakdown */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-foreground/70">
                {profileRating.avgServiceRating && (
                  <div className="flex items-center gap-2">
                    <span>{reviewsT("categories.service")}:</span>
                    <StarRating rating={profileRating.avgServiceRating} readonly size="sm" />
                  </div>
                )}
                {profileRating.avgCommunicationRating && (
                  <div className="flex items-center gap-2">
                    <span>{reviewsT("categories.communication")}:</span>
                    <StarRating rating={profileRating.avgCommunicationRating} readonly size="sm" />
                  </div>
                )}
                {profileRating.avgValueRating && (
                  <div className="flex items-center gap-2">
                    <span>{reviewsT("categories.value")}:</span>
                    <StarRating rating={profileRating.avgValueRating} readonly size="sm" />
                  </div>
                )}
                {profileRating.avgProfessionalismRating && (
                  <div className="flex items-center gap-2">
                    <span>{reviewsT("categories.professionalism")}:</span>
                    <StarRating rating={profileRating.avgProfessionalismRating} readonly size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <InfoSection title={t("guide.infoTitle")}>
              <p>{profile.bio ?? profile.headline ?? t("fallback.description")}</p>
            </InfoSection>
            <InfoSection title={t("guide.specialties")}>
              <div className="flex flex-wrap gap-2">
                {profile.specialties.length > 0
                  ? profile.specialties.map((specialty: string) => (
                      <span
                        key={specialty}
                        className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70"
                      >
                        {specialty}
                      </span>
                    ))
                  : t("fallback.description")}
              </div>
            </InfoSection>
            <InfoSection title={t("guide.languages")}>
              <div className="flex flex-wrap gap-2">
                {languageLabels.length > 0
                  ? languageLabels.map((language: string) => (
                      <span
                        key={language}
                        className="rounded-full bg-foreground/5 px-3 py-1 text-xs font-medium text-foreground/70"
                      >
                        {language}
                      </span>
                    ))
                  : t("fallback.description")}
              </div>
            </InfoSection>
          </div>

          <div className="space-y-6">
            <InfoSection title={t("guide.rates")}>
              <p>{rate}</p>
            </InfoSection>
            <InfoSection title={t("guide.experience")}>
              <p>{profile.yearsExperience != null ? `${profile.yearsExperience} yrs` : "--"}</p>
            </InfoSection>
            <InfoSection title={t("guide.responseTime")}>
              <p>{profile.responseTimeMinutes != null ? `${profile.responseTimeMinutes} min` : "--"}</p>
            </InfoSection>
            <InfoSection title={t("guide.regionCoverage")}>
              <p>{location}</p>
            </InfoSection>
            <InfoSection title="Availability">
              <InteractiveAvailabilityCalendar
                providerId={profile.id}
                providerName={profile.name}
                providerRole="guide"
                currentUserId={user?.id || ""}
                currentUserRole={user?.user_metadata?.role || ""}
                locale={locale}
              />
            </InfoSection>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="space-y-6 border-t border-foreground/10 pt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-foreground">
              {reviewsT("list.title")}
            </h2>
            {canReview && (
              <Link
                href={`/${locale}/reviews/submit?revieweeId=${id}&revieweeType=guide` as Route}
                className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
              >
                {reviewsT("submit.cta")}
              </Link>
            )}
          </div>
          <ReviewsList
            revieweeId={id}
            initialReviews={profileReviews}
            initialTotal={profileRating?.totalReviews ?? 0}
            translations={{
              title: reviewsT("list.title"),
              noReviews: reviewsT("list.empty"),
              loadMore: reviewsT("list.loadMore"),
              loading: reviewsT("list.loading"),
              service: reviewsT("list.service"),
              communication: reviewsT("list.communication"),
              value: reviewsT("list.value"),
              professionalism: reviewsT("list.professionalism"),
              paymentSpeed: reviewsT("list.paymentSpeed"),
              trust: reviewsT("list.trust"),
              clarity: reviewsT("list.clarity"),
              support: reviewsT("list.support"),
              report: reviewsT("list.report"),
              reported: reviewsT("list.reported"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
