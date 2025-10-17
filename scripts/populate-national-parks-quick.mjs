#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

// Major national parks worldwide
const PARKS = [
  // United States
  { country: 'US', name: 'Yellowstone National Park', type: 'National Park', unesco: true },
  { country: 'US', name: 'Yosemite National Park', type: 'National Park', unesco: true },
  { country: 'US', name: 'Grand Canyon National Park', type: 'National Park', unesco: true },
  { country: 'US', name: 'Zion National Park', type: 'National Park', unesco: false },
  { country: 'US', name: 'Great Smoky Mountains National Park', type: 'National Park', unesco: true },
  { country: 'US', name: 'Rocky Mountain National Park', type: 'National Park', unesco: false },
  { country: 'US', name: 'Acadia National Park', type: 'National Park', unesco: false },
  { country: 'US', name: 'Everglades National Park', type: 'National Park', unesco: true },

  // Canada
  { country: 'CA', name: 'Banff National Park', type: 'National Park', unesco: true },
  { country: 'CA', name: 'Jasper National Park', type: 'National Park', unesco: true },
  { country: 'CA', name: 'Waterton Lakes National Park', type: 'National Park', unesco: true },

  // Australia
  { country: 'AU', name: 'Great Barrier Reef', type: 'Marine Park', unesco: true },
  { country: 'AU', name: 'Kakadu National Park', type: 'National Park', unesco: true },
  { country: 'AU', name: 'Uluru-Kata Tjuta National Park', type: 'National Park', unesco: true },
  { country: 'AU', name: 'Blue Mountains National Park', type: 'National Park', unesco: true },

  // New Zealand
  { country: 'NZ', name: 'Fiordland National Park', type: 'National Park', unesco: true },
  { country: 'NZ', name: 'Tongariro National Park', type: 'National Park', unesco: true },
  { country: 'NZ', name: 'Abel Tasman National Park', type: 'National Park', unesco: false },

  // Vietnam
  { country: 'VN', name: 'Ha Long Bay', type: 'Protected Area', unesco: true },
  { country: 'VN', name: 'Phong Nha-Ke Bang National Park', type: 'National Park', unesco: true },
  { country: 'VN', name: 'Cat Tien National Park', type: 'National Park', unesco: false },

  // Thailand
  { country: 'TH', name: 'Khao Sok National Park', type: 'National Park', unesco: false },
  { country: 'TH', name: 'Erawan National Park', type: 'National Park', unesco: false },
  { country: 'TH', name: 'Doi Inthanon National Park', type: 'National Park', unesco: false },

  // Indonesia
  { country: 'ID', name: 'Komodo National Park', type: 'National Park', unesco: true },
  { country: 'ID', name: 'Ujung Kulon National Park', type: 'National Park', unesco: true },
  { country: 'ID', name: 'Lorentz National Park', type: 'National Park', unesco: true },

  // Kenya
  { country: 'KE', name: 'Masai Mara National Reserve', type: 'Nature Reserve', unesco: false },
  { country: 'KE', name: 'Amboseli National Park', type: 'National Park', unesco: false },
  { country: 'KE', name: 'Tsavo National Park', type: 'National Park', unesco: false },

  // Tanzania
  { country: 'TZ', name: 'Serengeti National Park', type: 'National Park', unesco: true },
  { country: 'TZ', name: 'Kilimanjaro National Park', type: 'National Park', unesco: true },
  { country: 'TZ', name: 'Ngorongoro Conservation Area', type: 'Conservation Area', unesco: true },

  // South Africa
  { country: 'ZA', name: 'Kruger National Park', type: 'National Park', unesco: false },
  { country: 'ZA', name: 'Table Mountain National Park', type: 'National Park', unesco: false },
  { country: 'ZA', name: 'Addo Elephant National Park', type: 'National Park', unesco: false },

  // Costa Rica
  { country: 'CR', name: 'Manuel Antonio National Park', type: 'National Park', unesco: false },
  { country: 'CR', name: 'Tortuguero National Park', type: 'National Park', unesco: false },
  { country: 'CR', name: 'Corcovado National Park', type: 'National Park', unesco: false },

  // Brazil
  { country: 'BR', name: 'Iguazu National Park', type: 'National Park', unesco: true },
  { country: 'BR', name: 'Pantanal Matogrossense National Park', type: 'National Park', unesco: true },
  { country: 'BR', name: 'Chapada Diamantina National Park', type: 'National Park', unesco: false },

  // China
  { country: 'CN', name: 'Zhangjiajie National Forest Park', type: 'National Park', unesco: true },
  { country: 'CN', name: 'Jiuzhaigou Valley', type: 'Nature Reserve', unesco: true },
  { country: 'CN', name: 'Yellow Mountain (Huangshan)', type: 'Scenic Area', unesco: true },

  // Japan
  { country: 'JP', name: 'Fuji-Hakone-Izu National Park', type: 'National Park', unesco: false },
  { country: 'JP', name: 'Nikko National Park', type: 'National Park', unesco: true },
  { country: 'JP', name: 'Shiretoko National Park', type: 'National Park', unesco: true },

  // India
  { country: 'IN', name: 'Jim Corbett National Park', type: 'National Park', unesco: false },
  { country: 'IN', name: 'Ranthambore National Park', type: 'National Park', unesco: false },
  { country: 'IN', name: 'Kaziranga National Park', type: 'National Park', unesco: true },

  // Peru
  { country: 'PE', name: 'Machu Picchu', type: 'Historic Sanctuary', unesco: true },
  { country: 'PE', name: 'Manu National Park', type: 'National Park', unesco: true },

  // Argentina
  { country: 'AR', name: 'Los Glaciares National Park', type: 'National Park', unesco: true },
  { country: 'AR', name: 'Iguazu National Park', type: 'National Park', unesco: true },

  // Chile
  { country: 'CL', name: 'Torres del Paine National Park', type: 'National Park', unesco: false },

  // Iceland
  { country: 'IS', name: 'Vatnajökull National Park', type: 'National Park', unesco: true },
  { country: 'IS', name: 'Thingvellir National Park', type: 'National Park', unesco: true },

  // Norway
  { country: 'NO', name: 'Jotunheimen National Park', type: 'National Park', unesco: false },

  // Switzerland
  { country: 'CH', name: 'Swiss National Park', type: 'National Park', unesco: false },

  // Croatia
  { country: 'HR', name: 'Plitvice Lakes National Park', type: 'National Park', unesco: true },

  // Spain
  { country: 'ES', name: 'Teide National Park', type: 'National Park', unesco: true },
  { country: 'ES', name: 'Doñana National Park', type: 'National Park', unesco: true },
];

