import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { GuideInvitationManager } from "@/components/admin/guide-invitation-manager";

export default async function GuideInvitationsPage() {
  const supabase = getSupabaseServerClient();

  // Check if user is admin
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/sign-in");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect("/");
  }

  // Fetch imported guides with their claim tokens
  const { data: importedGuides, error } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      country_code,
      profile_completed,
      profile_completion_percentage,
      application_data,
      created_at,
      guides!inner(
        headline,
        bio,
        spoken_languages,
        years_experience
      ),
      profile_claim_tokens(
        id,
        token,
        license_number,
        expires_at,
        claimed_at
      )
    `)
    .eq("role", "guide")
    .eq("application_data->>imported_from", "guides_staging")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch imported guides:", error);
  }

  const guides = importedGuides || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Vietnamese Guide Invitations
          </h1>
          <p className="text-foreground/70">
            Manage imported guide profiles and send invitation emails with claim links.
          </p>
        </header>

        <GuideInvitationManager guides={guides} />
      </div>
    </div>
  );
}
