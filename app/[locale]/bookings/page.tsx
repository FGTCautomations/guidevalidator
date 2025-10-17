import { redirect } from "next/navigation";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { BookingRequestManager } from "@/components/bookings/booking-request-manager";

export default async function BookingsPage({
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

  // Check if user is a profile (guide/admin)
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  // Check if user is an agency (agency/dmc/transport)
  const { data: agencyRow, error: agencyError } = await supabase
    .from("agencies")
    .select("id, type")
    .eq("id", user.id)
    .maybeSingle();

  // Determine user type and role
  let userRole: string;
  if (profileRow) {
    userRole = profileRow.role;
  } else if (agencyRow) {
    userRole = agencyRow.type;
  } else {
    redirect(`/${locale}`);
    return;
  }

  // Only agencies and DMCs can make booking requests
  if (!["agency", "dmc"].includes(userRole)) {
    redirect(`/${locale}/directory`);
  }

  // Fetch guides for booking requests
  const { data: guideProfiles, error: guidesError } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      email,
      role
    `)
    .eq("role", "guide")
    .order("full_name");

  // Fetch transport companies (agencies with type='transport')
  const { data: transportAgencies, error: transportError } = await supabase
    .from("agencies")
    .select(`
      id,
      name,
      contact_email,
      type
    `)
    .eq("type", "transport")
    .order("name");

  // Combine providers
  const availableProviders = [
    ...(guideProfiles || []).map((profile) => ({
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: "guide" as const,
      type: "guide" as const,
    })),
    ...(transportAgencies || []).map((agency) => ({
      id: agency.id,
      name: agency.name,
      email: agency.contact_email,
      role: "transport" as const,
      type: "transport" as const,
    })),
  ];

  // Fetch user's booking requests - check if table exists
  const { data: bookingRequests, error: requestsError } = await supabase
    .from("availability_holds")
    .select(`
      *,
      requester:agencies!availability_holds_requester_id_fkey(id, name)
    `)
    .eq("requester_id", user.id)
    .order("created_at", { ascending: false });

  const providersError = guidesError || transportError;

  if (providersError || requestsError) {
    console.error("Bookings page errors:", {
      guidesError,
      transportError,
      requestsError,
    });
    return (
      <div className="min-h-[60vh] bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold text-foreground">
              Availability Holds
            </h1>
            <p className="text-sm text-red-600">
              Unable to load booking data. This feature is being updated to work with the new availability system.
            </p>
            <p className="text-sm text-foreground/70 mt-4">
              In the meantime, you can view guide and transport calendars from the directory and request holds directly.
            </p>
            <a
              href={`/${locale}/directory/guides`}
              className="mt-4 inline-block rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
            >
              Go to Directory
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-bold text-foreground">
            Availability Holds
          </h1>
          <p className="text-sm text-foreground/70">
            View and manage your availability hold requests for guides and transport providers.
          </p>
        </div>

        <BookingRequestManager
          locale={locale}
          userId={user.id}
          userRole={userRole as "agency" | "dmc"}
          availableProviders={availableProviders || []}
          bookingRequests={bookingRequests || []}
        />
      </div>
    </div>
  );
}