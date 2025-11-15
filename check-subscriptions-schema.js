// Check subscriptions table and plan codes
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkSubscriptions() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Subscriptions Schema                       ║');
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

    // Check subscriptions table columns
    const columnsQuery = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position;
    `);

    console.log('Subscriptions table columns:\n');
    columnsQuery.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
    });

    // Check billing_plans
    const plansQuery = await client.query(`
      SELECT plan_code, description, target_role, is_active, amount_cents, interval
      FROM billing_plans
      WHERE is_active = true;
    `);

    console.log('\n\nActive billing plans:\n');
    if (plansQuery.rows.length > 0) {
      plansQuery.rows.forEach(plan => {
        console.log(`  - ${plan.plan_code}`);
        console.log(`    Description: ${plan.description || '(none)'}`);
        console.log(`    Target role: ${plan.target_role || 'any'}`);
        console.log(`    Amount: ${plan.amount_cents / 100} ${plan.interval}\n`);
      });
    } else {
      console.log('  No active plans found\n');
    }

    // Check active subscriptions
    const activeSubsQuery = await client.query(`
      SELECT
        COUNT(*) as total,
        plan_code,
        status
      FROM subscriptions
      GROUP BY plan_code, status
      ORDER BY plan_code, status;
    `);

    console.log('\nSubscriptions by plan and status:\n');
    if (activeSubsQuery.rows.length > 0) {
      activeSubsQuery.rows.forEach(row => {
        console.log(`  ${row.plan_code || '(null)'} - ${row.status}: ${row.total}`);
      });
    } else {
      console.log('  No subscriptions found\n');
    }

  } catch (err) {
    console.error('❌ Error:', err.message);
  } finally {
    await client.end();
  }
}

checkSubscriptions().catch(console.error);
