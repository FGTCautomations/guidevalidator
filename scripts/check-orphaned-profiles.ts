import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function checkOrphanedProfiles() {
  // Check specific UUID that's failing
  const failingId = "49828f93-167f-43f3-b835-9938d960e7ae";

  console.log(`Checking profile with ID: ${failingId}`);

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", failingId)
    .maybeSingle();

  if (error) {
    console.log("Error:", error);
  } else if (profile) {
    console.log("✓ Profile EXISTS:");
    console.log(`  Name: ${profile.full_name}`);
    console.log(`  Role: ${profile.role}`);
    console.log(`  Completed: ${profile.profile_completed}`);
    console.log(`  Application data:`, profile.application_data);
  } else {
    console.log("Profile does NOT exist");
  }

  // Check auth user with same ID
  console.log(`\nChecking auth user with ID: ${failingId}`);
  const { data: authUser } = await supabase.auth.admin.getUserById(failingId);

  if (authUser?.user) {
    console.log("✓ Auth user EXISTS:");
    console.log(`  Email: ${authUser.user.email}`);
  } else {
    console.log("Auth user does NOT exist");
  }
}

checkOrphanedProfiles();
