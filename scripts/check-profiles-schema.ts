import pg from "pg";

async function checkSchema() {
  const client = new pg.Client({
    host: "db.vhqzmunorymtoisijiqb.supabase.co",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "Vertrouwen17#",
  });

  try {
    await client.connect();
    const res = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name='profiles'
      ORDER BY ordinal_position
    `);

    console.log("Profiles table columns:");
    res.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type}`);
    });
  } finally {
    await client.end();
  }
}

checkSchema();
