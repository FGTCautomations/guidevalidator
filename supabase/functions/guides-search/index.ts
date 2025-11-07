// Guide Search Edge Function
// Provides fast, cacheable guide directory search with faceted filtering

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Types
interface SearchParams {
  country: string;
  regionId?: string;
  cityId?: string;
  lang?: string[];
  spec?: string[];
  gender?: string[];
  q?: string;
  min?: number;
  max?: number;
  minRating?: number;
  verified?: boolean;
  license?: boolean;
  sort?: "featured" | "rating" | "price" | "experience";
  cursor?: string;
  limit?: number;
}

interface SearchResponse {
  results: Guide[];
  facets: {
    languages: FacetCount[];
    specialties: FacetCount[];
    total: number;
  };
  nextCursor?: string;
}

interface Guide {
  id: string;
  name: string;
  headline?: string;
  country_code: string;
  avatar_url?: string;
  languages: string[];
  specialties: string[];
  verified: boolean;
  license_verified: boolean;
  has_liability_insurance: boolean;
  child_friendly: boolean;
  gender?: string;
  price_cents?: number;
  currency?: string;
  response_time_minutes?: number;
  rating: number;
  review_count: number;
}

interface FacetCount {
  value: string;
  count: number;
}

// Validation helpers
function validateCountry(country?: string): string {
  if (!country || typeof country !== "string") {
    throw new Error("Missing or invalid country parameter");
  }
  const normalized = country.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    throw new Error("Country must be a 2-letter ISO code");
  }
  return normalized;
}

function validateSort(sort?: string): string {
  const allowed = ["featured", "rating", "price", "experience"];
  if (!sort || !allowed.includes(sort)) {
    return "featured";
  }
  return sort;
}

function parseArray(value?: string | string[]): string[] | null {
  if (!value) return null;
  if (Array.isArray(value)) return value.map(v => v.trim().toLowerCase()).filter(Boolean);
  return value.split(",").map(v => v.trim().toLowerCase()).filter(Boolean);
}

function parseNumber(value?: string, min?: number, max?: number): number | null {
  if (!value) return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  if (min !== undefined && parsed < min) return min;
  if (max !== undefined && parsed > max) return max;
  return parsed;
}

function parseBoolean(value?: string): boolean {
  return value === "true" || value === "1";
}

// Build deterministic cache key for CDN caching
function buildCacheKey(params: SearchParams): string {
  const parts: string[] = [
    params.country,
    params.regionId || "",
    params.cityId || "",
    (params.lang || []).sort().join(","),
    (params.spec || []).sort().join(","),
    (params.gender || []).sort().join(","),
    params.q || "",
    String(params.min || ""),
    String(params.max || ""),
    String(params.minRating || ""),
    String(params.verified || ""),
    String(params.license || ""),
    params.sort || "featured",
    params.cursor || "",
    String(params.limit || 24),
  ];
  return `guides:${parts.join(":")}`;
}

serve(async (req: Request) => {
  // CORS headers for browser requests
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow GET
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "content-type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    // Parse and validate parameters
    const params: SearchParams = {
      country: validateCountry(searchParams.get("country") || undefined),
      regionId: searchParams.get("region") || undefined,
      cityId: searchParams.get("city") || undefined,
      lang: parseArray(searchParams.get("lang") || undefined) || undefined,
      spec: parseArray(searchParams.get("spec") || undefined) || undefined,
      gender: parseArray(searchParams.get("gender") || undefined) || undefined,
      q: searchParams.get("q")?.trim() || undefined,
      min: parseNumber(searchParams.get("min"), 0, 10000) || undefined,
      max: parseNumber(searchParams.get("max"), 0, 10000) || undefined,
      minRating: parseNumber(searchParams.get("minRating"), 0, 5) || undefined,
      verified: parseBoolean(searchParams.get("verified")),
      license: parseBoolean(searchParams.get("license")),
      sort: validateSort(searchParams.get("sort") || undefined),
      cursor: searchParams.get("cursor") || undefined,
      limit: parseNumber(searchParams.get("limit"), 1, 48) || 24,
    };

    // Build cache key
    const cacheKey = buildCacheKey(params);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call RPC function
    const { data, error } = await supabase.rpc("api_guides_search", {
      p_country: params.country,
      p_region_id: params.regionId || null,
      p_city_id: params.cityId || null,
      p_languages: params.lang || null,
      p_specialties: params.spec || null,
      p_genders: params.gender || null,
      p_q: params.q || null,
      p_price_min: params.min || null,
      p_price_max: params.max || null,
      p_min_rating: params.minRating || null,
      p_verified_only: params.verified || false,
      p_license_only: params.license || false,
      p_sort: params.sort || "featured",
      p_after_cursor: params.cursor || null,
      p_limit: params.limit || 24,
    });

    if (error) {
      console.error("RPC error:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Build response with cache headers
    const response = new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "content-type": "application/json",
        ...corsHeaders,
        // Cache common queries for 5 minutes, stale-while-revalidate for 1 hour
        "Cache-Control": params.cursor
          ? "public, max-age=60, s-maxage=60"  // Paginated results: 1 min cache
          : "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",  // First page: 5 min cache
        "X-Cache-Key": cacheKey,
        "Vary": "Accept-Encoding",
      },
    });

    return response;

  } catch (error) {
    console.error("Edge function error:", error);

    const status = error.message.includes("Missing or invalid") ? 400 : 500;
    return new Response(
      JSON.stringify({
        error: error.message || "Internal server error",
      }),
      {
        status,
        headers: {
          "content-type": "application/json",
          ...corsHeaders,
        },
      }
    );
  }
});
