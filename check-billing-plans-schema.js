// Check billing_plans table structure
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkBillingPlans() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Billing Plans Table Schema                ║');
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

    // Check table structure
    const columnsQuery = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'billing_plans'
      ORDER BY ordinal_position;
    `);

    console.log('Billing Plans table columns:\n');
    columnsQuery.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})${col.column_default ? ` DEFAULT ${col.column_default}` : ''}`);
    });

    // Check if table has any plans (active or not)
    const allPlansQuery = await client.query(`
      SELECT plan_code, description, target_role, is_active, amount_cents, interval
      FROM billing_plans;
    `);

    console.log('\n\nAll billing plans (active and inactive):\n');
    if (allPlansQuery.rows.length > 0) {
      allPlansQuery.rows.forEach(plan => {
        console.log(`  - ${plan.plan_code} (${plan.is_active ? 'ACTIVE' : 'INACTIVE'})`);
        console.log(`    Description: ${plan.description || '(none)'}`);
        console.log(`    Target role: ${plan.target_role || 'any'}`);
        console.log(`    Amount: ${plan.amount_cents / 100} ${plan.interval}\n`);
      });
    } else {
      console.log('  No plans found - table is empty\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkBillingPlans().catch(console.error);
