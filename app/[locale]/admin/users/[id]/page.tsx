import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchAdminUserDetail } from "@/lib/admin/queries";
import { fetchUserStatistics } from "@/lib/admin/user-statistics";
import { UserAvatarSection } from "@/components/admin/user-avatar-section";
import { EditableApplicationData } from "@/components/admin/editable-application-data";
import { UserStatisticsDashboard } from "@/components/admin/user-statistics-dashboard";
import { FreezeUserForm } from "@/components/admin/freeze-user-form";
import { UnfreezeUserForm } from "@/components/admin/unfreeze-user-form";
import { AdminDeleteUserForm } from "@/components/admin/delete-user-form";

export default async function AdminUserDetailPage({
  params,
}: {
  params: { locale: string; id: string };
}) {
  const { locale: requestedLocale, id } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "admin.detail" });

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

  const detail = await fetchAdminUserDetail(id);
  if (!detail) {
    notFound();
  }

  // Fetch user statistics
  const statistics = await fetchUserStatistics(id, detail.profile.organizationId);

  // Get avatar URL from profile
  const { data: profileWithAvatar } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", id)
    .single();

  const avatarUrl = profileWithAvatar?.avatar_url || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-[1800px]">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-foreground/60 mb-2">
            <a href={`/${locale}/admin`} className="hover:text-foreground transition-colors">
              Admin Dashboard
            </a>
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
            <span>User Profile</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">User Management</h1>
          <p className="text-foreground/70 mt-1">
            View and manage all user information, statistics, and account settings
          </p>
        </div>

        {/* Main Layout - 3 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Avatar & Quick Actions */}
          <div className="lg:col-span-3 space-y-6">
            {/* Avatar Section */}
            <UserAvatarSection
              userId={detail.id}
              userName={detail.profile.fullName}
              userEmail={detail.email}
              avatarUrl={avatarUrl}
              role={detail.profile.role}
              verified={detail.profile.verified}
              isFrozen={detail.isFrozen}
            />

            {/* Quick Stats */}
            <div className="rounded-xl border border-foreground/10 bg-white p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                Quick Stats
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Messages</span>
                  <span className="text-sm font-semibold text-foreground">
                    {statistics.totalMessages}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Conversations</span>
                  <span className="text-sm font-semibold text-foreground">
                    {statistics.totalConversations}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Payments</span>
                  <span className="text-sm font-semibold text-foreground">
                    {statistics.totalPayments}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-foreground/60">Account Age</span>
                  <span className="text-sm font-semibold text-foreground">
                    {statistics.accountAge} days
                  </span>
                </div>
              </div>
            </div>

            {/* Account Actions */}
            <div className="rounded-xl border border-foreground/10 bg-white p-6 space-y-4">
              <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                Account Actions
              </h3>

              {/* Status Display */}
              <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-foreground/70">Status:</span>
                  <span
                    className={`font-semibold px-2 py-1 rounded ${
                      detail.isFrozen
                        ? "bg-orange-100 text-orange-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {detail.isFrozen ? "❄️ Frozen" : "✅ Active"}
                  </span>
                </div>
                {detail.profile.applicationStatus && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-medium text-foreground/70">Application:</span>
                    <span
                      className={`font-semibold capitalize px-2 py-1 rounded ${
                        detail.profile.applicationStatus === "approved"
                          ? "bg-green-100 text-green-800"
                          : detail.profile.applicationStatus === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {detail.profile.applicationStatus}
                    </span>
                  </div>
                )}
                {detail.profile.rejectionReason && (
                  <div className="text-xs text-red-700 mt-2 p-2 bg-red-50 rounded">
                    <strong>Reason:</strong> {detail.profile.rejectionReason}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {detail.isFrozen || detail.profile.rejectionReason?.startsWith("FROZEN:") ? (
                  <UnfreezeUserForm
                    userId={detail.id}
                    userType={detail.profile.role as any}
                    userName={detail.profile.fullName || detail.email || "Unknown"}
                    locale={locale}
                  />
                ) : (
                  <FreezeUserForm
                    userId={detail.id}
                    userType={detail.profile.role as any}
                    userName={detail.profile.fullName || detail.email || "Unknown"}
                    locale={locale}
                  />
                )}

                <AdminDeleteUserForm
                  userId={detail.id}
                  locale={locale}
                  redirectTo={`/${locale}/admin`}
                  translations={{
                    heading: "Delete Account",
                    confirm: "Are you sure you want to permanently delete this account? This action cannot be undone.",
                    cancel: "Cancel",
                    submit: "Delete Account",
                    success: "Account deleted successfully",
                    error: "Failed to delete account",
                  }}
                />
              </div>
            </div>

            {/* Subscriptions Summary */}
            {detail.subscriptions.length > 0 && (
              <div className="rounded-xl border border-foreground/10 bg-white p-6 space-y-3">
                <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                  Active Subscriptions
                </h3>
                {detail.subscriptions
                  .filter((sub) => ["active", "trialing"].includes(sub.status))
                  .map((sub) => (
                    <div
                      key={sub.id}
                      className="p-3 bg-green-50 border border-green-200 rounded-lg"
                    >
                      <div className="text-sm font-semibold text-green-800">
                        {sub.planCode || "Unknown Plan"}
                      </div>
                      <div className="text-xs text-green-600 mt-1">
                        {sub.status.toUpperCase()}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Middle Column - Application Data & Details */}
          <div className="lg:col-span-5 space-y-6">
            {/* Application Data */}
            <EditableApplicationData
              userId={detail.id}
              userRole={detail.profile.role}
              applicationData={detail.applicationData}
              guideData={detail.guideData}
              agencyData={detail.agencyData}
            />

            {/* All Subscriptions */}
            <div className="rounded-xl border border-foreground/10 bg-white p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">All Subscriptions</h3>
              {detail.subscriptions.length === 0 ? (
                <p className="text-sm text-foreground/60">No subscriptions found</p>
              ) : (
                <div className="space-y-2">
                  {detail.subscriptions.map((subscription) => {
                    const nextRenewal = subscription.currentPeriodEnd
                      ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                          new Date(subscription.currentPeriodEnd)
                        )
                      : "--";
                    return (
                      <div
                        key={subscription.id}
                        className="rounded-lg border border-foreground/10 bg-gray-50 p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">
                              {subscription.planCode || "Unknown Plan"}
                            </p>
                            <p className="text-xs text-foreground/60 mt-1">
                              Next renewal: {nextRenewal}
                            </p>
                          </div>
                          <span
                            className={`text-xs uppercase tracking-wide px-2 py-1 rounded ${
                              ["active", "trialing"].includes(subscription.status)
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-200 text-gray-700"
                            }`}
                          >
                            {subscription.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Payment History */}
            <div className="rounded-xl border border-foreground/10 bg-white p-6 space-y-4">
              <h3 className="text-lg font-semibold text-foreground">Payment History</h3>
              {detail.payments.length === 0 ? (
                <p className="text-sm text-foreground/60">No payments found</p>
              ) : (
                <div className="space-y-2">
                  {detail.payments.slice(0, 10).map((payment) => {
                    const paidAt = payment.paidAt
                      ? new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                        }).format(new Date(payment.paidAt))
                      : "--";

                    const amount = payment.amountCents
                      ? new Intl.NumberFormat(locale, {
                          style: "currency",
                          currency: payment.currency || "EUR",
                        }).format(payment.amountCents / 100)
                      : "--";

                    return (
                      <div
                        key={payment.id}
                        className="rounded-lg border border-foreground/10 bg-gray-50 p-4"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-foreground">
                              {payment.planCode || "Unknown Plan"}
                            </p>
                            <p className="text-xs text-foreground/60 mt-1">{paidAt}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-foreground">{amount}</p>
                            <span
                              className={`text-xs uppercase tracking-wide ${
                                payment.status === "paid" || payment.status === "succeeded"
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {payment.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {detail.payments.length > 10 && (
                    <p className="text-xs text-foreground/50 text-center pt-2">
                      Showing 10 of {detail.payments.length} payments
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Statistics */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-xl border border-foreground/10 bg-white p-6">
              <UserStatisticsDashboard
                statistics={statistics}
                userRole={detail.profile.role}
                locale={locale}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
