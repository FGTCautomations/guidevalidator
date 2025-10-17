import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const countryCode = searchParams.get("country");

    if (!countryCode) {
      return NextResponse.json(
        { error: "country parameter is required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();

    const { data: regions, error } = await supabase
      .from("regions")
      .select("id, name, type, code, capital")
      .eq("country_code", countryCode)
      .order("name");

    if (error) {
      console.error("Error fetching regions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ regions });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
