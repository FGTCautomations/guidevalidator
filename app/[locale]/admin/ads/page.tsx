// Admin Ads Management Page
// Full CRUD interface for managing ads with preview, scheduling, and targeting

import { Metadata } from "next";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AdsManager } from "@/components/admin/ads-manager";

export const metadata: Metadata = {
  title: "Ads Management | Admin | GuideValidator",
  description: "Manage advertisements and sponsored content",
};

export default async function AdminAdsPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const supabase = getSupabaseServerClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  // Check admin role
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || !["admin", "super_admin"].includes(profile.role)) {
    redirect(`/${locale}`);
  }

  return (
    <div className="min-h-screen bg-background px-6 py-12 sm:px-12 lg:px-24">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="font-roboto text-3xl font-bold text-foreground">
            Ads Management
          </h1>
          <p className="font-inter text-foreground/70">
            Create, edit, and manage advertisements across the platform
          </p>
        </div>

        {/* Ads Manager Component */}
        <AdsManager />
      </div>
    </div>
  );
}
