// Import natural reserves and parks from Excel file
const XLSX = require('xlsx');
const fs = require('fs');

const excelPath = 'C:\\Users\\PC\\OneDrive - DLDV Enterprises\\Desktop\\guidevalditaor back up\\natural reserves and parks.xlsx';

console.log('📖 Reading Excel file...\n');

try {
  // Read the Excel file
  const workbook = XLSX.readFile(excelPath);

  // Get the first sheet
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  // Convert to JSON
  const data = XLSX.utils.sheet_to_json(sheet);

  console.log(`✅ Found ${data.length} parks/reserves in the Excel file\n`);
  console.log('📋 First 5 entries preview:\n');
  console.log(JSON.stringify(data.slice(0, 5), null, 2));

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Column names found:');
  if (data.length > 0) {
    console.log(Object.keys(data[0]).join(', '));
  }

  // Write the data to a JSON file for inspection
  fs.writeFileSync('parks-data.json', JSON.stringify(data, null, 2));
  console.log('\n✅ Data exported to parks-data.json for inspection');

  // Count by country
  const countryCount = {};
  data.forEach(park => {
    const country = park.Country || park.country || park.COUNTRY || park['Country Code'] || 'Unknown';
    countryCount[country] = (countryCount[country] || 0) + 1;
  });

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  console.log('📊 Parks by country:\n');
  Object.entries(countryCount)
    .sort((a, b) => b[1] - a[1])
    .forEach(([country, count]) => {
      console.log(`   ${country}: ${count}`);
    });

} catch (error) {
  console.error('❌ Error reading Excel file:', error.message);
  console.error('\nMake sure the file exists at:');
  console.error(excelPath);
}
