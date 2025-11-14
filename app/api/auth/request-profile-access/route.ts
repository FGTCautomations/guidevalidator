export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

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

// Generate a secure random token
function generateAccessToken(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseNumber, email } = body;

    // Validation
    if (!licenseNumber || !email) {
      return NextResponse.json(
        { error: "License number and email are required" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();

    // Step 1: Find guide by license number
    const { data: guides, error: guidesError } = await supabase
      .from("guides")
      .select(`
        profile_id,
        license_number,
        profiles!inner(
          id,
          full_name,
          application_status
        )
      `)
      .eq("license_number", licenseNumber.trim())
      .limit(1);

    if (guidesError) {
      console.error("Error querying guides:", guidesError);
      return NextResponse.json(
        { error: "An error occurred while looking up your profile" },
        { status: 500 }
      );
    }

    if (!guides || guides.length === 0) {
      return NextResponse.json(
        { error: "No profile found with this license number. Please check your license number or apply to create a new profile." },
        { status: 404 }
      );
    }

    const guide = guides[0];
    const profile = (guide.profiles as any);

    // Step 2: Check if the guide is approved (optional - you may want to allow pending guides)
    if (profile.application_status === "rejected") {
      return NextResponse.json(
        { error: "This profile has been rejected. Please contact support for more information." },
        { status: 403 }
      );
    }

    // Step 3: Check if profile already has an auth account
    const { data: existingAuth } = await supabase.auth.admin.getUserById(profile.id);

    if (existingAuth && existingAuth.user) {
      return NextResponse.json(
        { error: "This profile already has an account. Please use the 'Forgot Password' option to reset your password." },
        { status: 400 }
      );
    }

    // Step 4: Generate access token
    const accessToken = generateAccessToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Token valid for 24 hours

    // Step 5: Store or update profile access token in profiles table
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email: email.trim().toLowerCase(),
        profile_access_token: accessToken,
        profile_access_token_expires_at: expiresAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return NextResponse.json(
        { error: "Failed to generate access token" },
        { status: 500 }
      );
    }

    // Step 6: Create or update Supabase auth account with token as password
    try {
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: email.trim().toLowerCase(),
        password: accessToken,
        email_confirm: true,
        user_metadata: {
          full_name: profile.full_name,
          role: "guide",
          license_number: licenseNumber.trim(),
        },
      });

      if (authError) {
        console.error("Error creating auth user:", authError);
      } else if (authUser?.user) {
        // Update profile with new auth user ID
        await supabase
          .from("profiles")
          .update({ id: authUser.user.id })
          .eq("id", profile.id);

        // Update guide profile_id
        await supabase
          .from("guides")
          .update({ profile_id: authUser.user.id })
          .eq("profile_id", profile.id);
      }
    } catch (authError) {
      console.error("Error with auth account:", authError);
    }

    // Step 7: Send email with access token
    const { sendProfileAccessTokenEmail } = await import("@/lib/email/resend");

    try {
      await sendProfileAccessTokenEmail({
        email: email.trim().toLowerCase(),
        name: profile.full_name,
        accessToken,
        licenseNumber: licenseNumber.trim(),
      });
    } catch (emailError) {
      console.error("Error sending email:", emailError);
    }

    return NextResponse.json({
      success: true,
      message: "Access token sent to your email",
    });
  } catch (error) {
    console.error("Request profile access error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
