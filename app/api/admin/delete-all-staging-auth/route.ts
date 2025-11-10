export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Use service role client
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
    // Check admin auth
    const serverSupabase = getSupabaseServerClient();
    const {
      data: { user },
      error: authError,
    } = await serverSupabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await serverSupabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile || !["admin", "super_admin"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const supabase = getServiceRoleClient();

    console.log("[Delete Auth] Fetching all auth users...");

    // Get ALL auth users (with pagination)
    let allUsers: any[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page,
        perPage: 1000,
      });

      if (error) {
        console.error(`[Delete Auth] Error fetching page ${page}:`, error);
        break;
      }

      if (data && data.users && data.users.length > 0) {
        allUsers.push(...data.users);
        console.log(`[Delete Auth] Fetched page ${page}: ${data.users.length} users`);
        page++;
      } else {
        hasMore = false;
      }
    }

    console.log(`[Delete Auth] Total auth users fetched: ${allUsers.length}`);

    // Filter staging users
    const stagingUsers = allUsers.filter(
      u => u.email?.includes("@guidevalidator-staging.com")
    );

    console.log(`[Delete Auth] Found ${stagingUsers.length} staging auth users to delete`);

    let deleted = 0;
    let failed = 0;
    const errors: string[] = [];

    // Delete in batches
    for (const authUser of stagingUsers) {
      try {
        console.log(`[Delete Auth] Deleting: ${authUser.email}`);
        const { error } = await supabase.auth.admin.deleteUser(authUser.id);

        if (error) {
          console.error(`[Delete Auth] Failed to delete ${authUser.email}:`, error);
          errors.push(`${authUser.email}: ${error.message}`);
          failed++;
        } else {
          deleted++;
        }
      } catch (err) {
        console.error(`[Delete Auth] Error deleting ${authUser.email}:`, err);
        errors.push(`${authUser.email}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        failed++;
      }

      // Small delay to avoid rate limiting
      if (deleted % 10 === 0) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    console.log(`[Delete Auth] Complete: ${deleted} deleted, ${failed} failed`);

    return NextResponse.json({
      success: true,
      message: "Auth user deletion complete",
      results: {
        total: stagingUsers.length,
        deleted,
        failed,
        errors,
      },
    });
  } catch (error) {
    console.error("Delete auth error:", error);
    return NextResponse.json(
      {
        error: "An unexpected error occurred",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
