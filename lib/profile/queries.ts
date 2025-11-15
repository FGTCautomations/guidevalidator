import { getSupabaseServerClient } from "@/lib/supabase/server";

type GuideProfileRow = {
  id: string;
  profile_id: string;
  name?: string | null;
  headline?: string | null;
  bio?: string | null;
  specialties?: string[] | null;
  spoken_languages?: string[] | null;
  hourly_rate_cents?: number | null;
  currency?: string | null;
  years_experience?: number | null;
  response_time_minutes?: number | null;
  experience_summary?: string | null;
  sample_itineraries?: string | null;
  media_gallery?: string | null;
  availability_notes?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
  license_number?: string | null;
  profiles?: {
    full_name?: string | null;
    country_code?: string | null;
    verified?: boolean | null;
    avatar_url?: string | null;
  } | null;
};

export type GuideProfile = {
  id: string;
  profileId: string;
  name: string;
  headline?: string;
  bio?: string;
  countryCode?: string | null;
  languages: string[];
  specialties: string[];
  hourlyRateCents?: number | null;
  currency?: string | null;
  yearsExperience?: number | null;
  responseTimeMinutes?: number | null;
  verified: boolean;
  activated: boolean;
  isFeatured: boolean;
  experienceSummary?: string | null;
  certifications?: string[];
  education?: string | null;
  sampleItineraries?: Array<{ title: string; url: string }>;
  mediaGallery?: Array<{ title: string; url: string }>;
  availabilityNotes?: string | null;
  avatarUrl?: string | null;
  licenseNumber?: string | null;
  locationData?: {
    countries: Array<{
      countryCode: string;
      countryName: string;
      regions?: string[];
      cities?: string[];
      parks?: string[];
    }>;
  };
};

export async function fetchGuideProfile(guideId: string): Promise<GuideProfile | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("guides")
    .select(
      `id, profile_id, name, headline, bio, specialties, spoken_languages, hourly_rate_cents, currency, years_experience, response_time_minutes, experience_summary, sample_itineraries, media_gallery, availability_notes, avatar_url, image_url, license_number, profiles!inner(id, full_name, country_code, verified, avatar_url)`
    )
    .eq("id", guideId)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch guide profile", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const row = data as GuideProfileRow;
  const profileData = row.profiles ?? null;

  // Check if profile is activated (has an auth user)
  const { data: authUser } = await supabase
    .from("auth.users")
    .select("id")
    .eq("id", row.profile_id)
    .maybeSingle();

  const isActivated = !!authUser;

  // Check if profile has an active premium subscription (Featured status)
  const { data: premiumSubscription } = await supabase
    .from("subscriptions")
    .select("id, plan_code, status")
    .eq("profile_id", row.profile_id)
    .in("plan_code", ["guide_premium_monthly", "guide_premium_yearly"])
    .eq("status", "active")
    .maybeSingle();

  const isFeatured = !!premiumSubscription;

  // Parse JSON fields if they exist
  let sampleItineraries: Array<{ title: string; url: string }> | undefined;
  let mediaGallery: Array<{ title: string; url: string }> | undefined;

  try {
    if (row.sample_itineraries) {
      sampleItineraries = JSON.parse(row.sample_itineraries);
    }
  } catch (e) {
    console.error("Failed to parse sample_itineraries", e);
  }

  try {
    if (row.media_gallery) {
      mediaGallery = JSON.parse(row.media_gallery);
    }
  } catch (e) {
    console.error("Failed to parse media_gallery", e);
  }

  return {
    id: row.id,
    profileId: row.profile_id,
    name: row.name || profileData?.full_name || "Guide",
    headline: row.headline ?? undefined,
    bio: row.bio ?? undefined,
    countryCode: profileData?.country_code ?? null,
    languages: row.spoken_languages ?? [],
    specialties: row.specialties ?? [],
    hourlyRateCents: row.hourly_rate_cents,
    currency: row.currency,
    yearsExperience: row.years_experience,
    responseTimeMinutes: row.response_time_minutes,
    verified: profileData?.verified ?? false,
    activated: isActivated,
    isFeatured: isFeatured,
    experienceSummary: row.experience_summary ?? undefined,
    certifications: undefined, // Not stored in guides table yet
    education: undefined, // Not stored in guides table yet
    sampleItineraries,
    mediaGallery,
    availabilityNotes: row.availability_notes ?? undefined,
    avatarUrl: row.image_url || profileData?.avatar_url || row.avatar_url || undefined,
    licenseNumber: row.license_number ?? undefined,
    locationData: undefined, // Will need to fetch from location tables if needed
  };
}

type GuideCredentialRow = {
  id: string;
  status: string;
  storage_path?: string | null;
  expires_at?: string | null;
  reviewed_at?: string | null;
  created_at?: string | null;
};

export type GuideVerificationState = {
  credentialId: string;
  status: string;
  storagePath?: string | null;
  expiresAt?: string | null;
  reviewedAt?: string | null;
  createdAt?: string | null;
};

export async function fetchGuideVerificationState(profileId: string): Promise<GuideVerificationState | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("guide_credentials")
    .select("id, status, storage_path, expires_at, reviewed_at, created_at")
    .eq("guide_id", profileId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch guide verification state", error);
    return null;
  }

  if (!data) {
    return null;
  }

  const row = data as GuideCredentialRow;

  return {
    credentialId: row.id,
    status: row.status,
    storagePath: row.storage_path ?? null,
    expiresAt: row.expires_at ?? null,
    reviewedAt: row.reviewed_at ?? null,
    createdAt: row.created_at ?? null,
  };
}
