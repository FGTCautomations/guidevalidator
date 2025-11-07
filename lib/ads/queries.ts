// Ad selection and management queries for GuideValidator Ads System

import { getSupabaseServerClient as createClient } from "@/lib/supabase/server";
import type { Ad, AdSelectionParams, CreateAdInput, UpdateAdInput } from "./types";

/**
 * Select a single ad using weighted random rotation
 * Returns null if no ads match the criteria (placement, schedule, targeting)
 */
export async function selectAd(params: AdSelectionParams): Promise<Ad | null> {
  const supabase = createClient();

  console.log("[selectAd] Calling RPC with params:", params);

  const { data, error } = await supabase.rpc("select_ad", {
    p_placement: params.placement,
    p_country: params.country || null,
    p_list_context: params.listContext || null,
  });

  if (error) {
    console.error("[selectAd] Error selecting ad:", error);
    return null;
  }

  console.log("[selectAd] RPC response:", data);

  // RPC returns array; take first result or null
  const result = data && data.length > 0 ? data[0] : null;
  console.log("[selectAd] Returning:", result ? `Ad: ${result.advertiser_name}` : 'null');
  return result;
}

/**
 * Get all ads matching criteria (for admin preview/testing)
 */
export async function getMatchingAds(params: AdSelectionParams): Promise<Ad[]> {
  const supabase = createClient();

  let query = supabase
    .from("ads")
    .select("*")
    .eq("is_active", true)
    .lte("start_at", new Date().toISOString())
    .gte("end_at", new Date().toISOString())
    .contains("placement", [params.placement]);

  if (params.country) {
    query = query.or(`country_filter.is.null,country_filter.cs.{${params.country}}`);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching matching ads:", error);
    return [];
  }

  return data || [];
}

/**
 * Get all ads (admin only)
 * @param supabase - Optional Supabase client (for service role to see inactive ads)
 */
export async function getAllAds(supabase?: any): Promise<Ad[]> {
  const client = supabase || createClient();

  const { data, error } = await client
    .from("ads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching all ads:", error);
    return [];
  }

  return data || [];
}

/**
 * Get single ad by ID (admin only)
 */
export async function getAdById(id: number): Promise<Ad | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ads")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching ad:", error);
    return null;
  }

  return data;
}

/**
 * Create new ad (admin only)
 */
export async function createAd(input: CreateAdInput, userId: string): Promise<Ad | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ads")
    .insert({
      ...input,
      created_by: userId,
      is_active: input.is_active ?? true,
      weight: input.weight ?? 1,
    })
    .select()
    .single();

  if (error) {
    console.error("Error creating ad:", error);
    return null;
  }

  return data;
}

/**
 * Update existing ad (admin only)
 */
export async function updateAd(input: UpdateAdInput): Promise<Ad | null> {
  const supabase = createClient();

  const { id, ...updateData } = input;

  const { data, error } = await supabase
    .from("ads")
    .update(updateData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating ad:", error);
    return null;
  }

  return data;
}

/**
 * Delete ad (admin only)
 */
export async function deleteAd(id: number): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.from("ads").delete().eq("id", id);

  if (error) {
    console.error("Error deleting ad:", error);
    return false;
  }

  return true;
}

/**
 * Toggle ad active status (admin only)
 * @param supabase - Optional Supabase client (for authenticated context)
 */
export async function toggleAdActive(id: number, isActive: boolean, supabase?: any): Promise<boolean> {
  const client = supabase || createClient();

  console.log("[toggleAdActive] Using client:", supabase ? "SERVICE_ROLE" : "DEFAULT", "id:", id, "isActive:", isActive);

  const { error } = await client
    .from("ads")
    .update({ is_active: isActive })
    .eq("id", id);

  if (error) {
    console.error("Error toggling ad active status:", error);
    return false;
  }

  console.log("[toggleAdActive] Success!");
  return true;
}

/**
 * Log ad click (public)
 */
export async function logAdClick(adId: number, country?: string, page?: string): Promise<boolean> {
  const supabase = createClient();

  const { error } = await supabase.from("ad_clicks").insert({
    ad_id: adId,
    country,
    page,
  });

  if (error) {
    console.error("Error logging ad click:", error);
    return false;
  }

  return true;
}

/**
 * Get ad click stats (admin only)
 */
export async function getAdClickStats(adId: number): Promise<{ total: number; byCountry: Record<string, number> }> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("ad_clicks")
    .select("country")
    .eq("ad_id", adId);

  if (error) {
    console.error("Error fetching ad click stats:", error);
    return { total: 0, byCountry: {} };
  }

  const total = data.length;
  const byCountry: Record<string, number> = {};

  data.forEach((click) => {
    const country = click.country || "unknown";
    byCountry[country] = (byCountry[country] || 0) + 1;
  });

  return { total, byCountry };
}
