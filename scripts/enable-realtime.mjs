import pg from 'pg';

const { Client } = pg;

async function enableRealtime() {
  const client = new Client({
    host: 'db.vhqzmunorymtoisijiqb.supabase.co',
    port: 5432,
    database: 'postgres',
    user: 'postgres',
    password: 'Vertrouwen17#',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase database...');
    await client.connect();
    console.log('✅ Connected successfully\n');

    const tables = ['conversations', 'messages', 'message_attachments', 'conversation_participants'];

    console.log('🔴 Enabling Realtime replication for chat tables...\n');

    for (const table of tables) {
      console.log(`  📡 Configuring ${table}...`);

      try {
        // Check if publication exists
        const pubCheck = await client.query(`
          SELECT 1 FROM pg_publication_tables
          WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = $1;
        `, [table]);

        if (pubCheck.rows.length > 0) {
          console.log(`     ℹ️  Already enabled for supabase_realtime`);
        } else {
          // Add table to publication
          await client.query(`
            ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};
          `);
          console.log(`     ✅ Added to supabase_realtime publication`);
        }

        // Enable replica identity for updates/deletes tracking
        await client.query(`
          ALTER TABLE public.${table} REPLICA IDENTITY FULL;
        `);
        console.log(`     ✅ Replica identity set to FULL`);

      } catch (err) {
        if (err.message.includes('already member of publication')) {
          console.log(`     ℹ️  Already in publication`);
        } else if (err.message.includes('publication "supabase_realtime" does not exist')) {
          console.log(`     ⚠️  Publication doesn't exist. Creating...`);

          // Create publication if it doesn't exist
          await client.query(`
            CREATE PUBLICATION supabase_realtime;
          `);
          console.log(`     ✅ Created supabase_realtime publication`);

          // Add table
          await client.query(`
            ALTER PUBLICATION supabase_realtime ADD TABLE public.${table};
          `);
          console.log(`     ✅ Added ${table} to publication`);

          // Set replica identity
          await client.query(`
            ALTER TABLE public.${table} REPLICA IDENTITY FULL;
          `);
          console.log(`     ✅ Replica identity set to FULL`);
        } else {
          throw err;
        }
      }
    }

    // Verify configuration
    console.log('\n📊 Verifying Realtime configuration...');
    const verification = await client.query(`
      SELECT
        schemaname,
        tablename,
        pubname
      FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = ANY($1)
      ORDER BY tablename;
    `, [tables]);

    if (verification.rows.length === tables.length) {
      console.log('✅ All chat tables are configured for Realtime:');
      verification.rows.forEach(row => {
        console.log(`   - ${row.tablename}`);
      });
    } else {
      console.warn(`⚠️  Expected ${tables.length} tables, found ${verification.rows.length}`);
      console.log('Configured tables:', verification.rows.map(r => r.tablename).join(', '));
    }

    // Check replica identity
    console.log('\n📊 Checking replica identity settings...');
    const replicaCheck = await client.query(`
      SELECT
        relname AS table_name,
        CASE relreplident
          WHEN 'd' THEN 'default'
          WHEN 'n' THEN 'nothing'
          WHEN 'f' THEN 'full'
          WHEN 'i' THEN 'index'
        END AS replica_identity
      FROM pg_class
      WHERE relnamespace = 'public'::regnamespace
      AND relname = ANY($1);
    `, [tables]);

    console.log('Replica identity settings:');
    replicaCheck.rows.forEach(row => {
      const icon = row.replica_identity === 'full' ? '✅' : '⚠️ ';
      console.log(`   ${icon} ${row.table_name}: ${row.replica_identity}`);
    });

    console.log('\n✅ Realtime setup complete!');
    console.log('\nℹ️  Note: Changes may take a few moments to propagate.');
    console.log('ℹ️  Test Realtime by opening the chat in two browser tabs.');

  } catch (error) {
    console.error('\n❌ Error enabling Realtime:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  } finally {
    await client.end();
    console.log('🔌 Database connection closed');
  }
}

enableRealtime();
