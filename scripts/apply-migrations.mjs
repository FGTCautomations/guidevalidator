import { readdirSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { Client } from "pg";

async function applyMigrations() {
  const connectionString =
    process.env.MIGRATION_DB_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL_PRIMARY;

  if (!connectionString) {
    console.error("Missing database connection string. Set MIGRATION_DB_URL or SUPABASE_DB_URL.");
    process.exit(1);
  }

  const startFrom = process.env.MIGRATIONS_START || "";

  const client = new Client({ connectionString });

  await client.connect();
  console.log("Connected to database.");

  const migrationsDir = resolve("supabase/migrations");
  const migrations = readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .filter((file) => file >= startFrom);

  for (const file of migrations) {
    const fullPath = join(migrationsDir, file);
    const sql = readFileSync(fullPath, "utf8");

    console.log(`\nApplying migration: ${file}`);
    try {
      await client.query(sql);
      console.log(`Migration ${file} applied successfully.`);
    } catch (error) {
      console.error(`Failed to apply migration ${file}:`, error);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("\nAll migrations applied successfully.");
}

applyMigrations().catch((error) => {
  console.error("Unexpected error applying migrations:", error);
  process.exit(1);
});
