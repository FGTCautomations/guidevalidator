import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function testProfileInsert() {
  console.log("Test 1: Create auth user");

  const testEmail = `test-${Date.now()}@guidevalidator-staging.com`;
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: "test-password-123",
    email_confirm: true,
  });

  if (authError || !authData.user) {
    console.log("❌ Auth user creation failed:", authError);
    return;
  }

  const userId = authData.user.id;
  console.log(`✓ Created auth user: ${userId}`);

  console.log("\nTest 2: Insert profile with same ID");

  const { data: profileData, error: profileError } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      role: "guide",
      full_name: "Test Guide",
      locale: "en",
      country_code: "VN",
      timezone: "Asia/Ho_Chi_Minh",
      verified: false,
      license_verified: false,
      application_status: "approved",
      profile_completed: false,
      profile_completion_percentage: 30,
    })
    .select();

  if (profileError) {
    console.log("❌ Profile insert failed:", profileError);
    console.log("\nTest 3: Check if profile already exists");

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfile) {
      console.log("✓ Profile DOES exist:", existingProfile);
    } else {
      console.log("✗ Profile does NOT exist - this is the bug!");
    }
  } else {
    console.log("✓ Profile created successfully:", profileData);
  }

  // Cleanup
  console.log("\nCleaning up test data...");
  await supabase.auth.admin.deleteUser(userId);
  await supabase.from("profiles").delete().eq("id", userId);
  console.log("✓ Cleanup complete");
}

testProfileInsert();
