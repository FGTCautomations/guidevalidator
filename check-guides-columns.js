// Check what columns the guides table actually has
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function checkColumns() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Check Guides Table Columns                       ║');
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

    // Get all columns from guides table
    const columnsQuery = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'guides'
      ORDER BY ordinal_position;
    `);

    console.log('Guides table columns:\n');
    columnsQuery.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
    });

    // Check guides_browse_v view
    console.log('\n\nGuides_browse_v view columns:\n');
    const viewQuery = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'guides_browse_v'
      ORDER BY ordinal_position;
    `);

    viewQuery.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`);
    });

    // Sample a guide to see data
    console.log('\n\nSample guide record:\n');
    const sampleQuery = await client.query(`
      SELECT *
      FROM guides
      LIMIT 1;
    `);

    if (sampleQuery.rows.length > 0) {
      const guide = sampleQuery.rows[0];
      Object.keys(guide).forEach(key => {
        const value = guide[key];
        const displayValue = value === null ? '(null)' :
                           typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' :
                           value;
        console.log(`  ${key}: ${displayValue}`);
      });
    }

    console.log('\n');

  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('\nFull error:', err);
  } finally {
    await client.end();
  }
}

checkColumns().catch(console.error);
