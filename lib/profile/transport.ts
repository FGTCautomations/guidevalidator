import { getSupabaseServerClient } from "@/lib/supabase/server";

export type TransportFleetItem = {
  id: string;
  name: string;
  vehicleType?: string;
  capacity?: number;
  airportTransfer?: boolean;
  wheelchair?: boolean;
  vip?: boolean;
  languages: string[];
};

export type TransportProfile = {
  id: string;
  name: string;
  headline?: string;
  description?: string;
  countryCode?: string | null;
  verified: boolean;
  featured: boolean;
  coverageSummary?: string | null;
  website?: string | null;
  registrationNumber?: string | null;
  vatId?: string | null;
  logoUrl?: string | null;
  languages?: string[] | null;
  specialties?: string[] | null;
  fleet: TransportFleetItem[];
};

export async function fetchTransportProfile(id: string): Promise<TransportProfile | null> {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase
    .from("agencies")
    .select("id, name, description, coverage_summary, country_code, verified, featured, website, registration_number, vat_id, logo_url, languages, specialties")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to fetch agency profile", error);
    return null;
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? undefined,
    coverageSummary: data.coverage_summary,
    countryCode: data.country_code,
    verified: data.verified ?? false,
    featured: data.featured ?? false,
    website: data.website ?? null,
    registrationNumber: data.registration_number ?? null,
    vatId: data.vat_id ?? null,
    logoUrl: data.logo_url ?? null,
    languages: data.languages ?? null,
    specialties: data.specialties ?? null,
    fleet: [], // TODO: Fetch fleet data from transport_vehicles table when available
  };
}
