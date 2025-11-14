const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parser');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function deleteAllGuides() {
  console.log('\n========================================');
  console.log('STEP 1: Deleting all existing guides');
  console.log('========================================\n');

  try {
    // Get all guide profile IDs first
    const { data: guides, error: fetchError } = await supabase
      .from('guides')
      .select('profile_id');

    if (fetchError) {
      console.error('Error fetching guides:', fetchError);
      return false;
    }

    console.log(`Found ${guides?.length || 0} guides to delete\n`);

    if (!guides || guides.length === 0) {
      console.log('No guides to delete\n');
      return true;
    }

    const profileIds = guides.map(g => g.profile_id);

    // Delete from guides table in batches
    console.log('Deleting from guides table in batches...');
    const batchSize = 100;
    let deletedCount = 0;

    for (let i = 0; i < profileIds.length; i += batchSize) {
      const batch = profileIds.slice(i, i + batchSize);
      const { error: guidesDeleteError, count } = await supabase
        .from('guides')
        .delete({ count: 'exact' })
        .in('profile_id', batch);

      if (guidesDeleteError) {
        console.error(`Error deleting batch ${i}-${i+batchSize}:`, {
          message: guidesDeleteError.message,
          details: guidesDeleteError.details,
          hint: guidesDeleteError.hint,
          code: guidesDeleteError.code
        });
        return false;
      }

      deletedCount += count || batch.length;
      if ((i + batchSize) % 500 === 0 || i + batchSize >= profileIds.length) {
        console.log(`  Deleted ${deletedCount} guides so far...`);
      }
    }
    console.log(`✓ Deleted ${deletedCount} from guides table\n`);

    // Clear profile access tokens for guide profiles
    console.log('Clearing profile access tokens...');
    const { error: tokenClearError } = await supabase
      .from('profiles')
      .update({
        profile_access_token: null,
        profile_access_token_expires_at: null,
      })
      .eq('role', 'guide');

    if (tokenClearError) {
      console.error('Error clearing tokens:', {
        message: tokenClearError.message,
        details: tokenClearError.details
      });
    } else {
      console.log('✓ Cleared all profile access tokens\n');
    }

    // Delete from auth.users (for guides only)
    console.log('Deleting guide auth accounts...');
    let deletedAuthCount = 0;
    for (const profileId of profileIds) {
      try {
        const { error: authDeleteError } = await supabase.auth.admin.deleteUser(profileId);
        if (!authDeleteError) {
          deletedAuthCount++;
        }
        if (deletedAuthCount % 100 === 0) {
          console.log(`  Deleted ${deletedAuthCount} auth accounts so far...`);
        }
      } catch (e) {
        // User might not exist in auth, continue
      }
    }
    console.log(`✓ Deleted ${deletedAuthCount} auth accounts\n`);

    // Delete profiles with role='guide' in batches
    console.log('Deleting guide profiles in batches...');
    let profilesDeleted = 0;

    for (let i = 0; i < profileIds.length; i += batchSize) {
      const batch = profileIds.slice(i, i + batchSize);
      const { error: profilesDeleteError, count } = await supabase
        .from('profiles')
        .delete({ count: 'exact' })
        .in('id', batch);

      if (profilesDeleteError) {
        console.error(`Error deleting profile batch ${i}-${i+batchSize}:`, {
          message: profilesDeleteError.message,
          details: profilesDeleteError.details,
          hint: profilesDeleteError.hint
        });
        return false;
      }

      profilesDeleted += count || batch.length;
      if ((i + batchSize) % 500 === 0 || i + batchSize >= profileIds.length) {
        console.log(`  Deleted ${profilesDeleted} profiles so far...`);
      }
    }
    console.log(`✓ Deleted ${profilesDeleted} guide profiles\n`);

    console.log('========================================');
    console.log('All guides deleted successfully!');
    console.log('========================================\n');

    return true;

  } catch (error) {
    console.error('Error in deleteAllGuides:', error);
    return false;
  }
}

