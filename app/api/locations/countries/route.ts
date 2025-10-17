import { getSupabaseServerClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data: countries, error } = await supabase
      .from("countries")
      .select("code, name, region, flag_emoji")
      .order("name");

    if (error) {
      console.error("Error fetching countries:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ countries });
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
