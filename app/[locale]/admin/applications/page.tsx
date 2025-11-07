import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ApplicationsManager } from "@/components/admin/applications-manager";

export default async function AdminApplicationsPage({
  params,
}: {
  params: { locale: string };
}) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect("/" + requestedLocale);
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "admin.applications" });
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profileRow || !["admin", "super_admin"].includes(profileRow.role)) {
    redirect(`/${locale}`);
  }

  // Fetch all pending applications from master tables
  const [guideApps, agencyApps, dmcApps, transportApps] = await Promise.all([
    // Query guides table with pending status
    supabase
      .from("guides")
      .select("*, profiles!inner(id, full_name, application_status, application_submitted_at, created_at)")
      .eq("profiles.application_status", "pending")
      .order("profiles.application_submitted_at", { ascending: false, nullsFirst: false }),
    // Query agencies table with pending status and type='agency'
    supabase
      .from("agencies")
      .select("*")
      .eq("application_status", "pending")
      .eq("type", "agency")
      .order("application_submitted_at", { ascending: false, nullsFirst: false }),
    // Query agencies table with pending status and type='dmc'
    supabase
      .from("agencies")
      .select("*")
      .eq("application_status", "pending")
      .eq("type", "dmc")
      .order("application_submitted_at", { ascending: false, nullsFirst: false }),
    // Query agencies table with pending status and type='transport'
    supabase
      .from("agencies")
      .select("*")
      .eq("application_status", "pending")
      .eq("type", "transport")
      .order("application_submitted_at", { ascending: false, nullsFirst: false }),
  ]);

  const applications = {
    guide: guideApps.data || [],
    agency: agencyApps.data || [],
    dmc: dmcApps.data || [],
    transport: transportApps.data || [],
  };

  return (
    <div className="min-h-[60vh] bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="mt-2 text-sm text-foreground/70">
            {t("subtitle")}
          </p>
        </div>

        <ApplicationsManager
          locale={locale}
          applications={applications}
        />
      </div>
    </div>
  );
}