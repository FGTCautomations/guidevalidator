import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseServerClient } from "@/lib/supabase/server";

// Use service role client for admin operations (creating auth users)
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

    // Now use service role client for the actual import
    const supabase = getServiceRoleClient();

    // Fetch ALL staging guides (with pagination to get beyond 1000 row limit)
    console.log("[Import] Fetching all staging guides...");
    let allStagingGuides: any[] = [];
    let page = 0;
    const PAGE_SIZE = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data: pageData, error: fetchError } = await supabase
        .from("guides_staging")
        .select("*")
        .not("card_number", "is", null)
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (fetchError) {
        console.error("Failed to fetch staging guides:", fetchError);
        return NextResponse.json(
          { error: "Failed to fetch staging data", details: fetchError.message },
          { status: 500 }
        );
      }

      if (pageData && pageData.length > 0) {
        allStagingGuides.push(...pageData);
        console.log(`[Import] Fetched page ${page + 1}: ${pageData.length} guides (total: ${allStagingGuides.length})`);
        page++;

        // If we got less than PAGE_SIZE, we're done
        if (pageData.length < PAGE_SIZE) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    const stagingGuides = allStagingGuides;

    if (!stagingGuides || stagingGuides.length === 0) {
      return NextResponse.json({ message: "No guides to import" }, { status: 200 });
    }

    console.log(`[Import] Starting import of ${stagingGuides.length} guides`);

    // Fetch all existing auth users once for performance (with pagination)
    console.log(`[Import] Fetching existing auth users...`);
    let allUsers: any[] = [];
    let authPage = 1;
    let hasMoreAuthUsers = true;

    while (hasMoreAuthUsers) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: authPage,
        perPage: 1000,
      });

      if (error) {
        console.error(`[Import] Error fetching page ${authPage}:`, error);
        break;
      }

      if (data && data.users && data.users.length > 0) {
        allUsers.push(...data.users);
        authPage++;
      } else {
        hasMoreAuthUsers = false;
      }
    }

    const existingAuthEmails = new Set(
      allUsers.filter(u => u.email?.includes("@guidevalidator-staging.com")).map(u => u.email)
    );
    console.log(`[Import] Found ${existingAuthEmails.size} existing staging auth users`);

    const results = {
      total: stagingGuides.length,
      imported: 0,
      skipped: 0,
      errors: [] as Array<{ guide: string; error: string }>,
      details: [] as Array<{ guide: string; status: string; message: string }>,
    };

    // Process in batches to avoid memory issues
    const BATCH_SIZE = 100; // Increased from 10 to 100 for faster processing
    let processedCount = 0;

    for (let i = 0; i < stagingGuides.length; i += BATCH_SIZE) {
      const batch = stagingGuides.slice(i, i + BATCH_SIZE);
      console.log(`[Import] Processing batch ${Math.floor(i / BATCH_SIZE) + 1} (${i + 1}-${Math.min(i + BATCH_SIZE, stagingGuides.length)} of ${stagingGuides.length})`);

      // Import each guide in the batch
      for (const guide of batch) {
        processedCount++;
      try {
        console.log(`[Import] Processing guide: ${guide.name} (${guide.card_number})`);

        const temporaryEmail = `guide-${guide.card_number.replace(/[^a-zA-Z0-9]/g, "")}@guidevalidator-staging.com`.toLowerCase();
        const temporaryPassword = `temp-${guide.card_number}-${Date.now()}`;

        // Step 1: Check if already imported (check by email in auth users)
        if (existingAuthEmails.has(temporaryEmail)) {
          console.log(`[Import] Skipping ${guide.name} - auth user already exists (${temporaryEmail})`);
          results.skipped++;
          results.details.push({
            guide: guide.name || guide.card_number,
            status: "skipped",
            message: "Auth user already exists - likely from failed import",
          });
          continue;
        }

        // Also check if profile exists with this import marker
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("application_data->>imported_from", "guides_staging")
          .eq("application_data->original_data->>card_number", guide.card_number)
          .maybeSingle();

        if (existingProfile) {
          console.log(`[Import] Skipping ${guide.name} - profile already imported`);
          results.skipped++;
          results.details.push({
            guide: guide.name || guide.card_number,
            status: "skipped",
            message: "Already imported with complete profile",
          });
          continue;
        }

        // Step 2: Create auth user
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
          email: temporaryEmail,
          password: temporaryPassword,
          email_confirm: true, // Auto-confirm email
          user_metadata: {
            full_name: guide.name || "Guide",
            role: "guide",
            imported_from: "guides_staging",
          },
        });

        if (authError || !authData.user) {
          console.error(`[Import] Failed to create auth user for ${guide.name}:`, authError);
          results.errors.push({
            guide: guide.name || guide.card_number,
            error: authError?.message || "Failed to create auth user",
          });
          results.details.push({
            guide: guide.name || guide.card_number,
            status: "error",
            message: `Auth creation failed: ${authError?.message}`,
          });
          continue;
        }

        const userId = authData.user.id;
        console.log(`[Import] Created auth user for ${guide.name}: ${userId}`);

        // Add to our tracking set to prevent duplicates in this run
        existingAuthEmails.add(temporaryEmail);

        // Step 3: Update profile (created automatically by trigger when auth user was created)
        const profileCompletionPercentage =
          guide.name && guide.card_number ? 30 : guide.name ? 20 : 10;

        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            role: "guide",
            full_name: guide.name || "Guide",
            locale: "en", // Use English as default (Vietnamese not yet supported)
            country_code: "VN",
            timezone: "Asia/Ho_Chi_Minh",
            verified: false,
            license_verified: false,
            application_status: "approved",
            profile_completed: false,
            profile_completion_percentage: profileCompletionPercentage,
            required_fields_missing: [
              "email",
              "bio",
              "headline",
              "hourly_rate",
              "experience_summary",
              "spoken_languages",
              "specialties",
            ],
            application_data: {
              imported_from: "guides_staging",
              import_date: new Date().toISOString(),
              original_data: {
                name: guide.name,
                country: guide.country,
                card_number: guide.card_number,
                expiry_date: guide.expiry_date,
                province_issue: guide.province_issue,
                card_type: guide.card_type,
                language: guide.language,
                experience: guide.experience,
                image_url: guide.image_url,
                source_url: guide.source_url,
              },
            },
          })
          .eq("id", userId);

        if (profileError) {
          console.error(`[Import] Failed to update profile for ${guide.name}:`, profileError);
          // Rollback: Delete auth user
          await supabase.auth.admin.deleteUser(userId);
          results.errors.push({
            guide: guide.name || guide.card_number,
            error: profileError.message,
          });
          results.details.push({
            guide: guide.name || guide.card_number,
            status: "error",
            message: `Profile update failed: ${profileError.message}`,
          });
          continue;
        }

        console.log(`[Import] Updated profile for ${guide.name}`);

        // Step 4: Create guides table entry
        const spokenLanguages = guide.language
          ? guide.language.split(",").map((l: string) => l.trim().toLowerCase())
          : ["vi"];

        const yearsExperience = guide.experience && /^\d+$/.test(guide.experience)
          ? parseInt(guide.experience)
          : null;

        const headline = guide.card_type
          ? `Licensed ${guide.card_type} Guide`
          : "Licensed Tour Guide";

        const { error: guideError } = await supabase.from("guides").insert({
          profile_id: userId,
          headline,
          bio: guide.experience || "Professional tour guide in Vietnam. Profile completion pending.",
          spoken_languages: spokenLanguages,
          years_experience: yearsExperience,
          experience_summary: guide.experience,
          avatar_url: guide.image_url,
          currency: "VND",
        });

        if (guideError) {
          console.error(`[Import] Failed to create guide entry for ${guide.name}:`, guideError);
          // Non-critical error - continue
        } else {
          console.log(`[Import] Created guide entry for ${guide.name}`);
        }

        // Step 5: Create guide_credentials entry
        let expiresAt = null;
        if (guide.expiry_date && /^\d{4}-\d{2}-\d{2}$/.test(guide.expiry_date)) {
          expiresAt = guide.expiry_date;
        }

        const { error: credentialError } = await supabase.from("guide_credentials").insert({
          guide_id: userId,
          credential_type: guide.card_type || "license",
          country_code: "VN",
          authority_name: guide.province_issue || "Vietnam Tourism Authority",
          license_number: guide.card_number,
          expires_at: expiresAt,
          status: "pending",
        });

        if (credentialError) {
          console.error(`[Import] Failed to create credential for ${guide.name}:`, credentialError);
          // Non-critical error - continue
        } else {
          console.log(`[Import] Created credential for ${guide.name}`);
        }

        // Step 6: Generate claim token
        const claimToken = Buffer.from(
          Array.from({ length: 32 }, () => Math.floor(Math.random() * 256))
        ).toString("base64");

        console.log(`[Import] Generating claim token for ${guide.name}...`);

        const { error: tokenError } = await supabase.from("profile_claim_tokens").insert({
          profile_id: userId,
          license_number: guide.card_number,
          token: claimToken,
          expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
        });

        if (tokenError) {
          console.error(`[Import] Failed to create claim token for ${guide.name}:`, tokenError);
          results.details.push({
            guide: guide.name || guide.card_number,
            status: "warning",
            message: `Claim token creation failed: ${tokenError.message}`,
          });
          // Non-critical error - continue
        } else {
          console.log(`[Import] ✓ Created claim token for ${guide.name}`);
        }

        console.log(`[Import] ✓ Successfully imported ${guide.name}`);
        results.imported++;
        results.details.push({
          guide: guide.name || guide.card_number,
          status: "success",
          message: "Imported successfully",
        });
      } catch (error) {
        console.error(`Error importing guide ${guide.name}:`, error);
        results.errors.push({
          guide: guide.name || guide.card_number,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }

      // Small delay between batches to prevent overwhelming the database
      if (i + BATCH_SIZE < stagingGuides.length) {
        await new Promise(resolve => setTimeout(resolve, 50)); // Reduced from 100ms to 50ms
      }
    }

    console.log(`[Import] Import completed: ${results.imported} imported, ${results.skipped} skipped, ${results.errors.length} errors`);

    return NextResponse.json({
      success: true,
      message: "Import completed",
      results,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
