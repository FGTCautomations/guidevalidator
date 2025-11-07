import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchParams {
  country: string;
  region_id?: string;
  city_id?: string;
  lang?: string[];
  specializations?: string[];
  services?: string[];
  q?: string;
  minRating?: number;
  licenseOnly?: boolean;
  sort?: string;
  cursor?: string;
  limit?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const searchParams = url.searchParams;

    const validateCountry = (c: string | null): string => {
      if (!c || c.length !== 2) return "VN";
      return c.toUpperCase();
    };

    const params: SearchParams = {
      country: validateCountry(searchParams.get("country")),
      region_id: searchParams.get("region") || undefined,
      city_id: searchParams.get("city") || undefined,
      lang: searchParams.get("lang")?.split(",").filter(Boolean),
      specializations: searchParams.get("specializations")?.split(",").filter(Boolean),
      services: searchParams.get("services")?.split(",").filter(Boolean),
      q: searchParams.get("q") || undefined,
      minRating: searchParams.get("minRating") ? Number(searchParams.get("minRating")) : undefined,
      licenseOnly: searchParams.get("licenseOnly") === "true",
      sort: searchParams.get("sort") || "featured",
      cursor: searchParams.get("cursor") || undefined,
      limit: Number(searchParams.get("limit") || "24"),
    };

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
      },
    });

    const { data, error } = await supabase.rpc("api_dmcs_search", {
      p_country: params.country || null,
      p_languages: params.lang || null,
      p_specializations: params.specializations || null,
      p_services: params.services || null,
      p_q: params.q || null,
      p_min_rating: params.minRating || null,
      p_license_only: params.licenseOnly || false,
      p_sort: params.sort || "featured",
      p_cursor: params.cursor || null,
      p_limit: params.limit || 24,
    });

    if (error) {
      console.error("Database error:", error);
      return new Response(
        JSON.stringify({
          error: "Database error",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300, s-maxage=300, stale-while-revalidate=3600",
      },
    });
  } catch (err) {
    console.error("Server error:", err);
    return new Response(
      JSON.stringify({
        error: "Server error",
        details: err instanceof Error ? err.message : String(err),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
