// Check for triggers on guides table
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkTriggers() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Guides Table Triggers                      ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  const client = new Client({
    host: 'db.vhqzmunorymtoisijiqb.supabase.co',
    port: 5432,
    user: 'postgres',
    password: 'Vertrouwen17#',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected\n');

    // Get triggers on guides table
    const triggersQuery = await client.query(`
      SELECT
        trigger_name,
        event_manipulation,
        action_statement,
        action_timing
      FROM information_schema.triggers
      WHERE event_object_table = 'guides';
    `);

    if (triggersQuery.rows.length > 0) {
      console.log('Triggers on guides table:\n');
      triggersQuery.rows.forEach(trigger => {
        console.log(`  - ${trigger.trigger_name}`);
        console.log(`    Event: ${trigger.action_timing} ${trigger.event_manipulation}`);
        console.log(`    Action: ${trigger.action_statement}\n`);
      });
    } else {
      console.log('No triggers found on guides table\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkTriggers().catch(console.error);
