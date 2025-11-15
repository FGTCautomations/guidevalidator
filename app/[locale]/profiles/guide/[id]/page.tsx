export const dynamic = "force-dynamic";

﻿import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { InfoSection } from "@/components/profile/info-section";
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

  const profile = await fetchGuideProfile(id);

  if (!profile) {
    return (
      <div className="mx-auto flex min-h-[50vh] w-full max-w-4xl flex-col items-center justify-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-foreground">{t("fallback.title")}</h1>
        <p className="text-sm text-foreground/70">{t("fallback.description")}</p>
      </div>
    );
  }

  const [profileRating, profileReviews] = await Promise.all([
    fetchProfileRating(profile.profileId),
    fetchProfileReviews(profile.profileId, { limit: 5 }),
  ]);

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
      canReview = await canUserReviewProfile(user.id, profile.profileId);
    }
  }

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24 contact-protected">
      <CopyProtection />
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* Activation Status Banner */}
        {!profile.activated && (
          <div className="rounded-lg border-2 border-red-500 bg-red-50 p-4 text-center">
            <p className="text-lg font-semibold text-red-700">Not activated yet</p>
            <p className="mt-1 text-sm text-red-600">This guide profile has not been activated. Contact information and booking features are limited.</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <RequestHoldButton
            targetId={profile.profileId}
            targetName={profile.name}
            targetRole="guide"
            currentUserId={user?.id || ""}
            currentUserRole={user?.user_metadata?.role || ""}
            locale={locale}
          />
          <MessageUserButton
            userId={profile.profileId}
            userName={profile.name || undefined}
            locale={locale}
            variant="primary"
            size="md"
          />
        </div>

        {/* Profile Header with Avatar */}
        <div className="flex flex-col gap-6 rounded-xl border border-foreground/10 bg-white/60 p-6 shadow-sm sm:flex-row sm:items-start">
          {/* Avatar */}
          {profile.avatarUrl && (
            <div className="flex-shrink-0">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-32 w-32 rounded-full object-cover border-2 border-foreground/10"
              />
            </div>
          )}

          {/* Profile Info */}
          <div className="flex-1 space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 text-xs text-foreground/60">
                  <Link href={`/${locale}/directory` as Route} className="hover:underline">
                    {t("breadcrumbs.directory")}
                  </Link>
                  <span>/</span>
                  <Link href={`/${locale}/directory?tab=guides` as Route} className="hover:underline">
                    {t("breadcrumbs.guides")}
                  </Link>
                </div>
                <h1 className="mt-2 text-3xl font-bold text-foreground">
                  {formatted.name ?? profile.name}
                </h1>
                {(formatted.headline ?? profile.headline) && (
                  <p className="mt-1 text-lg text-foreground/70">
                    {formatted.headline ?? profile.headline}
                  </p>
                )}
                {profile.licenseNumber && (
                  <p className="mt-2 text-sm text-foreground/60">
                    <span className="font-medium">License #:</span> {profile.licenseNumber}
                  </p>
                )}
              </div>
            </div>

            {/* Badges */}
            {badges.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {badges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    {badge}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

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
              <p>{profile.bio ?? profile.headline ?? t("fallback.notProvided")}</p>
            </InfoSection>

            {profile.experienceSummary && (
              <InfoSection title="Experience Summary">
                <p className="whitespace-pre-line">{profile.experienceSummary}</p>
              </InfoSection>
            )}

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
                  : t("fallback.notProvided")}
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
                  : t("fallback.notProvided")}
              </div>
            </InfoSection>

            {profile.certifications && profile.certifications.length > 0 && (
              <InfoSection title="Certifications & Qualifications">
                <ul className="space-y-1">
                  {profile.certifications.map((cert: string, index: number) => (
                    <li key={index} className="text-sm text-foreground/80">• {cert}</li>
                  ))}
                </ul>
              </InfoSection>
            )}

            {profile.education && (
              <InfoSection title="Education">
                <p className="whitespace-pre-line">{profile.education}</p>
              </InfoSection>
            )}

            {profile.sampleItineraries && profile.sampleItineraries.length > 0 && (
              <InfoSection title="Sample Itineraries">
                <div className="space-y-2">
                  {profile.sampleItineraries.map((itinerary, index) => (
                    <a
                      key={index}
                      href={itinerary.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary hover:underline"
                    >
                      {itinerary.title}
                    </a>
                  ))}
                </div>
              </InfoSection>
            )}

            {profile.mediaGallery && profile.mediaGallery.length > 0 && (
              <InfoSection title="Photos & Videos">
                <div className="space-y-2">
                  {profile.mediaGallery.map((media, index) => (
                    <a
                      key={index}
                      href={media.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary hover:underline"
                    >
                      {media.title}
                    </a>
                  ))}
                </div>
              </InfoSection>
            )}

            {profile.locationData && profile.locationData.countries && profile.locationData.countries.length > 0 && (
              <InfoSection title="Operating Locations">
                <div className="space-y-3">
                  {profile.locationData.countries.map((country: any) => (
                    <div key={country.countryCode} className="space-y-1">
                      <h4 className="font-semibold text-sm">{country.countryName}</h4>
                      {country.regions && country.regions.length > 0 && (
                        <p className="text-xs text-foreground/70">Regions: {country.regions.join(", ")}</p>
                      )}
                      {country.cities && country.cities.length > 0 && (
                        <p className="text-xs text-foreground/70">Cities: {country.cities.join(", ")}</p>
                      )}
                      {country.parks && country.parks.length > 0 && (
                        <p className="text-xs text-foreground/70">Parks: {country.parks.join(", ")}</p>
                      )}
                    </div>
                  ))}
                </div>
              </InfoSection>
            )}
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
                providerId={profile.profileId}
                providerName={profile.name}
                providerRole="guide"
                currentUserId={user?.id || ""}
                currentUserRole={user?.user_metadata?.role || ""}
                locale={locale}
              />
              {profile.availabilityNotes && (
                <p className="mt-3 text-xs text-foreground/60 whitespace-pre-line">{profile.availabilityNotes}</p>
              )}
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
                href={`/${locale}/reviews/submit?revieweeId=${profile.profileId}&revieweeType=guide` as Route}
                className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90"
              >
                {reviewsT("submit.cta")}
              </Link>
            )}
          </div>
          <ReviewsList
            revieweeId={profile.profileId}
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
