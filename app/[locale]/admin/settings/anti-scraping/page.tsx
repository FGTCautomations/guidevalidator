import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AntiScrapingSettingsForm } from "@/components/admin/anti-scraping-settings-form";
import { RefreshAntiScrapingStatsButton } from "@/components/admin/refresh-anti-scraping-stats-button";

export const metadata = {
  title: "Anti-Scraping Settings | Admin",
  description: "Configure anti-scraping and contact reveal settings",
};

type PageProps = {
  params: { locale: string };
};

export default async function AntiScrapingSettingsPage({ params }: PageProps) {
  const supabase = getSupabaseServerClient();

  // Check authentication and admin role
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${params.locale}/auth/sign-in`);
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  console.log("[AntiScrapingSettings] User:", user.id);
  console.log("[AntiScrapingSettings] Profile:", profile);
  console.log("[AntiScrapingSettings] Error:", profileError);

  if (!profile || (profile?.role !== "admin" && profile?.role !== "super_admin")) {
    redirect(`/${params.locale}`);
  }

  // Get current settings
  const { data: settings } = await supabase
    .from("contact_reveal_settings")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  // Get contact reveal statistics
  const { count: totalReveals } = await supabase
    .from("contact_reveals")
    .select("*", { count: "exact", head: true });

  const { count: revealsToday } = await supabase
    .from("contact_reveals")
    .select("*", { count: "exact", head: true })
    .gte("revealed_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Anti-Scraping Settings</h1>
          <p className="mt-2 text-foreground/70">
            Configure rate limits and monitor contact information reveals
          </p>
        </div>
        <RefreshAntiScrapingStatsButton />
      </div>

      {/* Statistics Cards */}
      <div className="mb-8 grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-foreground/10 bg-white p-6">
          <div className="text-sm font-medium text-foreground/60">Total Reveals</div>
          <div className="mt-2 text-3xl font-bold text-foreground">{totalReveals || 0}</div>
          <div className="mt-1 text-xs text-foreground/50">All time</div>
        </div>

        <div className="rounded-lg border border-foreground/10 bg-white p-6">
          <div className="text-sm font-medium text-foreground/60">Reveals Today</div>
          <div className="mt-2 text-3xl font-bold text-primary">{revealsToday || 0}</div>
          <div className="mt-1 text-xs text-foreground/50">Last 24 hours</div>
        </div>

        <div className="rounded-lg border border-foreground/10 bg-white p-6">
          <div className="text-sm font-medium text-foreground/60">Current Limits</div>
          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Free:</span>
              <span className="text-lg font-bold text-foreground">{settings?.max_reveals_free || 10}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">Pro:</span>
              <span className="text-lg font-bold text-primary">{settings?.max_reveals_pro || 50}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground/60">DMC:</span>
              <span className="text-lg font-bold text-purple-600">{settings?.max_reveals_dmc || 50}</span>
            </div>
          </div>
          <div className="mt-1 text-xs text-foreground/50">Per user per day</div>
        </div>
      </div>

      {/* Settings Form */}
      <div className="rounded-lg border border-foreground/10 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">Rate Limit Configuration</h2>
        <p className="mb-6 text-sm text-foreground/70">
          Configure different rate limits for each subscription tier. Users are automatically assigned limits based on their active subscription.
        </p>
        <AntiScrapingSettingsForm
          currentSettings={settings || {
            max_reveals_free: 10,
            max_reveals_pro: 50,
            max_reveals_dmc: 50
          }}
          locale={params.locale}
        />
      </div>

      {/* Protection Features */}
      <div className="mt-8 rounded-lg border border-foreground/10 bg-white p-6">
        <h2 className="mb-4 text-xl font-semibold text-foreground">
          Active Protection Features
        </h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </div>
            <div>
              <h3 className="font-medium text-foreground">2-Step Contact Reveal</h3>
              <p className="text-sm text-foreground/60">
                Users must confirm twice before accessing contact information
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </div>
            <div>
              <h3 className="font-medium text-foreground">Text Selection Protection</h3>
              <p className="text-sm text-foreground/60">
                Contact information cannot be copied via text selection
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </div>
            <div>
              <h3 className="font-medium text-foreground">Print Protection</h3>
              <p className="text-sm text-foreground/60">
                Sensitive data is hidden when pages are printed
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </div>
            <div>
              <h3 className="font-medium text-foreground">Dynamic Watermarks</h3>
              <p className="text-sm text-foreground/60">
                User email and timestamp watermarks on all profile pages
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </div>
            <div>
              <h3 className="font-medium text-foreground">Activity Logging</h3>
              <p className="text-sm text-foreground/60">
                All contact reveals are logged with IP address and user agent
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="mt-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
              ✓
            </div>
            <div>
              <h3 className="font-medium text-foreground">Rate Limiting</h3>
              <p className="text-sm text-foreground/60">
                Configurable daily limits per user (admins exempt)
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
