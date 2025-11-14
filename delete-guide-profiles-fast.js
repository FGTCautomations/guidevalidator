const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteGuideProfilesFast() {
  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║  DELETE ALL GUIDE PROFILES (FAST)              ║');
  console.log('╚════════════════════════════════════════════════╝\n');

  console.log('Deleting all guide profiles in batches...\n');

  let totalDeleted = 0;
  let batchNumber = 0;
  const batchSize = 1000;

  while (true) {
    batchNumber++;
    console.log(`Batch ${batchNumber}: Deleting up to ${batchSize} profiles...`);

    // Delete profiles directly using role filter
    const { error: deleteError, count } = await supabase
      .from('profiles')
      .delete({ count: 'exact' })
      .eq('role', 'guide')
      .limit(batchSize);

    if (deleteError) {
      console.error('  ✗ Error:', deleteError.message);
      break;
    }

    const deleted = count || 0;
    totalDeleted += deleted;

    console.log(`  ✓ Deleted ${deleted} profiles (Total: ${totalDeleted})`);

    // If we deleted less than the batch size, we're done
    if (deleted < batchSize) {
      console.log('\n✓ All guide profiles deleted!');
      break;
    }

    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n╔════════════════════════════════════════════════╗');
  console.log('║              DELETE SUMMARY                    ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log(`Total profiles deleted:       ${totalDeleted}`);
  console.log(`Batches processed:            ${batchNumber}`);
  console.log('════════════════════════════════════════════════\n');

  return { deleted: totalDeleted };
}

deleteGuideProfilesFast()
  .then((result) => {
    console.log('✓ Process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Process failed:', error);
    process.exit(1);
  });
