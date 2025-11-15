// Apply billing plans migration
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function applyMigration() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Apply Billing Plans Migration                    ║');
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

    // Read migration file
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20250214_create_initial_billing_plans.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Applying migration...\n');
    await client.query(migrationSQL);
    console.log('✅ Migration applied successfully\n');

    // Verify plans were created
    const plansQuery = await client.query(`
      SELECT plan_code, description, amount_cents / 100 as amount, interval, target_role, is_active
      FROM billing_plans
      WHERE target_role = 'guide'
      ORDER BY amount_cents;
    `);

    console.log('Created billing plans:\n');
    plansQuery.rows.forEach(plan => {
      console.log(`  ✓ ${plan.plan_code}`);
      console.log(`    ${plan.description}`);
      console.log(`    €${plan.amount} per ${plan.interval}\n`);
    });

  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration().catch(console.error);
