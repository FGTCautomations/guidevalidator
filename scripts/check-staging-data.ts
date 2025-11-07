import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function checkStagingData() {
  console.log("🔍 Checking for staging data...\n");

  // Check auth users with staging emails
  console.log("1. Checking auth users...");
  let allUsers: any[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 1000,
    });

    if (error) {
      console.error(`   Error fetching page ${page}:`, error);
      break;
    }

    if (data && data.users && data.users.length > 0) {
      allUsers.push(...data.users);
      page++;
    } else {
      hasMore = false;
    }
  }

  const stagingAuthUsers = allUsers.filter(
    u => u.email?.includes("@guidevalidator-staging.com")
  );

  console.log(`   Total auth users: ${allUsers.length}`);
  console.log(`   Staging auth users: ${stagingAuthUsers.length}`);

  if (stagingAuthUsers.length > 0) {
    console.log(`   Sample emails:`);
    stagingAuthUsers.slice(0, 5).forEach(u => console.log(`   - ${u.email}`));
  }

  // Check profiles with staging marker
  console.log("\n2. Checking profiles with staging marker...");
  const { data: markedProfiles, error: markedError } = await supabase
    .from("profiles")
    .select("id, full_name, application_data")
    .eq("application_data->>imported_from", "guides_staging");

  if (markedError) {
    console.error("   Error:", markedError);
  } else {
    console.log(`   Profiles with staging marker: ${markedProfiles?.length || 0}`);
  }

  // Check profiles by auth user IDs
  if (stagingAuthUsers.length > 0) {
    console.log("\n3. Checking profiles by staging auth user IDs...");
    const authUserIds = stagingAuthUsers.map(u => u.id);

    const { data: profilesByIds, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, profile_completed, application_status")
      .in("id", authUserIds.slice(0, 100)); // Check first 100

    if (profilesError) {
      console.error("   Error:", profilesError);
    } else {
      console.log(`   Profiles matching auth user IDs: ${profilesByIds?.length || 0}`);
      if (profilesByIds && profilesByIds.length > 0) {
        console.log(`   Sample profiles:`);
        profilesByIds.slice(0, 5).forEach(p =>
          console.log(`   - ${p.full_name} (completed: ${p.profile_completed})`)
        );
      }
    }
  }

  // Check guides_staging table
  console.log("\n4. Checking guides_staging table...");
  const { data: stagingGuides, error: stagingError } = await supabase
    .from("guides_staging")
    .select("card_number, name")
    .not("card_number", "is", null)
    .limit(5);

  if (stagingError) {
    console.error("   Error:", stagingError);
  } else {
    console.log(`   Sample guides in staging:`);
    stagingGuides?.forEach(g => console.log(`   - ${g.name} (${g.card_number})`));
  }

  // Check claim tokens
  if (stagingAuthUsers.length > 0) {
    console.log("\n5. Checking claim tokens...");
    const authUserIds = stagingAuthUsers.map(u => u.id);

    const { data: tokens, error: tokensError } = await supabase
      .from("profile_claim_tokens")
      .select("profile_id, license_number")
      .in("profile_id", authUserIds.slice(0, 100));

    if (tokensError) {
      console.error("   Error:", tokensError);
    } else {
      console.log(`   Claim tokens: ${tokens?.length || 0}`);
    }
  }

  console.log("\n✅ Check complete");
}

checkStagingData().catch(console.error);
