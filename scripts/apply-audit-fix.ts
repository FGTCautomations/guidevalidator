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
      "20251005140000_fix_audit_logs_columns.sql"
    );
    const migrationSQL = readFileSync(migrationPath, "utf8");

    console.log("Applying migration: 20251005140000_fix_audit_logs_columns.sql");

    // Execute the migration
    await client.query(migrationSQL);

    console.log("✓ Migration applied successfully!\n");

    // Verify the columns now exist by checking schema
    console.log("Verifying occurred_at column exists...");
    const checkResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'audit_logs'
      AND column_name = 'occurred_at';
    `);

    if (checkResult.rows.length > 0) {
      console.log("✓ occurred_at column verified:", checkResult.rows[0].data_type);
    } else {
      throw new Error("occurred_at column still missing!");
    }

    console.log("\n✅ Audit logs table is now ready!");
  } catch (error: any) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigration();
