export const dynamic = "force-dynamic";

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Route } from "next";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchJobDetail } from "@/lib/jobs/queries";

export const runtime = "nodejs";

function formatBudget(minCents: number | null, maxCents: number | null, currency: string, locale: string) {
  const formatter = new Intl.NumberFormat(locale, { style: "currency", currency, minimumFractionDigits: 0 });

  if (minCents !== null && maxCents !== null) {
    return `${formatter.format(minCents / 100)} - ${formatter.format(maxCents / 100)}`;
  }
  if (minCents !== null) {
    return `${formatter.format(minCents / 100)}+`;
  }
  if (maxCents !== null) {
    return `Up to ${formatter.format(maxCents / 100)}`;
  }
  return "Negotiable";
}

function formatDate(dateString: string | null | undefined, locale: string) {
  if (!dateString) return null;
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(dateString));
}

export default async function JobDetailPage({ params }: { params: { locale: string; jobId: string } }) {
  const { locale: requestedLocale, jobId } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "jobs.detail" });
  const commonT = await getTranslations({ locale, namespace: "common" });

  const job = await fetchJobDetail(jobId, locale);

  if (!job) {
    notFound();
  }

  const supabase = getSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  let profileRole: string | null = null;
  if (user) {
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    profileRole = profileRow?.role ?? null;
  }

  const canApply = profileRole === "guide";
  const isAuthenticated = Boolean(user);

  const applyHref = !isAuthenticated
    ? `/${locale}/auth/sign-in?redirect=${encodeURIComponent(`/${locale}/jobs/${jobId}/apply`)}`
    : canApply
      ? `/${locale}/jobs/${jobId}/apply`
      : `/${locale}/pricing`;

  const applyLabel = !isAuthenticated ? t("applySignIn") : canApply ? t("apply") : t("applyUpgrade");

  const locationParts = [
    job.location.cityName,
    job.location.regionName,
    job.location.countryName,
  ].filter(Boolean);

  const budgetDisplay = formatBudget(
    job.budget.minCents ?? null,
    job.budget.maxCents ?? null,
    job.budget.currency,
    locale
  );

  const startDateDisplay = formatDate(job.startDate, locale);
  const endDateDisplay = formatDate(job.endDate, locale);
  const deadlineDisplay = formatDate(job.applicationDeadline, locale);

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        {/* Back navigation */}
        <Link
          href={`/${locale}/jobs`}
          className="inline-flex items-center gap-2 text-sm font-medium text-secondary transition hover:text-secondary/80"
        >
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          {t("backToJobs")}
        </Link>

        {/* Job header */}
        <header className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                {job.title}
              </h1>
              {job.agencyName && (
                <p className="text-lg text-foreground/70">
                  {t("postedBy")} <span className="font-medium text-foreground">{job.agencyName}</span>
                </p>
              )}
            </div>
            <span
              className={`rounded-full px-4 py-2 text-xs font-semibold uppercase ${
                job.status === "open"
                  ? "bg-green-100 text-green-700"
                  : job.status === "filled"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {job.status}
            </span>
          </div>

          {/* Key details */}
          <div className="flex flex-wrap gap-4 text-sm text-foreground/70">
            {locationParts.length > 0 && (
              <div className="flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>{locationParts.join(", ")}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{budgetDisplay}</span>
            </div>
          </div>
        </header>

        {/* Apply CTA */}
        {job.status === "open" && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold text-foreground">{t("interestedTitle")}</h2>
                <p className="text-sm text-foreground/70">{t("interestedDescription")}</p>
              </div>
              <Link
                href={applyHref as Route}
                className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:shadow-md"
              >
                {applyLabel}
              </Link>
            </div>
          </div>
        )}

        {/* Job details */}
        <div className="space-y-6 rounded-lg border border-foreground/10 bg-white p-6 shadow-sm">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-foreground">{t("description")}</h2>
            <p className="whitespace-pre-wrap text-foreground/80">{job.description}</p>
          </section>

          {/* Dates */}
          {(startDateDisplay || endDateDisplay) && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-foreground">{t("dates")}</h2>
              <dl className="space-y-2 text-sm">
                {startDateDisplay && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-foreground/70">{t("startDate")}:</dt>
                    <dd className="text-foreground">{startDateDisplay}</dd>
                  </div>
                )}
                {endDateDisplay && (
                  <div className="flex gap-2">
                    <dt className="font-medium text-foreground/70">{t("endDate")}:</dt>
                    <dd className="text-foreground">{endDateDisplay}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {/* Languages & Specialties */}
          {(job.languages.length > 0 || job.specialties.length > 0) && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-foreground">{t("requirements")}</h2>
              <div className="space-y-3">
                {job.languages.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-foreground/70">{t("languages")}</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.languages.map((lang) => (
                        <span
                          key={lang}
                          className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-700"
                        >
                          {lang.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {job.specialties.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-medium text-foreground/70">{t("specialties")}</h3>
                    <div className="flex flex-wrap gap-2">
                      {job.specialties.map((specialty) => (
                        <span
                          key={specialty}
                          className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
                        >
                          {specialty}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Application deadline */}
          {deadlineDisplay && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-foreground">{t("deadline")}</h2>
              <p className="text-sm text-foreground/70">{deadlineDisplay}</p>
            </section>
          )}

          {/* Contact */}
          {job.contactEmail && (
            <section>
              <h2 className="mb-3 text-lg font-semibold text-foreground">{t("contact")}</h2>
              <a
                href={`mailto:${job.contactEmail}`}
                className="text-sm font-medium text-secondary transition hover:text-secondary/80"
              >
                {job.contactEmail}
              </a>
            </section>
          )}
        </div>

        {/* Bottom CTA */}
        {job.status === "open" && (
          <div className="flex justify-center">
            <Link
              href={applyHref as Route}
              className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-3 font-semibold text-primary-foreground shadow-sm transition hover:shadow-md"
            >
              {applyLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
