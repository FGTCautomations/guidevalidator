import { notFound, redirect } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { ProfileCompletionForm } from "@/components/onboarding/profile-completion-form";

export default async function CompleteProfilePage({
  params,
  searchParams,
}: {
  params: { locale: string };
  searchParams: { token?: string; claimed?: string };
}) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const token = searchParams.token;
  const claimed = searchParams.claimed === "true";

  // Handle claimed profiles (user just created account via claim link)
  if (claimed) {
    const supabase = getSupabaseServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect(`/${locale}/auth/sign-in`);
    }

    // Fetch the user's profile and guide data
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || profile.role !== "guide") {
      redirect(`/${locale}/account`);
    }

    const { data: guide } = await supabase
      .from("guides")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle();

    const { data: countries } = await supabase
      .from("countries")
      .select("code, name")
      .order("name");

    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
        <header className="mb-8">
          <div className="mb-4 inline-block rounded-full bg-green-100 px-4 py-2 text-sm font-semibold text-green-800">
            ✓ Profile Claimed Successfully
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Guide Profile
          </h1>
          <p className="text-foreground/70">
            Welcome, {profile.full_name}! Your profile has been imported from our database. Please
            complete the missing information below to make your profile visible to travel agencies
            and DMCs.
          </p>
        </header>

        <ProfileCompletionForm
          guideId={user.id}
          profileId={user.id}
          token={null}
          locale={locale}
          countries={countries || []}
          claimedProfile={true}
          initialData={{
            full_name: profile.full_name,
            headline: guide?.headline || "",
            bio: guide?.bio || "",
            years_experience: guide?.years_experience || 0,
            specialties: guide?.specialties || [],
            spoken_languages: guide?.spoken_languages || [],
            license_number: "",
            license_authority: "",
          }}
        />
      </div>
    );
  }

  if (!token) {
    return (
      <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h1 className="text-2xl font-bold text-red-900 mb-2">Invalid Link</h1>
          <p className="text-red-700">
            This profile completion link is invalid or has expired. Please contact support if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  // Find the guide/organization with this token
  const serviceClient = getSupabaseServiceClient();

  // Fetch countries for the form
  const { data: countries } = await serviceClient
    .from("countries")
    .select("code, name")
    .order("name");

  // Check guides first
  const { data: guides } = await serviceClient
    .from("guides")
    .select("*, profiles!inner(*)")
    .eq("application_data->>profile_completion_token", token)
    .limit(1);

  if (guides && guides.length > 0) {
    const guide = guides[0];
    const profile = guide.profiles;

    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Guide Profile
          </h1>
          <p className="text-foreground/70">
            Welcome, {profile.full_name}! Please complete your profile to make it visible to potential clients.
          </p>
        </header>

        <ProfileCompletionForm
          guideId={guide.profile_id}
          profileId={profile.id}
          token={token}
          locale={locale}
          countries={countries || []}
          initialData={{
            full_name: profile.full_name,
            headline: guide.headline || "",
            bio: guide.bio || "",
            years_experience: guide.years_experience || 0,
            specialties: guide.specialties || [],
            spoken_languages: guide.spoken_languages || [],
            license_number: guide.license_number || "",
            license_authority: guide.license_authority || "",
          }}
        />
      </div>
    );
  }

  // Check agencies/DMCs/transport
  const { data: agencies } = await serviceClient
    .from("agencies")
    .select("*, profiles!inner(*)")
    .eq("application_data->>profile_completion_token", token)
    .limit(1);

  if (agencies && agencies.length > 0) {
    const agency = agencies[0];
    const profile = agency.profiles;

    return (
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-12">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Complete Your Organization Profile
          </h1>
          <p className="text-foreground/70">
            Welcome, {agency.name}! Please complete your profile to make it visible to potential clients.
          </p>
        </header>

        <div className="rounded-lg border border-blue-200 bg-blue-50 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Organization Profile Completion
          </h2>
          <p className="text-blue-700">
            Organization profile completion form will be available here. For now, please contact your administrator to complete your profile.
          </p>
        </div>
      </div>
    );
  }

  // Token not found
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-6 py-12">
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6 text-center">
        <h1 className="text-2xl font-bold text-yellow-900 mb-2">Link Not Found</h1>
        <p className="text-yellow-700">
          This profile completion link was not found or has already been used. Please contact support if you need assistance.
        </p>
      </div>
    </div>
  );
}
