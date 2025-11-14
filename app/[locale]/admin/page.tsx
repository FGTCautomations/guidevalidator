export const dynamic = "force-dynamic";

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAdminDashboardData } from "@/lib/admin/queries";
import { ExportDatabaseButton } from "@/components/admin/export-database-button";

export const runtime = "nodejs";

function formatCurrency(amountCents: number, currency: string = "EUR", locale: string) {
  const amount = amountCents / 100;
  try {
    return new Intl.NumberFormat(locale, { style: "currency", currency }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
}

export default async function AdminDashboardPage({ params }: { params: { locale: string } }) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const adminTranslations = await getTranslations({ locale, namespace: "admin.dashboard" });

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

  const dashboard = await fetchAdminDashboardData();
  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  const pendingApplicationsCount = dashboard.pendingApplicationsCount;

  const cards = [
    {
      label: adminTranslations("cards.totalUsers"),
      value: numberFormatter.format(dashboard.metrics.totalUsers),
    },
    {
      label: adminTranslations("cards.newUsers"),
      value: numberFormatter.format(dashboard.metrics.newUsers7d),
    },
    {
      label: adminTranslations("cards.activeSubscriptions"),
      value: numberFormatter.format(dashboard.metrics.activeSubscriptions),
    },
    {
      label: adminTranslations("cards.totalIncome"),
      value: formatCurrency(dashboard.metrics.totalIncomeCents, "EUR", locale),
    },
  ];

  return (
    <div className="flex flex-col gap-8 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">{adminTranslations("title")}</h1>
              <p className="text-sm text-foreground/70 sm:text-base">{adminTranslations("subtitle")}</p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={`/${locale}/admin/users`}
                className="relative inline-flex items-center gap-3 rounded-2xl bg-blue-600 px-8 py-6 text-base font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Search All Accounts</span>
              </Link>
              <Link
                href={`/${locale}/admin/bulk-upload`}
                className="relative inline-flex items-center gap-3 rounded-2xl bg-gray-200 px-8 py-6 text-base font-semibold text-gray-700 shadow-md transition hover:bg-gray-300 hover:shadow-lg"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Bulk Upload</span>
              </Link>
              <ExportDatabaseButton />
              <Link
                href={`/${locale}/admin/verification`}
                className="relative inline-flex items-center gap-3 rounded-2xl bg-gray-200 px-8 py-6 text-base font-semibold text-gray-700 shadow-md transition hover:bg-gray-300 hover:shadow-lg"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Verification</span>
              </Link>
              <Link
                href={`/${locale}/admin/reviews`}
                className="relative inline-flex items-center gap-3 rounded-2xl bg-gray-200 px-8 py-6 text-base font-semibold text-gray-700 shadow-md transition hover:bg-gray-300 hover:shadow-lg"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Reviews</span>
              </Link>
              <Link
                href={`/${locale}/admin/reviews/stats`}
                className="relative inline-flex items-center gap-3 rounded-2xl bg-gray-200 px-8 py-6 text-base font-semibold text-gray-700 shadow-md transition hover:bg-gray-300 hover:shadow-lg"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Review Stats</span>
              </Link>
              <Link
                href={`/${locale}/admin/ads`}
                className="relative inline-flex items-center gap-3 rounded-2xl bg-brand-primary px-8 py-6 text-base font-semibold text-white shadow-md transition hover:bg-brand-primary/90 hover:shadow-lg"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Ads Management</span>
              </Link>
              <Link
                href={`/${locale}/admin/applications`}
                className="relative inline-flex items-center gap-3 rounded-2xl bg-gray-200 px-8 py-6 text-base font-semibold text-gray-700 shadow-md transition hover:bg-gray-300 hover:shadow-lg"
                aria-label={
                  pendingApplicationsCount > 0
                    ? `View applications (${pendingApplicationsCount} pending)`
                    : "View applications"
                }
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2Zm7-6v-5a7 7 0 1 0-14 0v5l-2 2v1h18v-1l-2-2Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Applications</span>
                {pendingApplicationsCount > 0 ? (
                  <span
                    aria-hidden="true"
                    className="ml-1 inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-semibold text-white"
                  >
                    {pendingApplicationsCount > 99 ? "99+" : pendingApplicationsCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href={`/${locale}/admin/settings/anti-scraping`}
                className="inline-flex items-center gap-3 rounded-2xl border border-gray-300 bg-gray-200 px-8 py-6 text-base font-semibold text-gray-700 shadow-md transition hover:bg-gray-300 hover:shadow-lg"
              >
                <svg
                  aria-hidden="true"
                  className="h-6 w-6"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    d="M12 3 3 8.25v7.5L12 21l9-5.25v-7.5L12 3Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M9 12a3 3 0 0 0 6 0"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Anti-Scraping</span>
              </Link>
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => (
            <div
              key={card.label}
              className="space-y-2 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm"
            >
              <p className="text-sm font-medium text-foreground/70">{card.label}</p>
              <p className="text-2xl font-semibold text-foreground">{card.value}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
