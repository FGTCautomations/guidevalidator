import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import Link from "next/link";

export default async function JobsPreviewPage({ params }: { params: { locale: string } }) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "jobs" });

  // Dummy job listings to show what's behind the paywall
  const dummyJobs = [
    {
      id: "1",
      title: "Senior Tour Guide - Paris Museums",
      company: "Elite Cultural Tours",
      location: "Paris, France",
      type: "Full-time",
      salary: "€3,500 - €4,200/mo",
      posted: "2 days ago",
    },
    {
      id: "2",
      title: "Luxury Travel Coordinator",
      company: "Premium Travel Agency",
      location: "Dubai, UAE",
      type: "Contract",
      salary: "$5,000 - $7,000/mo",
      posted: "5 days ago",
    },
    {
      id: "3",
      title: "Adventure Guide - Mountain Expeditions",
      company: "Alpine Adventures DMC",
      location: "Swiss Alps, Switzerland",
      type: "Seasonal",
      salary: "CHF 4,000 - CHF 5,500/mo",
      posted: "1 week ago",
    },
    {
      id: "4",
      title: "Private Driver - Luxury Fleet",
      company: "VIP Transport Services",
      location: "Monaco",
      type: "Full-time",
      salary: "€3,000 - €3,800/mo",
      posted: "3 days ago",
    },
  ];

  return (
    <div className="relative flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-sm text-foreground/70 sm:text-base">{t("description")}</p>
        </div>
      </div>

      {/* Preview Content with Blur */}
      <div className="relative mx-auto w-full max-w-6xl">
        {/* Blurred preview grid */}
        <div className="pointer-events-none blur-sm filter">
          <div className="space-y-4">
            {dummyJobs.map((job) => (
              <div
                key={job.id}
                className="rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
                    <p className="text-sm text-foreground/70">{job.company}</p>
                    <div className="flex flex-wrap gap-3 text-sm text-foreground/60">
                      <span>📍 {job.location}</span>
                      <span>• {job.type}</span>
                      <span>• 💰 {job.salary}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-foreground/50">{job.posted}</span>
                    <button className="rounded-[var(--radius-lg)] bg-foreground px-4 py-2 text-sm font-medium text-background">
                      Apply
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paywall Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-white/80 to-white">
          <div className="mx-auto max-w-xl space-y-6 rounded-[var(--radius-xl)] border border-foreground/20 bg-white p-8 text-center shadow-xl">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Access Our Job Board
              </h2>
              <p className="text-sm text-foreground/70">
                Join Guide Validator to access exclusive job opportunities from verified employers worldwide.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-left text-sm text-foreground/80">
                <span className="text-emerald-600">✓</span>
                <span>Browse exclusive job postings from verified companies</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm text-foreground/80">
                <span className="text-emerald-600">✓</span>
                <span>Apply directly with your validated profile</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm text-foreground/80">
                <span className="text-emerald-600">✓</span>
                <span>Get notified about new opportunities</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm text-foreground/80">
                <span className="text-emerald-600">✓</span>
                <span>Filter by location, salary, and job type</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Link
                href={`/${locale}/auth/sign-in`}
                className="flex-1 rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                Sign In
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className="flex-1 rounded-[var(--radius-lg)] bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                View Pricing
              </Link>
            </div>

            <p className="text-xs text-foreground/50">
              Already have an account?{" "}
              <Link href={`/${locale}/auth/sign-in`} className="text-foreground underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}