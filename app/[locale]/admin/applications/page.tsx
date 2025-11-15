export const dynamic = "force-dynamic";

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

  // Fetch pending applications from master tables (limited to 1000 each)
  // Only show applications where application_submitted_at is not null (actual form submissions, not imports)
  const [guideApps, agencyApps, dmcApps, transportApps] = await Promise.all([
    // Query profiles table for guide applications
    supabase
      .from("profiles")
      .select("id, full_name, application_status, application_submitted_at, created_at, updated_at, locale, role")
      .eq("application_status", "pending")
      .eq("role", "guide")
      .not("application_submitted_at", "is", null)
      .order("application_submitted_at", { ascending: false, nullsFirst: false })
      .limit(1000),
    // Query agencies table with pending status and type='agency'
    supabase
      .from("agencies")
      .select("*")
      .eq("application_status", "pending")
      .eq("type", "agency")
      .not("application_submitted_at", "is", null)
      .order("application_submitted_at", { ascending: false, nullsFirst: false })
      .limit(1000),
    // Query agencies table with pending status and type='dmc'
    supabase
      .from("agencies")
      .select("*")
      .eq("application_status", "pending")
      .eq("type", "dmc")
      .not("application_submitted_at", "is", null)
      .order("application_submitted_at", { ascending: false, nullsFirst: false })
      .limit(1000),
    // Query agencies table with pending status and type='transport'
    supabase
      .from("agencies")
      .select("*")
      .eq("application_status", "pending")
      .eq("type", "transport")
      .not("application_submitted_at", "is", null)
      .order("application_submitted_at", { ascending: false, nullsFirst: false })
      .limit(1000),
  ]);

  // Fetch emails for guide applications from auth.users
  const guideAppsWithEmails = await Promise.all(
    (guideApps.data || []).map(async (app: any) => {
      const { data: authUser } = await supabase.auth.admin.getUserById(app.id);
      return {
        ...app,
        email: authUser?.user?.email || "No email",
      };
    })
  );

  const applications = {
    guide: guideAppsWithEmails as any[],
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