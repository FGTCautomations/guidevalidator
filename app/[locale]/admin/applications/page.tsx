import { redirect } from "next/navigation";

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

  // Fetch all pending applications
  const [guideApps, agencyApps, dmcApps, transportApps] = await Promise.all([
    supabase
      .from("guide_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("agency_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("dmc_applications")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase
      .from("transport_applications")
      .select("*")
      .order("created_at", { ascending: false }),
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
          <h1 className="text-3xl font-bold text-foreground">Applications Management</h1>
          <p className="mt-2 text-sm text-foreground/70">
            Review and approve or decline new role applications from guides, agencies, DMCs, and transport providers.
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