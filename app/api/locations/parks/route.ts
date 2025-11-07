import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("region");
    const countryCode = searchParams.get("country");
    const offset = parseInt(searchParams.get("offset") || "0");
    const limit = parseInt(searchParams.get("limit") || "1000");

    if (!regionId && !countryCode) {
      return NextResponse.json(
        { error: "region or country parameter is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    let query = supabase
      .from("national_parks_stage")
      .select("id, name, type, unesco_site, official_name", { count: "exact" });

    if (regionId) {
      query = query.eq("region_id", regionId);
    } else if (countryCode) {
      query = query.eq("country_code", countryCode);
    }

    // Apply pagination with offset and limit
    query = query
      .order("unesco_site", { ascending: false })
      .order("name")
      .range(offset, offset + limit - 1); // range is inclusive

    const { data: parks, error } = await query;

    if (error) {
      console.error("Error fetching parks:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ parks });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
