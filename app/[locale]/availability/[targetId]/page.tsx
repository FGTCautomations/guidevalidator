export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { PublicAvailabilityCalendar } from "@/components/availability/public-availability-calendar";
import type { SupportedLocale } from "@/i18n/config";

type PageProps = {
  params: { locale: SupportedLocale; targetId: string };
  searchParams?: { role?: string };
};

export default async function AvailabilityPage({ params, searchParams }: PageProps) {
  const supabase = await getSupabaseServerClient();
  const targetId = params.targetId;
  const targetRole = (searchParams?.role as "guide" | "transport") || "guide";

  // Get current user (if logged in)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let currentUserRole: string | undefined;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile) {
      currentUserRole = profile.role;
    } else {
      // Check if it's an agency
      const { data: agency } = await supabase
        .from("agencies")
        .select("type")
        .eq("id", user.id)
        .maybeSingle();

      if (agency) {
        currentUserRole = agency.type;
      }
    }
  }

  // Fetch target profile information
  let targetName = "User";
  let targetData: any = null;

  if (targetRole === "guide") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", targetId)
      .eq("role", "guide")
      .maybeSingle();

    if (!profile) {
      notFound();
    }

    targetName = profile.full_name || "Guide";
    targetData = profile;
  } else if (targetRole === "transport") {
    const { data: agency } = await supabase
      .from("agencies")
      .select("id, name, type")
      .eq("id", targetId)
      .eq("type", "transport")
      .maybeSingle();

    if (!agency) {
      notFound();
    }

    targetName = agency.name || "Transport Company";
    targetData = agency;
  }

  // Fetch availability slots (blocked times)
  const { data: availabilitySlots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("guide_id", targetId)
    .order("starts_at", { ascending: true });

  // Fetch holds for this target
  const { data: holds } = await supabase
    .from("availability_holds")
    .select("*")
    .eq("holdee_id", targetId)
    .in("status", ["pending", "accepted"]);

  return (
    <div className="container mx-auto px-4 py-8">
      <PublicAvailabilityCalendar
        targetId={targetId}
        targetName={targetName}
        targetRole={targetRole}
        initialSlots={availabilitySlots || []}
        initialHolds={holds || []}
        currentUserId={user?.id}
        currentUserRole={currentUserRole}
        locale={params.locale}
      />
    </div>
  );
}
