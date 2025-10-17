import { Client } from 'pg';

const connectionString = 'postgresql://postgres.vhqzmunorymtoisijiqb:Vertrouwen17%23@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres';

async function main() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✓ Connected\n');

    // Check all reviews
    console.log('=== ALL REVIEWS IN DATABASE ===');
    const allReviews = await client.query(`
      SELECT
        id,
        reviewer_id,
        reviewee_id,
        reviewer_type,
        reviewee_type,
        overall_rating,
        title,
        status,
        created_at
      FROM reviews
      ORDER BY created_at DESC
      LIMIT 10
    `);

    if (allReviews.rows.length === 0) {
      console.log('❌ No reviews found in database!\n');
    } else {
      console.log(`Found ${allReviews.rows.length} reviews:\n`);
      allReviews.rows.forEach((review: any, idx: number) => {
        console.log(`${idx + 1}. Review ${review.id.substring(0, 8)}...`);
        console.log(`   From: ${review.reviewer_type} (${review.reviewer_id.substring(0, 8)}...)`);
        console.log(`   To: ${review.reviewee_type} (${review.reviewee_id.substring(0, 8)}...)`);
        console.log(`   Rating: ${review.overall_rating}/5`);
        console.log(`   Title: ${review.title || 'No title'}`);
        console.log(`   Status: ${review.status}`);
        console.log(`   Created: ${review.created_at}`);
        console.log('');
      });
    }

    // Check reviews by status
    console.log('\n=== REVIEWS BY STATUS ===');
    const statusCount = await client.query(`
      SELECT status, COUNT(*) as count
      FROM reviews
      GROUP BY status
      ORDER BY count DESC
    `);

    if (statusCount.rows.length === 0) {
      console.log('No reviews in any status\n');
    } else {
      statusCount.rows.forEach((row: any) => {
        console.log(`  ${row.status}: ${row.count}`);
      });
    }

    // Check specific reviewer/reviewee
    console.log('\n\n=== CHECKING FOR GUIDE → AGENCY REVIEWS ===');
    const guideReviews = await client.query(`
      SELECT
        r.id,
        r.reviewer_id,
        r.reviewee_id,
        r.status,
        r.title,
        p.full_name as reviewer_name,
        p.role as reviewer_role,
        a.name as reviewee_name,
        a.type as reviewee_type
      FROM reviews r
      LEFT JOIN profiles p ON r.reviewer_id = p.id
      LEFT JOIN agencies a ON r.reviewee_id = a.id
      WHERE r.reviewer_type = 'guide'
      ORDER BY r.created_at DESC
      LIMIT 5
    `);

    if (guideReviews.rows.length === 0) {
      console.log('❌ No guide reviews found\n');
    } else {
      console.log(`Found ${guideReviews.rows.length} guide reviews:\n`);
      guideReviews.rows.forEach((review: any, idx: number) => {
        console.log(`${idx + 1}. ${review.reviewer_name || 'Unknown'} (guide) reviewed ${review.reviewee_name || 'Unknown'} (${review.reviewee_type || 'unknown'})`);
        console.log(`   Status: ${review.status}`);
        console.log(`   Title: ${review.title || 'No title'}`);
        console.log('');
      });
    }

    // Check RLS policies on reviews table
    console.log('\n=== RLS POLICIES ON REVIEWS TABLE ===');
    const rlsPolicies = await client.query(`
      SELECT policyname, cmd, roles, qual
      FROM pg_policies
      WHERE tablename = 'reviews'
      ORDER BY policyname
    `);

    if (rlsPolicies.rows.length === 0) {
      console.log('⚠️  No RLS policies found on reviews table\n');
    } else {
      console.log(`Found ${rlsPolicies.rows.length} RLS policies:\n`);
      rlsPolicies.rows.forEach((policy: any) => {
        console.log(`  ${policy.policyname} (${policy.cmd})`);
        console.log(`    Roles: ${policy.roles}`);
        console.log(`    Using: ${policy.qual || 'true'}`);
        console.log('');
      });
    }

    await client.end();
  } catch (err: any) {
    console.error('Error:', err.message);
    await client.end();
    process.exit(1);
  }
}

main();
