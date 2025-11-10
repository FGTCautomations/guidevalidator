export const dynamic = "force-dynamic";

import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { InfoSection } from "@/components/profile/info-section";
import { ProfileHeader } from "@/components/profile/profile-header";
import { MessageUserButton } from "@/components/chat/message-user-button";
import { CopyProtection } from "@/components/profile/copy-protection";
import { fetchAgencyProfile } from "@/lib/profile/agency";
import { getCountryName } from "@/lib/utils/locale";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { fetchProfileRating, fetchProfileReviews, canUserReviewProfile } from "@/lib/reviews/queries";
import { StarRating } from "@/components/ui/star-rating";
import { ReviewsList } from "@/components/reviews/reviews-list";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { Route } from "next";

type AgencyProfilePageProps = {
  params: { locale: string; id: string };
};

function buildCoverage(description?: string | null, coverageSummary?: string | null) {
  if (description) return description;
  if (coverageSummary) return coverageSummary;
  return null;
}

export default async function AgencyProfilePage({ params }: AgencyProfilePageProps) {
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
    fetchAgencyProfile(id),
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

  const badges = [
    profile.featured ? t("meta.featured") : undefined,
    profile.verified ? t("meta.verified") : undefined,
  ].filter(Boolean) as string[];

  const coverage = buildCoverage(profile.description, profile.coverageSummary);
  const locationLabel = profile.countryCode
    ? getCountryName(locale, profile.countryCode) ?? profile.countryCode.toUpperCase()
    : "--";

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

    if (currentUserRole === "guide") {
      canReview = await canUserReviewProfile(user.id, id);
    }
  }

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24 contact-protected">
      <CopyProtection />
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Message Button */}
        <div className="flex justify-end">
          <MessageUserButton
            userId={profile.id}
            userName={profile.name || undefined}
            locale={locale}
            variant="primary"
            size="md"
          />
        </div>

        <ProfileHeader
          title={profile.name}
          subtitle={coverage ?? undefined}
          breadcrumbs={[
            { label: t("breadcrumbs.directory"), href: `/${locale}/directory` },
            { label: t("breadcrumbs.agencies"), href: `/${locale}/directory?tab=agencies` },
          ]}
          badges={badges}
          actions={[{ label: t("actions.contact"), href: `/${locale}/contact?agency=${profile.id}` }]}
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
              {/* Category Ratings Breakdown for Agencies (rated by guides) */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-foreground/70">
                {profileRating.avgPaymentSpeedRating && (
                  <div className="flex items-center gap-2">
                    <span>{reviewsT("categories.paymentSpeed")}:</span>
                    <StarRating rating={profileRating.avgPaymentSpeedRating} readonly size="sm" />
                  </div>
                )}
                {profileRating.avgTrustRating && (
                  <div className="flex items-center gap-2">
                    <span>{reviewsT("categories.trust")}:</span>
                    <StarRating rating={profileRating.avgTrustRating} readonly size="sm" />
                  </div>
                )}
                {profileRating.avgClarityRating && (
                  <div className="flex items-center gap-2">
                    <span>{reviewsT("categories.clarity")}:</span>
                    <StarRating rating={profileRating.avgClarityRating} readonly size="sm" />
                  </div>
                )}
                {profileRating.avgSupportRating && (
                  <div className="flex items-center gap-2">
                    <span>{reviewsT("categories.support")}:</span>
                    <StarRating rating={profileRating.avgSupportRating} readonly size="sm" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <InfoSection title="Overview">
              <p>{coverage ?? t("fallback.description")}</p>
            </InfoSection>

            {profile.languages && profile.languages.length > 0 && (
              <InfoSection title="Languages">
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((lang: string) => (
                    <span
                      key={lang}
                      className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground"
                    >
                      {lang.toUpperCase()}
                    </span>
                  ))}
                </div>
              </InfoSection>
            )}

            {profile.specialties && profile.specialties.length > 0 && (
              <InfoSection title="Specialties">
                <div className="flex flex-wrap gap-2">
                  {profile.specialties.map((specialty: string) => (
                    <span
                      key={specialty}
                      className="rounded-full border border-foreground/20 px-3 py-1 text-xs font-medium text-foreground"
                    >
                      {specialty.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  ))}
                </div>
              </InfoSection>
            )}
          </div>
          <div className="space-y-6">
            <InfoSection title="Location">
              <p>{locationLabel}</p>
            </InfoSection>

            {profile.website && (
              <InfoSection title="Website">
                <a
                  href={profile.website.startsWith('http') ? profile.website : `https://${profile.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {profile.website}
                </a>
              </InfoSection>
            )}

            {profile.registrationNumber && (
              <InfoSection title="Registration Number">
                <p className="text-sm text-foreground/70">{profile.registrationNumber}</p>
              </InfoSection>
            )}

            {profile.vatId && (
              <InfoSection title="VAT ID">
                <p className="text-sm text-foreground/70">{profile.vatId}</p>
              </InfoSection>
            )}
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
                href={`/${locale}/reviews/submit?revieweeId=${id}&revieweeType=agency` as Route}
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

