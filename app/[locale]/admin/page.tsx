export const dynamic = "force-dynamic";

import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { isSupportedLocale, type SupportedLocale, localeLabels } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAdminDashboardData, ADMIN_ALLOWED_ROLES } from "@/lib/admin/queries";
import { AdminCreateUserForm } from "@/components/admin/create-user-form";
import { ExportDatabaseButton } from "@/components/admin/export-database-button";
import { DashboardUsersTable } from "@/components/admin/dashboard-users-table";

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
  const roleTranslations = await getTranslations({ locale, namespace: "admin.roles" });
  const navTranslations = await getTranslations({ locale, namespace: "nav" });

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

  const [dashboard, countriesQuery] = await Promise.all([
    fetchAdminDashboardData(),
    supabase.from("countries").select("code, name").order("name", { ascending: true }).limit(400),
  ]);

  if (countriesQuery.error) {
    console.error("Failed to load countries for admin create form", countriesQuery.error);
  }

  const countryOptions = (countriesQuery.data ?? []).map((country) => ({
    value: country.code,
    label: country.name ?? country.code,
  }));

  const localeOptions = Object.entries(localeLabels).map(([value, label]) => ({ value, label }));

  const numberFormatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });

  const roleOptions = ADMIN_ALLOWED_ROLES.map((value) => ({
    value,
    label: roleTranslations(value),
  }));

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
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href={`/${locale}/admin/users`}
                className="relative inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
                className="relative inline-flex items-center gap-2 rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-300"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
                className="relative inline-flex items-center gap-2 rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-300"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
                className="relative inline-flex items-center gap-2 rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-300"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
                className="relative inline-flex items-center gap-2 rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-300"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
                className="relative inline-flex items-center gap-2 rounded-full bg-brand-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-primary/90"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
                className="relative inline-flex items-center gap-2 rounded-full bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 shadow-sm transition hover:bg-gray-300"
                aria-label={
                  pendingApplicationsCount > 0
                    ? `View applications (${pendingApplicationsCount} pending)`
                    : "View applications"
                }
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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
                    className="ml-1 inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-2 text-xs font-semibold text-white"
                  >
                    {pendingApplicationsCount > 99 ? "99+" : pendingApplicationsCount}
                  </span>
                ) : null}
              </Link>
              <Link
                href={`/${locale}/admin/settings/anti-scraping`}
                className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-300"
              >
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
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

        <div className="grid gap-6 lg:grid-cols-[1fr_0.6fr]">
          <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{adminTranslations("users.heading")}</h2>
                <p className="text-sm text-foreground/70">{adminTranslations("users.caption")}</p>
              </div>
              <Link
                href={`/${locale}/directory`}
                className="hidden rounded-full border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground md:inline-flex"
              >
                {navTranslations("directory")}
              </Link>
            </div>
            <DashboardUsersTable
              users={dashboard.users}
              locale={locale}
              roleLabels={Object.fromEntries(
                ADMIN_ALLOWED_ROLES.map((role) => [role, roleTranslations(role)])
              )}
              translations={{
                nameColumn: adminTranslations("users.columns.name"),
                emailColumn: adminTranslations("users.columns.email"),
                roleColumn: adminTranslations("users.columns.role"),
                createdColumn: adminTranslations("users.columns.created"),
                statusColumn: "Status",
                actionsColumn: adminTranslations("users.columns.actions"),
                viewAction: adminTranslations("users.view"),
                fallbackName: adminTranslations("users.fallbackName"),
                empty: adminTranslations("users.empty"),
                searchPlaceholder: "Search by name or email...",
                filterByRole: "Filter by role",
                filterByStatus: "Filter by status",
                allRoles: "All Roles",
                allStatuses: "All Statuses",
                active: "Active",
                frozen: "Frozen",
                unverified: "Unverified",
              }}
            />
          </section>

          <AdminCreateUserForm
            locale={locale}
            roles={roleOptions.map((option) => ({ value: option.value, label: option.label }))}
            localeOptions={localeOptions}
            countryOptions={countryOptions}
            translations={{
              title: adminTranslations("create.title"),
              description: adminTranslations("create.description"),
              email: adminTranslations("create.email"),
              password: adminTranslations("create.password"),
              fullName: adminTranslations("create.fullName"),
              role: adminTranslations("create.role"),
              localeLabel: adminTranslations("create.locale"),
              country: adminTranslations("create.country"),
              timezone: adminTranslations("create.timezone"),
              submit: adminTranslations("create.submit"),
              success: adminTranslations("create.success"),
              error: adminTranslations("create.error"),
            }}
          />
        </div>
      </div>
    </div>
  );
}
