const https = require('https');
const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://vhqzmunorymtoisijiqb.supabase.co';
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Read SQL file
const sqlStatements = [
  "ALTER TABLE agencies ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false",
  "CREATE INDEX IF NOT EXISTS idx_agencies_active ON agencies(active)"
];

async function executeSQLStatement(sql) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ query: sql });

    const options = {
      hostname: SUPABASE_URL.replace('https://', '').replace('http://', ''),
      port: 443,
      path: '/rest/v1/rpc/exec_sql',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve({ success: true, data: responseBody });
        } else {
          resolve({ success: false, error: responseBody, status: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(data);
    req.end();
  });
}

async function runMigration() {
  console.log('🔄 Executing SQL migration...\n');

  // Try to execute ALTER TABLE
  console.log('Attempting to add active column...');
  console.log('Note: This may not work if exec_sql RPC function does not exist.\n');

  const result = await executeSQLStatement(sqlStatements[0]);

  if (!result.success) {
    console.log('❌ Cannot execute SQL via API (exec_sql function may not exist)');
    console.log('Status:', result.status);
    console.log('Response:', result.error);
    console.log('\n⚠️  Please manually run the SQL in Supabase SQL Editor:');
    console.log('\nFile: add-active-field.sql\n');
    console.log('Or copy and paste:');
    console.log('────────────────────────────────────');
    console.log(fs.readFileSync('add-active-field.sql', 'utf8'));
    console.log('────────────────────────────────────\n');
    process.exit(1);
  }

  console.log('✅ SQL executed successfully!');
  console.log('Now run: node add-active-field-simple.js');
}

runMigration().catch(console.error);
