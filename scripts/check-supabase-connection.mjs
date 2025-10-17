import { readFileSync } from "fs";
import { Client } from "pg";

function getSupabaseDbUrl() {
  const envText = readFileSync(".env.local", "utf8");
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    if (line.startsWith("SUPABASE_DB_URL=")) {
      const value = line.slice("SUPABASE_DB_URL=".length).trim();
      return value.replace(/^['"]|['"]$/g, "");
    }
  }
  throw new Error("SUPABASE_DB_URL not found in .env.local");
}

function sanitizeConnectionString(raw) {
  const atIndex = raw.indexOf("@");
  if (atIndex === -1) {
    return raw;
  }

  const prefix = raw.slice(0, atIndex);
  if (!prefix.includes("#") || prefix.includes("%23")) {
    return raw;
  }

  const sanitizedPrefix = prefix.replace(/#/g, "%23");
  return sanitizedPrefix + raw.slice(atIndex);
}

async function main() {
  const connectionString = sanitizeConnectionString(getSupabaseDbUrl());
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log("Connected to Supabase database.");
    const { rows } = await client.query(
      "select table_schema, table_name from information_schema.tables where table_schema in ('public','storage','auth') order by table_schema, table_name limit 20"
    );
    if (!rows.length) {
      console.log("No tables found in the requested schemas.");
      return;
    }
    console.log("Sample tables:");
    for (const row of rows) {
      console.log(`- ${row.table_schema}.${row.table_name}`);
    }
  } finally {
    await client.end().catch(() => {});
  }
}

main().catch((error) => {
  console.error("Failed to connect or query Supabase:", error);
  process.exit(1);
});
