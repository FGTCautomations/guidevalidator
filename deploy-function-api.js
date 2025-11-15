// Deploy Edge Function via Supabase Management API
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

async function deployFunction() {
  console.log('\n╔═══════════════════════════════════════════════════╗');
  console.log('║  Deploy Edge Function via API                     ║');
  console.log('╚═══════════════════════════════════════════════════╝\n');

  // Read the function code
  const functionPath = path.join(__dirname, 'supabase', 'functions', 'guides-search', 'index.ts');
  const functionCode = fs.readFileSync(functionPath, 'utf8');

  console.log('Function code loaded. Size:', functionCode.length, 'bytes\n');

  // Use Supabase Management API to deploy
  // Note: This requires a management API token which may not be available
  // Alternative: Upload via dashboard or use CLI with Docker

  const projectRef = 'vhqzmunorymtoisijiqb';
  const functionName = 'guides-search';
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('Attempting deployment via Supabase Management API...\n');

  try {
    // Try using the Edge Functions API endpoint
    const deployUrl = `https://${projectRef}.supabase.co/functions/v1/${functionName}`;

    console.log('❌ Deployment via API requires Docker or manual upload.\n');
    console.log('The code has been updated and committed to git.');
    console.log('\nTo deploy the Edge Function, please use ONE of these methods:\n');
    console.log('1. Open Supabase Dashboard:');
    console.log('   https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/functions');
    console.log('   Click "Deploy new version" on the guides-search function\n');
    console.log('2. Use Supabase CLI with Docker Desktop running:');
    console.log('   npm run supabase:deploy-function\n');
    console.log('3. If auto-deploy is enabled, push to GitHub:');
    console.log('   git push origin main\n');
    console.log('The fix is ready - just needs to be deployed!');
    console.log('Once deployed, run: node test-edge-function-simple.js\n');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

deployFunction().catch(console.error);
