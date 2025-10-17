import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://vhqzmunorymtoisijiqb.supabase.co";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuditLogs() {
  console.log("✓ Connected\n");

  // Check audit_logs table structure
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .limit(1);

  if (error) {
    console.log("Error querying audit_logs:", error);
  } else {
    console.log("Sample audit_log entry:", data);
  }

  // Try to get table columns via raw SQL
  const { data: columns, error: colError } = await supabase.rpc("exec_sql", {
    query: `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'audit_logs'
      ORDER BY ordinal_position;
    `,
  });

  if (!colError && columns) {
    console.log("\nAudit logs columns:", columns);
  }
}

checkAuditLogs();
