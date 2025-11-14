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
    const { licenseNumber, email, password } = body;

    console.log("[API] activate-profile called with:", { licenseNumber, email, password: "[REDACTED]" });

    // Validation
    if (!licenseNumber || !email || !password) {
      console.log("[API] activate-profile: Missing required fields");
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Step 1: Look up the claim token by license number
    const { data: claimToken, error: tokenError } = await supabase
      .from("profile_claim_tokens")
      .select("id, profile_id, license_number, expires_at, claimed_at")
      .eq("license_number", licenseNumber.trim())
      .maybeSingle();

    if (tokenError || !claimToken) {
      console.error("Token lookup error:", tokenError);
      return NextResponse.json(
        { error: "No profile found with this license number" },
        { status: 404 }
      );
    }

    // Check if already claimed
    if (claimToken.claimed_at) {
      return NextResponse.json(
        { error: "This profile has already been claimed" },
        { status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(claimToken.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This activation link has expired" },
        { status: 400 }
      );
    }

    // Get the profile
    const { data: profileData, error: profileError} = await supabase
      .from("profiles")
      .select("id, full_name, role")
      .eq("id", claimToken.profile_id)
      .maybeSingle();

    if (profileError || !profileData) {
      console.error("Profile lookup error:", profileError);
      return NextResponse.json(
        { error: "Profile not found" },
        { status: 404 }
      );
    }

    const profileId = claimToken.profile_id;

    // Step 2: Create auth user with the new email
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: profileData.full_name,
        role: "guide",
        claimed_profile: true,
      },
    });

    if (authError || !authData.user) {
      console.error("Auth user creation error:", authError);

      // Check if email already exists
      if (authError?.message?.includes("already registered")) {
        return NextResponse.json(
          { error: "This email is already registered. Please use a different email or sign in." },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: authError?.message || "Failed to create account" },
        { status: 500 }
      );
    }

    const newUserId = authData.user.id;

    // Step 3: Update the profile with the new auth user ID
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        id: newUserId, // Link to new auth user
        profile_completion_last_prompted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profileId);

    if (profileUpdateError) {
      console.error("Profile update error:", profileUpdateError);

      // Rollback: Delete the auth user we just created
      await supabase.auth.admin.deleteUser(newUserId);

      return NextResponse.json(
        { error: "Failed to link profile to account" },
        { status: 500 }
      );
    }

    // Step 4: Update guides table profile_id reference
    const { error: guideUpdateError } = await supabase
      .from("guides")
      .update({
        profile_id: newUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profileId);

    if (guideUpdateError) {
      console.error("Guide update error:", guideUpdateError);
      // Non-critical error - profile is still claimed
    }

    // Step 5: Update guide_credentials table guide_id reference
    const { error: credentialsUpdateError } = await supabase
      .from("guide_credentials")
      .update({
        guide_id: newUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("guide_id", profileId);

    if (credentialsUpdateError) {
      console.error("Credentials update error:", credentialsUpdateError);
      // Non-critical error - profile is still claimed
    }

    // Step 6: Mark claim token as used
    const { error: tokenUpdateError } = await supabase
      .from("profile_claim_tokens")
      .update({
        claimed_at: new Date().toISOString(),
        claimed_by: newUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimToken.id);

    if (tokenUpdateError) {
      console.error("Token update error:", tokenUpdateError);
      // Non-critical error - profile is still claimed
    }

    // Step 7: Delete the old staging profile record (with old UUID)
    // This is safe because we've already moved all data to the new user ID
    const { error: deleteError } = await supabase
      .from("profiles")
      .delete()
      .eq("id", profileId);

    if (deleteError) {
      console.error("Old profile deletion error:", deleteError);
      // Non-critical error - the old profile will be orphaned but inactive
    }

    return NextResponse.json({
      success: true,
      message: "Profile activated successfully",
      userId: newUserId,
    });
  } catch (error) {
    console.error("Activate profile error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
