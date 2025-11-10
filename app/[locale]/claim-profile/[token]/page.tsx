export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase/server";
import { ClaimProfileForm } from "@/components/auth/claim-profile-form";

type PageProps = {
  params: Promise<{ locale: string; token: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

async function validateClaimToken(token: string) {
  // Use service role client to bypass RLS for token validation
  const supabase = getSupabaseServiceRoleClient();

  // First, check if token exists at all (without profile join)
  const { data: tokenData, error: tokenError } = await supabase
    .from("profile_claim_tokens")
    .select("id, profile_id, license_number, expires_at, claimed_at")
    .eq("token", token)
    .maybeSingle();

  if (tokenError) {
    console.error("Token query error:", tokenError);
    return null;
  }

  if (!tokenData) {
    console.error("Token not found:", token);
    return null;
  }

  console.log("Token found:", tokenData);

  // Now get the profile separately
  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .select("id, full_name, country_code, application_data")
    .eq("id", tokenData.profile_id)
    .maybeSingle();

  if (profileError) {
    console.error("Profile query error:", profileError);
  }

  if (!profileData) {
    console.error("Profile not found for token. Profile ID:", tokenData.profile_id);
    // Return error but with token data
    return {
      error: "profile_missing",
      tokenData
    };
  }

  const data = {
    ...tokenData,
    profiles: profileData
  };

  // Check if token is expired
  if (new Date(data.expires_at) < new Date()) {
    return { error: "expired" };
  }

  // Check if already claimed
  if (data.claimed_at) {
    return { error: "already_claimed" };
  }

  return {
    tokenId: data.id,
    profileId: data.profile_id,
    licenseNumber: data.license_number,
    guideName: (data.profiles as any)?.full_name || "Guide",
    countryCode: (data.profiles as any)?.country_code || "VN",
    applicationData: (data.profiles as any)?.application_data || {},
  };
}

export default async function ClaimProfilePage({ params, searchParams }: PageProps) {
  const { locale, token: encodedToken } = await params;
  const search = await searchParams;

  // Decode the URL-encoded token
  const token = decodeURIComponent(encodedToken);

  // Check if user is already authenticated
  const supabase = getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If authenticated and trying to claim, redirect to profile
  if (user) {
    redirect(`/${locale}/onboarding/complete-profile`);
  }

  const result = await validateClaimToken(token);

  if (!result) {
    notFound();
  }

  if ("error" in result) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-background rounded-2xl shadow-lg border border-foreground/10 p-8 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 mx-auto bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-destructive"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {result.error === "expired"
                ? "Link Expired"
                : result.error === "profile_missing"
                ? "Profile Not Found"
                : "Already Claimed"}
            </h1>
            <p className="text-foreground/60">
              {result.error === "expired"
                ? "This claim link has expired. Please contact support for a new invitation."
                : result.error === "profile_missing"
                ? "The profile associated with this token could not be found. The import may still be in progress. Please try again in a few minutes or contact support."
                : "This profile has already been claimed. If you are the owner, please sign in."}
            </p>
          </div>
          <a
            href={`/${locale}/auth/sign-in`}
            className="inline-block px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-background">
      <div className="max-w-2xl w-full">
        <div className="bg-background rounded-2xl shadow-xl border border-foreground/10 overflow-hidden">
          {/* Header */}
          <div className="bg-primary/5 border-b border-primary/10 px-8 py-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Claim Your Guide Profile
                </h1>
                <p className="text-foreground/70">
                  Welcome! We've created a profile for you on Guide Validator. Complete the form
                  below to claim your profile and start connecting with travel agencies and DMCs.
                </p>
              </div>
            </div>
          </div>

          {/* Profile Info Preview */}
          <div className="bg-primary/5 border-b border-foreground/10 px-8 py-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p className="text-sm text-foreground/60 mb-1">Profile for:</p>
                <p className="font-semibold text-foreground">{result.guideName}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-foreground/60 mb-1">License Number:</p>
                <p className="font-mono text-sm font-semibold text-foreground">
                  {result.licenseNumber}
                </p>
              </div>
            </div>
          </div>

          {/* Claim Form */}
          <div className="px-8 py-8">
            <ClaimProfileForm
              token={token}
              licenseNumber={result.licenseNumber}
              guideName={result.guideName}
              locale={locale}
            />
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-sm text-foreground/60">
            By claiming this profile, you confirm that you are the licensed guide listed above.
          </p>
          <p className="text-sm text-foreground/60 mt-2">
            Need help?{" "}
            <a href={`/${locale}/contact`} className="text-primary hover:underline">
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
