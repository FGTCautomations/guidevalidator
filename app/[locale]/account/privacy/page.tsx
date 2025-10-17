export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { PrivacyDashboard } from "@/components/gdpr/privacy-dashboard";

type PageProps = {
  params: { locale: string };
};

export default async function PrivacyPage({ params }: PageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    redirect("/" + requestedLocale);
  }

  const locale = requestedLocale as SupportedLocale;
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  // Fetch user consents
  const { data: consents } = await supabase
    .from("user_consents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch DSAR requests
  const { data: dsarRequests } = await supabase
    .from("dsar_requests")
    .select("*")
    .eq("user_id", user.id)
    .order("requested_at", { ascending: false })
    .limit(10);

  // Check if account is marked for deletion
  const { data: profile } = await supabase
    .from("profiles")
    .select("deleted_at, deletion_requested_at, deletion_reason")
    .eq("id", user.id)
    .maybeSingle();

  const { data: agency } = await supabase
    .from("agencies")
    .select("deleted_at, deletion_requested_at, deletion_reason")
    .eq("id", user.id)
    .maybeSingle();

  const deletionInfo = profile || agency;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Privacy & Data</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your privacy settings, view your data, and exercise your rights under GDPR and
            CCPA.
          </p>
        </div>

        <PrivacyDashboard
          locale={locale}
          userId={user.id}
          userEmail={user.email || ""}
          consents={consents || []}
          dsarRequests={dsarRequests || []}
          deletionInfo={deletionInfo}
        />
      </div>
    </div>
  );
}
