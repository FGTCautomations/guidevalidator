export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { UsersManager } from "@/components/admin/users-manager";

export default async function AdminUsersPage({
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

  // Fetch all users with their complete information
  const [guides, agencies, dmcs, transport] = await Promise.all([
    // Fetch all guides with profiles
    supabase
      .from("guides")
      .select(`
        *,
        profiles!inner(
          id,
          full_name,
          email,
          role,
          country_code,
          timezone,
          avatar_url,
          verified,
          license_verified,
          application_status,
          application_submitted_at,
          application_reviewed_at,
          application_reviewed_by,
          rejection_reason,
          created_at,
          updated_at
        )
      `)
      .order("created_at", { ascending: false }),

    // Fetch all agencies
    supabase
      .from("agencies")
      .select("*")
      .eq("type", "agency")
      .order("created_at", { ascending: false }),

    // Fetch all DMCs
    supabase
      .from("agencies")
      .select("*")
      .eq("type", "dmc")
      .order("created_at", { ascending: false }),

    // Fetch all transport companies
    supabase
      .from("agencies")
      .select("*")
      .eq("type", "transport")
      .order("created_at", { ascending: false }),
  ]);

  const users = {
    guides: guides.data || [],
    agencies: agencies.data || [],
    dmcs: dmcs.data || [],
    transport: transport.data || [],
  };

  return (
    <div className="min-h-[60vh] bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Users Management</h1>
          <p className="mt-2 text-sm text-foreground/70">
            View, edit, freeze, or delete user accounts. Manage all guides, agencies, DMCs, and transport providers.
          </p>
        </div>

        <UsersManager
          locale={locale}
          users={users}
        />
      </div>
    </div>
  );
}
