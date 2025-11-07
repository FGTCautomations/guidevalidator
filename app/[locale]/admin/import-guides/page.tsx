import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ImportGuidesButton } from "@/components/admin/import-guides-button";

export default async function ImportGuidesPage() {
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

  // Count staging guides
  const { count: stagingCount } = await supabase
    .from("guides_staging")
    .select("*", { count: "exact", head: true })
    .not("card_number", "is", null);

  // Count already imported guides
  const { count: importedCount } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .eq("application_data->>imported_from", "guides_staging");

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Import Vietnamese Guides from Staging
          </h1>
          <p className="text-foreground/70">
            Import guide data from the guides_staging table into the main system.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-foreground/10 p-6">
            <p className="text-sm text-foreground/60 mb-1">Guides in Staging</p>
            <p className="text-4xl font-bold text-foreground">{stagingCount || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-foreground/10 p-6">
            <p className="text-sm text-foreground/60 mb-1">Already Imported</p>
            <p className="text-4xl font-bold text-green-600">{importedCount || 0}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-foreground/10 p-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Import Process</h2>

          <div className="space-y-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">1</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Create Auth Users</p>
                <p className="text-sm text-foreground/70">
                  Creates authentication accounts with temporary emails
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">2</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Create Profiles</p>
                <p className="text-sm text-foreground/70">
                  Creates profile records with incomplete status (30% complete)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">3</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Create Guide Entries</p>
                <p className="text-sm text-foreground/70">
                  Creates guides table entries with basic information
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">4</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Store Credentials</p>
                <p className="text-sm text-foreground/70">
                  Creates guide_credentials entries with license information
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-primary">5</span>
              </div>
              <div>
                <p className="font-medium text-foreground">Generate Claim Tokens</p>
                <p className="text-sm text-foreground/70">
                  Creates secure tokens for guides to claim their profiles (90-day expiry)
                </p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h3 className="text-sm font-semibold text-yellow-900 mb-2">⚠️ Important Notes</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• This process will skip guides that have already been imported</li>
              <li>• Guides must have a valid license number (card_number) to be imported</li>
              <li>• Imported guides will appear in the directory with "Incomplete Profile" badge</li>
              <li>• After import, use the Invitations page to send claim links to guides</li>
            </ul>
          </div>

          <ImportGuidesButton />
        </div>

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">After Import</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>
              Go to{" "}
              <a href="/admin/guide-invitations" className="underline font-medium">
                Guide Invitations
              </a>{" "}
              page
            </li>
            <li>Select guides and export claim links to CSV</li>
            <li>Send invitation emails to guides with their claim links</li>
            <li>Guides claim profiles and complete missing information</li>
            <li>Monitor progress from the Invitations dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
