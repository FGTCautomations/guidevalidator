#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function linkParksToRegions() {
  const client = new Client({ connectionString });

  try {
    console.log('🔗 Linking national parks to regions...\n');
    await client.connect();

    // Strategy: For parks with coordinates, find the nearest region in the same country
    // For parks without coordinates, we'll need manual mapping for major ones

    // First, let's see how many parks have coordinates
    const withCoords = await client.query(`
      SELECT COUNT(*) FROM public.national_parks
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
    `);

    const withoutCoords = await client.query(`
      SELECT COUNT(*) FROM public.national_parks
      WHERE latitude IS NULL OR longitude IS NULL;
    `);

    console.log(`📊 Parks with coordinates: ${withCoords.rows[0].count}`);
    console.log(`📊 Parks without coordinates: ${withoutCoords.rows[0].count}\n`);

    // For now, let's create manual mappings for major parks in key countries
    // These are well-known parks that guides would actually operate in

    const PARK_REGION_MAPPINGS = {
      // United States
      'Yellowstone National Park': { country: 'US', region: 'Wyoming' },
      'Yosemite National Park': { country: 'US', region: 'California' },
      'Grand Canyon National Park': { country: 'US', region: 'Arizona' },
      'Zion National Park': { country: 'US', region: 'Utah' },
      'Rocky Mountain National Park': { country: 'US', region: 'Colorado' },
      'Great Smoky Mountains National Park': { country: 'US', region: 'Tennessee' },
      'Acadia National Park': { country: 'US', region: 'Maine' },
      'Everglades National Park': { country: 'US', region: 'Florida' },
      'Olympic National Park': { country: 'US', region: 'Washington' },
      'Glacier National Park': { country: 'US', region: 'Montana' },

      // Canada
      'Banff National Park': { country: 'CA', region: 'Alberta' },
      'Jasper National Park': { country: 'CA', region: 'Alberta' },
      'Waterton Lakes National Park': { country: 'CA', region: 'Alberta' },
      'Yoho National Park': { country: 'CA', region: 'British Columbia' },
      'Kootenay National Park': { country: 'CA', region: 'British Columbia' },

      // Australia
      'Kakadu National Park': { country: 'AU', region: 'Northern Territory' },
      'Uluru-Kata Tjuta National Park': { country: 'AU', region: 'Northern Territory' },
      'Blue Mountains National Park': { country: 'AU', region: 'New South Wales' },
      'Daintree National Park': { country: 'AU', region: 'Queensland' },
      'Great Barrier Reef Marine Park': { country: 'AU', region: 'Queensland' },

      // New Zealand
      'Fiordland National Park': { country: 'NZ', region: 'Southland' },
      'Tongariro National Park': { country: 'NZ', region: 'Manawatu-Wanganui' },
      'Aoraki / Mount Cook National Park': { country: 'NZ', region: 'Canterbury' },
      'Abel Tasman National Park': { country: 'NZ', region: 'Tasman' },

      // South Africa
      'Kruger National Park': { country: 'ZA', region: 'Limpopo' },
      'Table Mountain National Park': { country: 'ZA', region: 'Western Cape' },
      'Addo Elephant National Park': { country: 'ZA', region: 'Eastern Cape' },
      'iSimangaliso Wetland Park': { country: 'ZA', region: 'KwaZulu-Natal' },

      // Kenya
      'Masai Mara National Reserve': { country: 'KE', region: 'Narok' },
      'Amboseli National Park': { country: 'KE', region: 'Kajiado' },
      'Tsavo National Park': { country: 'KE', region: 'Taita-Taveta' },

      // Tanzania
      'Serengeti National Park': { country: 'TZ', region: 'Mara' },
      'Kilimanjaro National Park': { country: 'TZ', region: 'Kilimanjaro' },
      'Ngorongoro Conservation Area': { country: 'TZ', region: 'Arusha' },

      // Costa Rica
      'Manuel Antonio National Park': { country: 'CR', region: 'Puntarenas' },
      'Tortuguero National Park': { country: 'CR', region: 'Limón' },
      'Corcovado National Park': { country: 'CR', region: 'Puntarenas' },

      // Brazil
      'Iguaçu National Park': { country: 'BR', region: 'Paraná' },
      'Tijuca National Park': { country: 'BR', region: 'Rio de Janeiro' },
      'Chapada Diamantina National Park': { country: 'BR', region: 'Bahia' },

      // Peru
      'Machu Picchu': { country: 'PE', region: 'Cusco' },
      'Manu National Park': { country: 'PE', region: 'Madre de Dios' },

      // Argentina
      'Los Glaciares National Park': { country: 'AR', region: 'Santa Cruz' },
      'Iguazú National Park': { country: 'AR', region: 'Misiones' },

      // Chile
      'Torres del Paine National Park': { country: 'CL', region: 'Magallanes' },

      // China
      'Zhangjiajie National Forest Park': { country: 'CN', region: 'Hunan' },
      'Jiuzhaigou Valley': { country: 'CN', region: 'Sichuan' },
      'Huangshan (Yellow Mountain)': { country: 'CN', region: 'Anhui' },

      // Japan
      'Fuji-Hakone-Izu National Park': { country: 'JP', region: 'Shizuoka' },
      'Nikko National Park': { country: 'JP', region: 'Tochigi' },
      'Shiretoko National Park': { country: 'JP', region: 'Hokkaido' },

      // India
      'Jim Corbett National Park': { country: 'IN', region: 'Uttarakhand' },
      'Ranthambore National Park': { country: 'IN', region: 'Rajasthan' },
      'Kaziranga National Park': { country: 'IN', region: 'Assam' },

      // Thailand
      'Khao Sok National Park': { country: 'TH', region: 'Surat Thani' },
      'Erawan National Park': { country: 'TH', region: 'Kanchanaburi' },
      'Doi Inthanon National Park': { country: 'TH', region: 'Chiang Mai' },

      // Vietnam
      'Phong Nha-Ke Bang National Park': { country: 'VN', region: 'Quảng Bình' },
      'Cat Tien National Park': { country: 'VN', region: 'Đồng Nai' },
      'Cuc Phuong National Park': { country: 'VN', region: 'Ninh Bình' },

      // Indonesia
      'Komodo National Park': { country: 'ID', region: 'East Nusa Tenggara' },
      'Ujung Kulon National Park': { country: 'ID', region: 'Banten' },
      'Gunung Leuser National Park': { country: 'ID', region: 'Aceh' },
    };

    let linked = 0;
    let notFound = 0;

    console.log(`🔗 Linking ${Object.keys(PARK_REGION_MAPPINGS).length} major parks to regions...\n`);

    for (const [parkName, mapping] of Object.entries(PARK_REGION_MAPPINGS)) {
      try {
        // Find the region
        const regionResult = await client.query(`
          SELECT id FROM public.regions
          WHERE country_code = $1
          AND name ILIKE $2
          LIMIT 1;
        `, [mapping.country, mapping.region]);

        if (regionResult.rows.length === 0) {
          notFound++;
          console.log(`   ⚠️  Region not found: ${mapping.region}, ${mapping.country} for ${parkName}`);
          continue;
        }

        const regionId = regionResult.rows[0].id;

        // Update the park
        const updateResult = await client.query(`
          UPDATE public.national_parks
          SET region_id = $1, updated_at = NOW()
          WHERE name ILIKE $2 AND country_code = $3
          AND region_id IS NULL;
        `, [regionId, parkName, mapping.country]);

        if (updateResult.rowCount > 0) {
          linked++;
          console.log(`   ✓ Linked: ${parkName} → ${mapping.region}, ${mapping.country}`);
        }

      } catch (error) {
        console.error(`   ✗ Error linking ${parkName}: ${error.message}`);
      }
    }

    console.log('\n✅ Linking complete!\n');
    console.log(`📊 Results:`);
    console.log(`   ✓ Linked: ${linked}`);
    console.log(`   ⚠️  Not found: ${notFound}`);

    // Final stats
    const withRegions = await client.query('SELECT COUNT(*) FROM public.national_parks WHERE region_id IS NOT NULL');
    const totalParks = await client.query('SELECT COUNT(*) FROM public.national_parks');

    console.log(`\n📊 Database totals:`);
    console.log(`   Total parks: ${totalParks.rows[0].count}`);
    console.log(`   With regions: ${withRegions.rows[0].count}`);
    console.log(`   Coverage: ${((withRegions.rows[0].count / totalParks.rows[0].count) * 100).toFixed(1)}%`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

linkParksToRegions();
