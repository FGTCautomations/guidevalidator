import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("region");
    const countryCode = searchParams.get("country");

    if (!regionId && !countryCode) {
      return NextResponse.json(
        { error: "region or country parameter is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    let query = supabase
      .from("cities")
      .select("id, name, population, is_capital, is_major_city");

    if (regionId) {
      query = query.eq("region_id", regionId);
    } else if (countryCode) {
      query = query.eq("country_code", countryCode);
    }

    query = query.order("is_capital", { ascending: false })
      .order("is_major_city", { ascending: false })
      .order("population", { ascending: false, nullsFirst: false })
      .order("name");

    const { data: cities, error } = await query;

    if (error) {
      console.error("Error fetching cities:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ cities });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
