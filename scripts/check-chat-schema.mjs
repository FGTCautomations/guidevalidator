import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vhqzmunorymtoisijiqb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NTQ4MjUsImV4cCI6MjA1MzAzMDgyNX0.lxmMHhRr_cpuuaQDNbW52xXCRAEtB8_OdqTPFDKgR7o'
);

async function checkSchema() {
  console.log('Checking messages table schema...');
  const { data: messagesColumns, error: messagesError } = await supabase.rpc('exec_sql', {
    sql: `SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' AND table_schema = 'public' ORDER BY ordinal_position;`
  });

  if (messagesError) {
    // Try direct query
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (data && data.length > 0) {
      console.log('Messages columns:', Object.keys(data[0]));
    } else {
      console.log('Messages error:', error);
    }
  } else {
    console.log('Messages columns:', messagesColumns);
  }

  console.log('\nChecking conversation_participants table schema...');
  const { data: participants, error: partError } = await supabase
    .from('conversation_participants')
    .select('*')
    .limit(1);

  if (participants && participants.length > 0) {
    console.log('Conversation_participants columns:', Object.keys(participants[0]));
  } else {
    console.log('Conversation_participants error:', partError);
  }
}

checkSchema().catch(console.error);