async function populateParks() {
  const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";
  const client = new Client({ connectionString });

  try {
    console.log(`🌳 Populating ${PARKS.length} national parks...\n`);
    await client.connect();

    let inserted = 0;
    let skipped = 0;

    for (const park of PARKS) {
      try {
        // Check if park exists
        const existing = await client.query(
          'SELECT id FROM public.national_parks WHERE name = $1 AND country_code = $2',
          [park.name, park.country]
        );

        if (existing.rows.length > 0) {
          skipped++;
          console.log(`   - Skipped: ${park.name} (${park.country})`);
          continue;
        }

        // Insert park
        await client.query(`
          INSERT INTO public.national_parks (
            country_code, name, type, unesco_site, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW())
        `, [park.country, park.name, park.type, park.unesco]);

        inserted++;
        console.log(`   ✓ ${park.name} (${park.country}) ${park.unesco ? '🌍 UNESCO' : ''}`);

      } catch (error) {
        skipped++;
        console.log(`   ✗ Error: ${park.name} - ${error.message}`);
      }
    }

    console.log(`\n✅ Complete!`);
    console.log(`   📊 Inserted: ${inserted}`);
    console.log(`   📊 Skipped: ${skipped}`);

    // Stats
    const total = await client.query('SELECT COUNT(*) FROM public.national_parks');
    const unesco = await client.query('SELECT COUNT(*) FROM public.national_parks WHERE unesco_site = true');

    console.log(`\n📊 Database totals:`);
    console.log(`   Total parks: ${total.rows[0].count}`);
    console.log(`   UNESCO sites: ${unesco.rows[0].count}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

populateParks();