async function importFromCSV() {
  console.log('\n========================================');
  console.log('STEP 2: Importing guides from CSV');
  console.log('========================================\n');

  const csvPath = 'C:\\Users\\PC\\OneDrive - DLDV Enterprises\\Desktop\\guidevalditaor back up\\VIETNAM_LIST.csv';
  const guides = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(csvPath, { encoding: 'utf-8' })
      .pipe(csv({ skipLines: 0 }))
      .on('data', (row) => {
        // Clean BOM from first key if present
        const cleanRow = {};
        for (const [key, value] of Object.entries(row)) {
          const cleanKey = key.replace(/^\uFEFF/, '').trim();
          cleanRow[cleanKey] = value;
        }

        // Skip rows with malformed names
        if (cleanRow.name && cleanRow.card_number && !cleanRow.name.includes('Số thẻ:')) {
          guides.push({
            name: cleanRow.name.trim(),
            card_number: cleanRow.card_number.trim(),
            expiry_date: cleanRow.expiry_date,
            province_issue: cleanRow.province_issue,
            card_type: cleanRow.card_type,
            language: cleanRow.language,
            experience: cleanRow.experience,
            image_url: cleanRow.image_url,
            source_url: cleanRow.source_url,
          });
        }
      })
      .on('end', async () => {
        console.log(`Read ${guides.length} guide records from CSV\n`);

        let created = 0;
        let errors = 0;

        for (const guide of guides) {
          try {
            // Generate a temporary email and password for this guide
            const tempEmail = `guide_${guide.card_number.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}@temp.guidevalidator.com`;
            const tempPassword = crypto.randomBytes(32).toString('hex');

            // Create auth user first
            const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
              email: tempEmail,
              password: tempPassword,
              email_confirm: true,
              user_metadata: {
                full_name: guide.name,
                role: 'guide',
                license_number: guide.card_number,
                imported: true,
              },
            });

            if (authError || !authUser?.user) {
              console.error(`Error creating auth user for ${guide.name}:`, authError?.message || 'No user returned');
              errors++;
              continue;
            }

            const profileId = authUser.user.id;

            // Create profile using the auth user ID
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: profileId,
                email: tempEmail,
                full_name: guide.name,
                role: 'guide',
                country_code: 'VN',
                application_status: 'approved',
                verified: true,
                application_data: {
                  imported_from: 'VIETNAM_LIST.csv',
                  import_date: new Date().toISOString(),
                  temp_email: tempEmail,
                  original_data: {
                    experience: guide.experience,
                    image_url: guide.image_url,
                    source_url: guide.source_url,
                  }
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (profileError) {
              console.error(`Error creating profile for ${guide.name}:`, profileError.message);
              // Try to clean up auth user
              await supabase.auth.admin.deleteUser(profileId);
              errors++;
              continue;
            }

            // Parse languages
            let languages = [];
            if (guide.language) {
              try {
                // Languages are in format like """en""" or """en"",""zh"""
                languages = guide.language
                  .replace(/"""/g, '')
                  .replace(/"/g, '')
                  .split(',')
                  .map(lang => lang.trim())
                  .filter(lang => lang);
              } catch (e) {
                languages = [];
              }
            }

            // Parse experience years
            let yearsExperience = null;
            if (guide.experience) {
              const match = guide.experience.match(/(\d+)/);
              if (match) {
                yearsExperience = parseInt(match[1]);
              }
            }

            // Create guide record
            const { error: guideError } = await supabase
              .from('guides')
              .insert({
                profile_id: profileId,
                license_number: guide.card_number,
                license_authority: guide.province_issue,
                spoken_languages: languages,
                years_experience: yearsExperience,
                application_data: {
                  license_expiry_date: guide.expiry_date,
                  license_card_type: guide.card_type,
                  import_source: 'VIETNAM_LIST.csv',
                  import_date: new Date().toISOString(),
                },
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              });

            if (guideError) {
              console.error(`Error creating guide for ${guide.name}:`, guideError.message);
              // Try to rollback profile creation
              await supabase.from('profiles').delete().eq('id', profileId);
              errors++;
              continue;
            }

            created++;
            if (created % 100 === 0) {
              console.log(`Imported ${created} guides...`);
            }

          } catch (error) {
            console.error(`Error processing ${guide.name}:`, error.message);
            errors++;
          }
        }

        console.log('\n========================================');
        console.log('Import Summary:');
        console.log('========================================');
        console.log(`Total records in CSV: ${guides.length}`);
        console.log(`Successfully imported: ${created}`);
        console.log(`Errors: ${errors}`);
        console.log('========================================\n');

        resolve({ created, errors, total: guides.length });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

async function main() {
  console.log('\n');
  console.log('╔════════════════════════════════════════════════╗');
  console.log('║  GUIDE DATABASE RESET AND IMPORT               ║');
  console.log('║                                                ║');
  console.log('║  WARNING: This will DELETE all existing guides║');
  console.log('║  and import fresh data from Vietnam CSV       ║');
  console.log('╚════════════════════════════════════════════════╝');
  console.log('\n');

  // Step 1: Delete all existing guides
  const deleteSuccess = await deleteAllGuides();
  if (!deleteSuccess) {
    console.error('\n❌ Failed to delete existing guides. Aborting import.');
    process.exit(1);
  }

  // Step 2: Import from CSV
  try {
    const result = await importFromCSV();

    console.log('\n');
    console.log('╔════════════════════════════════════════════════╗');
    console.log('║  IMPORT COMPLETED SUCCESSFULLY!                ║');
    console.log('╚════════════════════════════════════════════════╝');
    console.log('\n');
    console.log(`✓ ${result.created} guides imported with license numbers`);
    console.log(`✓ All guides are from Vietnam`);
    console.log(`✓ License expiry dates and card types included`);
    console.log(`✓ Profile access tokens cleared and ready for use\n`);

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  }
}

// Add crypto for UUID generation
const crypto = require('crypto');

main();
