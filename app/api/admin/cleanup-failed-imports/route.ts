export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

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
    // Use standard server client for auth check
    const serverSupabase = getSupabaseServerClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      console.error("Auth error:", authError);
      return NextResponse.json({ error: "Unauthorized - Please sign in" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 });
    }

    // Now use service role client for cleanup
    const supabase = getServiceRoleClient();

    console.log("[Cleanup] Starting cleanup of failed imports...");

    const results = {
      deletedClaimTokens: 0,
      deletedCredentials: 0,
      deletedGuides: 0,
      deletedProfiles: 0,
      deletedAuthUsers: 0,
      orphanedAuthUsers: [] as string[],
      errors: [] as string[],
    };

    // Step 1: Get ALL staging auth users (by email pattern) with pagination
    console.log(`[Cleanup] Fetching all staging auth users...`);
    let allUsers: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (error) {
        console.error(`[Cleanup] Error fetching page ${page}:`, error);
        break;
      }

      if (data && data.users && data.users.length > 0) {
        allUsers.push(...data.users);
        console.log(`[Cleanup] Fetched page ${page}: ${data.users.length} users`);
        page++;
      } else {
        hasMore = false;
      }
    }

    const stagingAuthUsers = allUsers.filter(
      u => u.email?.includes("@guidevalidator-staging.com")
    );

    console.log(`[Cleanup] Found ${stagingAuthUsers.length} staging auth users out of ${allUsers.length} total`);
    const profileIds = stagingAuthUsers.map(u => u.id);

    // Also get profiles marked as imported_from staging
    const { data: markedProfiles } = await supabase
      .from("profiles")
      .select("id")
      .eq("application_data->>imported_from", "guides_staging");

    // Combine both lists (unique IDs)
    const additionalIds = markedProfiles?.map(p => p.id).filter(id => !profileIds.includes(id)) || [];
    profileIds.push(...additionalIds);

    console.log(`[Cleanup] Total profile IDs to clean: ${profileIds.length}`);

    // Step 2: Delete claim tokens for these profiles
    if (profileIds.length > 0) {
      const { error: tokenDeleteError, count: tokenCount } = await supabase
        .from("profile_claim_tokens")
        .delete()
        .in("profile_id", profileIds);

      if (tokenDeleteError) {
        console.error("[Cleanup] Error deleting claim tokens:", tokenDeleteError);
        results.errors.push(`Claim tokens: ${tokenDeleteError.message}`);
      } else {
        results.deletedClaimTokens = tokenCount || 0;
        console.log(`[Cleanup] Deleted ${tokenCount || 0} claim tokens`);
      }
    }

    if (profileIds.length > 0) {
      // Step 3: Delete guide_credentials
      const { error: credDeleteError, count: credCount } = await supabase
        .from("guide_credentials")
        .delete()
        .in("guide_id", profileIds);

      if (credDeleteError) {
        console.error("[Cleanup] Error deleting credentials:", credDeleteError);
        results.errors.push(`Credentials: ${credDeleteError.message}`);
      } else {
        results.deletedCredentials = credCount || 0;
        console.log(`[Cleanup] Deleted ${credCount || 0} credentials`);
      }

      // Step 4: Delete guides
      const { error: guidesDeleteError, count: guidesCount } = await supabase
        .from("guides")
        .delete()
        .in("profile_id", profileIds);

      if (guidesDeleteError) {
        console.error("[Cleanup] Error deleting guides:", guidesDeleteError);
        results.errors.push(`Guides: ${guidesDeleteError.message}`);
      } else {
        results.deletedGuides = guidesCount || 0;
        console.log(`[Cleanup] Deleted ${guidesCount || 0} guide entries`);
      }

      // Step 5: Delete profiles (both by staging mark AND by ID list)
      const { error: profileDeleteError, count: profileCount } = await supabase
        .from("profiles")
        .delete()
        .in("id", profileIds);

      if (profileDeleteError) {
        console.error("[Cleanup] Error deleting profiles:", profileDeleteError);
        results.errors.push(`Profiles: ${profileDeleteError.message}`);
      } else {
        results.deletedProfiles = profileCount || 0;
        console.log(`[Cleanup] Deleted ${profileCount || 0} profiles`);
      }
    }

    // Step 6: Delete ALL staging auth users (already fetched in Step 1)
    console.log(`[Cleanup] Deleting ${stagingAuthUsers.length} staging auth users...`);

    for (const authUser of stagingAuthUsers) {
      console.log(`[Cleanup] Deleting auth user: ${authUser.email}`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(authUser.id);

      if (deleteError) {
        console.error(`[Cleanup] Error deleting auth user ${authUser.email}:`, deleteError);
        results.orphanedAuthUsers.push(authUser.id);
        results.errors.push(`Auth user ${authUser.email}: ${deleteError.message}`);
      } else {
        results.deletedAuthUsers++;
      }
    }

    // Step 7: Clear staging_imports
    await supabase.from("staging_imports").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    console.log("[Cleanup] Cleanup completed");

    return NextResponse.json({
      success: true,
      message: "Cleanup completed",
      results,
    });
  } catch (error) {
    console.error("Cleanup error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
