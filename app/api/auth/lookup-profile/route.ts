export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Use service role client for admin operations
function getServiceRoleClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseNumber } = body;

    console.log("[API] lookup-profile called with:", { licenseNumber });

    // Validation
    if (!licenseNumber) {
      console.log("[API] lookup-profile: Missing license number");
      return NextResponse.json(
        { error: "License number is required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Look up the claim token by license number
    const { data: claimToken, error: tokenError } = await supabase
      .from("profile_claim_tokens")
      .select("id, profile_id, license_number, expires_at, claimed_at")
      .eq("license_number", licenseNumber.trim())
      .maybeSingle();

    if (tokenError || !claimToken) {
      console.error("Token lookup error:", tokenError);
      return NextResponse.json(
        { error: "No profile found with this license number. Please check your license number and try again." },
        { status: 404 }
      );
    }

    // Check if already claimed
    if (claimToken.claimed_at) {
      return NextResponse.json(
        { error: "This profile has already been claimed. If this is your profile, please try signing in instead." },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(claimToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This activation link has expired. Please contact support for assistance." },
        { status: 400 }
      );
    }

    // Get the profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name")
      .eq("id", claimToken.profile_id)
      .maybeSingle();

    if (profileError || !profile) {
      console.error("Profile lookup error:", profileError);
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      guideName: profile.full_name,
    });
  } catch (error) {
    console.error("Lookup profile error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
