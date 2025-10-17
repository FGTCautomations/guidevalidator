"use server";

import { getSupabaseServiceClient } from "@/lib/supabase/service";

type OnboardingData = {
  fullName: string;
  phoneNumber: string;
  bio?: string;
  country: string;
  city?: string;
  website?: string;
};

export async function completeOnboardingAction(
  userId: string,
  data: OnboardingData
): Promise<{ ok: boolean; error?: string }> {
  try {
    const supabase = getSupabaseServiceClient();

    // Update profile with onboarding data
    const { error: profileError } = await supabase
      .from("profiles")
      .update({
        full_name: data.fullName,
        phone_number: data.phoneNumber,
        bio: data.bio,
        country: data.country,
        city: data.city,
        website_url: data.website,
        onboarded: true,
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError);
      return { ok: false, error: "Failed to update profile" };
    }

    return { ok: true };
  } catch (error) {
    console.error("Error completing onboarding:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return { ok: false, error: errorMessage };
  }
}