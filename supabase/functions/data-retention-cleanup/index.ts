// Data Retention Policy Cleanup
// Archives and anonymizes accounts inactive for 24 months
// Run as a scheduled cron job (monthly)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

Deno.serve(async (req) => {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate date 24 months ago
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - 24);
    const cutoffIso = cutoffDate.toISOString();

    console.log(`Running data retention cleanup for accounts inactive since ${cutoffIso}`);

    let archivedCount = 0;
    let errorCount = 0;

    // Find profiles inactive for 24+ months (no logins, no activity)
    const { data: inactiveProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, created_at, updated_at")
      .is("deleted_at", null) // Not already deleted
      .lt("updated_at", cutoffIso);

    if (profileError) {
      console.error("Error fetching inactive profiles:", profileError);
      errorCount++;
    }

    // Archive inactive profiles
    if (inactiveProfiles && inactiveProfiles.length > 0) {
      for (const profile of inactiveProfiles) {
        try {
          // Check for recent activity (reviews, bookings, etc.)
          const { data: recentReviews } = await supabase
            .from("reviews")
            .select("id")
            .eq("reviewer_id", profile.id)
            .gte("created_at", cutoffIso)
            .limit(1);

          const { data: recentHolds } = await supabase
            .from("availability_holds")
            .select("id")
            .or(`holdee_id.eq.${profile.id},requester_id.eq.${profile.id}`)
            .gte("created_at", cutoffIso)
            .limit(1);

          // Skip if there's recent activity
          if ((recentReviews && recentReviews.length > 0) || (recentHolds && recentHolds.length > 0)) {
            console.log(`Skipping profile ${profile.id} - has recent activity`);
            continue;
          }

          // Fetch full profile data
          const { data: fullProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", profile.id)
            .single();

          // Archive the profile
          await supabase.from("archived_accounts").insert({
            original_user_id: profile.id,
            account_type: "profile",
            archived_data: fullProfile,
            reason: "retention_policy_24_months",
          });

          // Soft delete the profile
          await supabase
            .from("profiles")
            .update({
              deleted_at: new Date().toISOString(),
              deletion_reason: "Automatic deletion due to 24-month inactivity policy",
            })
            .eq("id", profile.id);

          // Log the action
          await supabase.from("gdpr_audit_log").insert({
            user_id: profile.id,
            action: "data_retention_archive",
            details: {
              reason: "24_month_inactivity",
              original_email: profile.email,
              archived_at: new Date().toISOString(),
            },
          });

          archivedCount++;
          console.log(`Archived and soft-deleted profile: ${profile.id}`);
        } catch (error) {
          console.error(`Error archiving profile ${profile.id}:`, error);
          errorCount++;
        }
      }
    }

    // Find agencies inactive for 24+ months
    const { data: inactiveAgencies, error: agencyError } = await supabase
      .from("agencies")
      .select("id, name, contact_email, type, created_at, updated_at")
      .is("deleted_at", null)
      .lt("updated_at", cutoffIso);

    if (agencyError) {
      console.error("Error fetching inactive agencies:", agencyError);
      errorCount++;
    }

    // Archive inactive agencies
    if (inactiveAgencies && inactiveAgencies.length > 0) {
      for (const agency of inactiveAgencies) {
        try {
          // Check for recent activity
          const { data: recentHolds } = await supabase
            .from("availability_holds")
            .select("id")
            .eq("requester_id", agency.id)
            .gte("created_at", cutoffIso)
            .limit(1);

          if (recentHolds && recentHolds.length > 0) {
            console.log(`Skipping agency ${agency.id} - has recent activity`);
            continue;
          }

          // Fetch full agency data
          const { data: fullAgency } = await supabase
            .from("agencies")
            .select("*")
            .eq("id", agency.id)
            .single();

          // Archive the agency
          await supabase.from("archived_accounts").insert({
            original_user_id: agency.id,
            account_type: "agency",
            archived_data: fullAgency,
            reason: "retention_policy_24_months",
          });

          // Soft delete the agency
          await supabase
            .from("agencies")
            .update({
              deleted_at: new Date().toISOString(),
              deletion_reason: "Automatic deletion due to 24-month inactivity policy",
            })
            .eq("id", agency.id);

          // Log the action
          await supabase.from("gdpr_audit_log").insert({
            user_id: agency.id,
            action: "data_retention_archive",
            details: {
              reason: "24_month_inactivity",
              original_email: agency.contact_email,
              archived_at: new Date().toISOString(),
            },
          });

          archivedCount++;
          console.log(`Archived and soft-deleted agency: ${agency.id}`);
        } catch (error) {
          console.error(`Error archiving agency ${agency.id}:`, error);
          errorCount++;
        }
      }
    }

    // Clean up expired DSAR requests (older than 1 year)
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    await supabase
      .from("dsar_requests")
      .delete()
      .lt("requested_at", oneYearAgo.toISOString())
      .in("status", ["completed", "rejected", "cancelled"]);

    return new Response(
      JSON.stringify({
        success: true,
        archived_count: archivedCount,
        error_count: errorCount,
        cutoff_date: cutoffIso,
        timestamp: new Date().toISOString(),
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Cron job error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
