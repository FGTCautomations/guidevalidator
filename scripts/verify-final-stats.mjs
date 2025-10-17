#!/usr/bin/env node
import pg from 'pg';
const { Client } = pg;

const connectionString = "postgresql://postgres:Vertrouwen17%23@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres";

async function verifyStats() {
  const client = new Client({ connectionString });
  
  try {
    await client.connect();
    
    console.log('\n' + '='.repeat(80));
    console.log('FINAL VERIFICATION - CITY-REGION MAPPING STATUS');
    console.log('='.repeat(80) + '\n');
    
    // Overall statistics
    const overallStats = await client.query(`
      SELECT 
        COUNT(*) as total_cities,
        COUNT(region_id) as linked_cities,
        COUNT(*) - COUNT(region_id) as unlinked_cities,
        ROUND((COUNT(region_id)::numeric / COUNT(*)::numeric * 100), 1) as completion_percentage
      FROM cities
    `);
    
    const stats = overallStats.rows[0];
    
    console.log('OVERALL STATISTICS');
    console.log('-'.repeat(80));
    console.log(`Total Cities in Database:      ${stats.total_cities}`);
    console.log(`Cities Linked to Regions:      ${stats.linked_cities}`);
    console.log(`Cities Still Unlinked:         ${stats.unlinked_cities}`);
    console.log(`Completion Rate:               ${stats.completion_percentage}%`);
    console.log('-'.repeat(80) + '\n');
    
    // Statistics by country
    const countryStats = await client.query(`
      SELECT 
        c.code,
        c.name,
        COUNT(ci.id) as total_cities,
        COUNT(ci.region_id) as linked_cities,
        COUNT(ci.id) - COUNT(ci.region_id) as unlinked_cities
      FROM countries c
      LEFT JOIN cities ci ON c.code = ci.country_code
      WHERE ci.id IS NOT NULL
      GROUP BY c.code, c.name
      HAVING COUNT(ci.id) > 0
      ORDER BY COUNT(ci.id) DESC
    `);
    
    console.log('TOP 20 COUNTRIES BY NUMBER OF CITIES');
    console.log('-'.repeat(80));
    console.log('Rank | Code | Country              | Total | Linked | Unlinked');
    console.log('-'.repeat(80));
    
    countryStats.rows.slice(0, 20).forEach((row, index) => {
      const rank = (index + 1).toString().padStart(2);
      const code = row.code.padEnd(4);
      const name = row.name.padEnd(20);
      const total = row.total_cities.toString().padStart(5);
      const linked = row.linked_cities.toString().padStart(6);
      const unlinked = row.unlinked_cities.toString().padStart(8);
      console.log(`${rank}   | ${code} | ${name} | ${total} | ${linked} | ${unlinked}`);
    });
    console.log('-'.repeat(80) + '\n');
    
    // Countries with unlinked cities
    const unlinkedCountries = await client.query(`
      SELECT 
        c.code,
        c.name,
        COUNT(ci.id) as unlinked_count
      FROM countries c
      JOIN cities ci ON c.code = ci.country_code
      WHERE ci.region_id IS NULL
      GROUP BY c.code, c.name
      ORDER BY unlinked_count DESC
    `);
    
    if (unlinkedCountries.rows.length > 0) {
      console.log('COUNTRIES WITH UNLINKED CITIES');
      console.log('-'.repeat(80));
      console.log('Code | Country              | Unlinked Cities');
      console.log('-'.repeat(80));
      
      unlinkedCountries.rows.forEach(row => {
        const code = row.code.padEnd(4);
        const name = row.name.padEnd(20);
        const count = row.unlinked_count.toString().padStart(15);
        console.log(`${code} | ${name} | ${count}`);
      });
      console.log('-'.repeat(80) + '\n');
    }
    
    // Fully completed countries
    const completedCountries = await client.query(`
      SELECT 
        c.code,
        c.name,
        COUNT(ci.id) as city_count
      FROM countries c
      JOIN cities ci ON c.code = ci.country_code
      WHERE ci.region_id IS NOT NULL
      GROUP BY c.code, c.name
      HAVING COUNT(ci.id) = (
        SELECT COUNT(*) 
        FROM cities ci2 
        WHERE ci2.country_code = c.code
      )
      ORDER BY city_count DESC
      LIMIT 10
    `);
    
    if (completedCountries.rows.length > 0) {
      console.log('TOP 10 FULLY COMPLETED COUNTRIES (100% cities linked)');
      console.log('-'.repeat(80));
      console.log('Code | Country              | Cities');
      console.log('-'.repeat(80));
      
      completedCountries.rows.forEach(row => {
        const code = row.code.padEnd(4);
        const name = row.name.padEnd(20);
        const count = row.city_count.toString().padStart(6);
        console.log(`${code} | ${name} | ${count}`);
      });
      console.log('-'.repeat(80) + '\n');
    }
    
    console.log('='.repeat(80));
    console.log('VERIFICATION COMPLETE');
    console.log('='.repeat(80) + '\n');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

verifyStats().catch(console.error);
