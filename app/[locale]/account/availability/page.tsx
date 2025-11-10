export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { EnhancedAvailabilityCalendar } from "@/components/account/availability/enhanced-availability-calendar";

export default async function AvailabilityPage({
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

  if (profileError || !profileRow) {
    redirect(`/${locale}`);
  }

  // Only guides and transport providers can manage availability
  if (!["guide", "transport"].includes(profileRow.role)) {
    redirect(`/${locale}/account/profile`);
  }

  // Fetch current availability slots
  const { data: availabilitySlots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("guide_id", user.id)
    .order("starts_at", { ascending: true });

  // Fetch holds
  const { data: holds } = await supabase
    .from("availability_holds")
    .select(`
      *,
      requester:agencies!availability_holds_requester_id_fkey(name)
    `)
    .eq("holdee_id", user.id)
    .in("status", ["pending", "accepted"])
    .order("created_at", { ascending: false });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">
          Manage Availability
        </h1>
        <p className="text-sm text-foreground/70">
          Manage your availability, handle hold requests, and block dates for bookings.
        </p>
      </div>

      <EnhancedAvailabilityCalendar
        locale={locale}
        userId={user.id}
        userRole={profileRow.role as "guide" | "transport"}
        initialSlots={availabilitySlots || []}
        initialHolds={holds || []}
      />
    </div>
  );
}