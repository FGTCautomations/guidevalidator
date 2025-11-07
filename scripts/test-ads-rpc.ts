// Test the ads RPC function directly
// Run with: npx tsx scripts/test-ads-rpc.ts

import { getSupabaseServerClient } from "../lib/supabase/server";

async function testAdsRPC() {
  console.log("Testing Ads RPC Function...\n");

  const supabase = getSupabaseServerClient();

  // Test 1: Check if ads exist
  console.log("1. Checking if ads exist in database:");
  const { data: allAds, error: adsError } = await supabase
    .from("ads")
    .select("*");

  if (adsError) {
    console.error("❌ Error fetching ads:", adsError);
  } else {
    console.log(`✅ Found ${allAds?.length || 0} ads in database`);
    allAds?.forEach((ad) => {
      console.log(`  - ID: ${ad.id}, Name: ${ad.advertiser_name}, Active: ${ad.is_active}, Placement: ${ad.placement}`);
    });
  }

  console.log("\n2. Testing RPC function directly:");

  // Test 2: Call RPC for homepage_mid
  const { data: homepageAd, error: homepageError } = await supabase.rpc(
    "select_ad",
    {
      p_placement: "homepage_mid",
      p_country: null,
      p_list_context: null,
    }
  );

  if (homepageError) {
    console.error("❌ Error calling RPC for homepage_mid:", homepageError);
  } else {
    console.log(`✅ RPC for homepage_mid returned:`, homepageAd);
    console.log(`   Length: ${homepageAd?.length || 0}`);
  }

  // Test 3: Call RPC for footer
  const { data: footerAd, error: footerError } = await supabase.rpc(
    "select_ad",
    {
      p_placement: "footer",
      p_country: null,
      p_list_context: null,
    }
  );

  if (footerError) {
    console.error("❌ Error calling RPC for footer:", footerError);
  } else {
    console.log(`✅ RPC for footer returned:`, footerAd);
    console.log(`   Length: ${footerAd?.length || 0}`);
  }

  console.log("\n3. Testing direct SQL query:");

  // Test 4: Direct SQL to see what should match
  const { data: matchingAds, error: matchError } = await supabase
    .from("ads")
    .select("*")
    .eq("is_active", true)
    .contains("placement", ["homepage_mid"]);

  if (matchError) {
    console.error("❌ Error with direct query:", matchError);
  } else {
    console.log(`✅ Direct query for homepage_mid found ${matchingAds?.length || 0} ads`);
    matchingAds?.forEach((ad) => {
      console.log(`  - ID: ${ad.id}, Name: ${ad.advertiser_name}`);
    });
  }

  console.log("\nDone!");
  process.exit(0);
}

testAdsRPC().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
