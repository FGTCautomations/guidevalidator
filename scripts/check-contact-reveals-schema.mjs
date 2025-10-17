import postgres from 'postgres';

const sql = postgres('postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres', {
  ssl: 'require'
});

async function checkSchema() {
  try {
    const columns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'contact_reveals'
      ORDER BY ordinal_position
    `;
    console.log('Contact_reveals columns:', columns);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sql.end();
  }
}

checkSchema();
