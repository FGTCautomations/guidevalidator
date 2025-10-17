import { readdirSync, readFileSync } from "fs";
import { resolve, join } from "path";
import { Client } from "pg";

async function applySeeds() {
  const connectionString =
    process.env.MIGRATION_DB_URL ||
    process.env.SUPABASE_DB_URL ||
    process.env.DATABASE_URL ||
    process.env.SUPABASE_DB_URL_PRIMARY;

  if (!connectionString) {
    console.error("Missing database connection string. Set SUPABASE_DB_URL or MIGRATION_DB_URL.");
    process.exit(1);
  }

  const startFrom = process.env.SEEDS_START || "";

  const client = new Client({ connectionString });

  await client.connect();
  console.log("Connected to database.");

  const seedsDir = resolve("supabase/seed");
  const seeds = readdirSync(seedsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort()
    .filter((file) => file >= startFrom);

  for (const file of seeds) {
    const fullPath = join(seedsDir, file);
    const sql = readFileSync(fullPath, "utf8");

    console.log(`\nRunning seed: ${file}`);
    try {
      await client.query(sql);
      console.log(`Seed ${file} ran successfully.`);
    } catch (error) {
      console.error(`Failed to run seed ${file}:`, error);
      await client.end();
      process.exit(1);
    }
  }

  await client.end();
  console.log("\nAll seeds applied successfully.");
}

applySeeds().catch((error) => {
  console.error("Unexpected error applying seeds:", error);
  process.exit(1);
});
