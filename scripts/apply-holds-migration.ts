import { readFileSync } from "fs";
import { join } from "path";
import pg from "pg";

async function applyMigration() {
  const client = new pg.Client({
    host: "db.vhqzmunorymtoisijiqb.supabase.co",
    port: 5432,
    database: "postgres",
    user: "postgres",
    password: "Vertrouwen17#",
  });

  try {
    await client.connect();
    console.log("✓ Connected to database\n");

    // Read the migration file
    const migrationPath = join(
      process.cwd(),
      "supabase",
      "migrations",
      "20251005150000_availability_holds_system.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf8");

    console.log("Applying migration: 20251005150000_availability_holds_system.sql");

    // Execute the migration
    await client.query(migrationSQL);

    console.log("✓ Migration applied successfully!\n");

    // Verify the table exists
    console.log("Verifying availability_holds table...");
    const checkTable = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'availability_holds'
      ORDER BY ordinal_position;
    `);

    console.log(`✓ Table created with ${checkTable.rows.length} columns`);
    console.log("\nColumns:");
    checkTable.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log("\n✅ Availability holds system is ready!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
