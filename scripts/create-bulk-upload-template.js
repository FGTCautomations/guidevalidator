/**
 * Script to create an Excel template for bulk uploading profiles
 * Run with: node scripts/create-bulk-upload-template.js
 */

const ExcelJS = require('exceljs');
const path = require('path');

async function createBulkUploadTemplate() {
  const workbook = new ExcelJS.Workbook();

  // Common header style
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
    alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    }
  };

  // ========== GUIDES WORKSHEET ==========
  const guidesSheet = workbook.addWorksheet('Guides');

  guidesSheet.columns = [
    { header: 'Email*', key: 'email', width: 30 },
    { header: 'Password*', key: 'password', width: 20 },
    { header: 'Full Name*', key: 'full_name', width: 25 },
    { header: 'Country Code* (e.g., US, FR, DE)', key: 'country_code', width: 30 },
    { header: 'Contact Email*', key: 'contact_email', width: 30 },
    { header: 'Contact Phone', key: 'contact_phone', width: 20 },
    { header: 'Timezone* (e.g., America/New_York)', key: 'timezone', width: 35 },
    { header: 'Headline', key: 'headline', width: 40 },
    { header: 'Bio', key: 'bio', width: 50 },
    { header: 'Years Experience', key: 'years_experience', width: 20 },
    { header: 'Specialties (comma-separated)', key: 'specialties', width: 40 },
    { header: 'Languages (comma-separated)', key: 'languages', width: 40 },
    { header: 'License Number', key: 'license_number', width: 25 },
    { header: 'License Authority', key: 'license_authority', width: 30 },
    { header: 'Hourly Rate (cents)', key: 'hourly_rate_cents', width: 20 },
    { header: 'Currency (USD, EUR, etc.)', key: 'currency', width: 25 },
    { header: 'Gender', key: 'gender', width: 15 },
    { header: 'Has Liability Insurance (TRUE/FALSE)', key: 'has_liability_insurance', width: 35 },
    { header: 'Response Time (minutes)', key: 'response_time_minutes', width: 25 },
  ];

  // Style header row
  guidesSheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });
  guidesSheet.getRow(1).height = 40;

  // Add example row
  guidesSheet.addRow({
    email: 'john.guide@example.com',
    password: 'SecurePass123!',
    full_name: 'John Smith',
    country_code: 'US',
    contact_email: 'john.contact@example.com',
    contact_phone: '+1-555-123-4567',
    timezone: 'America/New_York',
    headline: 'Expert Cultural Guide in New York',
    bio: 'Experienced tour guide specializing in cultural and historical tours...',
    years_experience: 10,
    specialties: 'cultural, historical, museum',
    languages: 'en, es, fr',
    license_number: 'NYC-12345',
    license_authority: 'NYC Tourism Board',
    hourly_rate_cents: 5000,
    currency: 'USD',
    gender: 'male',
    has_liability_insurance: 'TRUE',
    response_time_minutes: 60,
  });

  // ========== AGENCIES WORKSHEET ==========
  const agenciesSheet = workbook.addWorksheet('Agencies');

  agenciesSheet.columns = [
    { header: 'Email*', key: 'email', width: 30 },
    { header: 'Password*', key: 'password', width: 20 },
    { header: 'Company Name*', key: 'name', width: 30 },
    { header: 'Country Code* (e.g., US, FR, DE)', key: 'country_code', width: 30 },
    { header: 'Contact Email*', key: 'contact_email', width: 30 },
    { header: 'Contact Phone', key: 'contact_phone', width: 20 },
    { header: 'Timezone* (e.g., America/New_York)', key: 'timezone', width: 35 },
    { header: 'Website URL', key: 'website_url', width: 40 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Registration Number', key: 'registration_number', width: 25 },
    { header: 'Registration Country', key: 'registration_country', width: 25 },
    { header: 'Business Address', key: 'business_address', width: 40 },
    { header: 'Services Offered (comma-separated)', key: 'services_offered', width: 40 },
    { header: 'Languages Supported (comma-separated)', key: 'languages_supported', width: 40 },
    { header: 'Certifications (comma-separated)', key: 'certifications', width: 40 },
    { header: 'Tax ID', key: 'tax_id', width: 25 },
  ];

  // Style header row
  agenciesSheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });
  agenciesSheet.getRow(1).height = 40;

  // Add example row
  agenciesSheet.addRow({
    email: 'contact@travelagency.com',
    password: 'SecurePass123!',
    name: 'Premium Travel Agency',
    country_code: 'US',
    contact_email: 'info@travelagency.com',
    contact_phone: '+1-555-987-6543',
    timezone: 'America/New_York',
    website_url: 'https://www.travelagency.com',
    description: 'Full-service travel agency specializing in luxury travel experiences...',
    registration_number: 'REG-12345',
    registration_country: 'US',
    business_address: '123 Main Street, New York, NY 10001',
    services_offered: 'tour-planning, accommodation-booking, flight-booking',
    languages_supported: 'en, es, fr, de',
    certifications: 'IATA, ASTA',
    tax_id: 'TAX-98765',
  });

  // ========== DMCs WORKSHEET ==========
  const dmcsSheet = workbook.addWorksheet('DMCs');

  dmcsSheet.columns = [
    { header: 'Email*', key: 'email', width: 30 },
    { header: 'Password*', key: 'password', width: 20 },
    { header: 'Company Name*', key: 'name', width: 30 },
    { header: 'Country Code* (e.g., US, FR, DE)', key: 'country_code', width: 30 },
    { header: 'Contact Email*', key: 'contact_email', width: 30 },
    { header: 'Contact Phone', key: 'contact_phone', width: 20 },
    { header: 'Timezone* (e.g., America/New_York)', key: 'timezone', width: 35 },
    { header: 'Website URL', key: 'website_url', width: 40 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Registration Number', key: 'registration_number', width: 25 },
    { header: 'Registration Country', key: 'registration_country', width: 25 },
    { header: 'Business Address', key: 'business_address', width: 40 },
    { header: 'Services Offered (comma-separated)', key: 'services_offered', width: 40 },
    { header: 'Languages Supported (comma-separated)', key: 'languages_supported', width: 40 },
    { header: 'Certifications (comma-separated)', key: 'certifications', width: 40 },
    { header: 'Coverage Summary', key: 'coverage_summary', width: 40 },
  ];

  // Style header row
  dmcsSheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });
  dmcsSheet.getRow(1).height = 40;

  // Add example row
  dmcsSheet.addRow({
    email: 'contact@dmccompany.com',
    password: 'SecurePass123!',
    name: 'Elite Destination Management',
    country_code: 'FR',
    contact_email: 'info@dmccompany.com',
    contact_phone: '+33-1-23-45-67-89',
    timezone: 'Europe/Paris',
    website_url: 'https://www.dmccompany.com',
    description: 'Destination management company specializing in France and Western Europe...',
    registration_number: 'DMC-FR-12345',
    registration_country: 'FR',
    business_address: '45 Avenue des Champs-Élysées, 75008 Paris',
    services_offered: 'ground-transportation, venue-booking, event-planning, local-guides',
    languages_supported: 'en, fr, de, es, it',
    certifications: 'SITE, ADMEI',
    coverage_summary: 'France, Belgium, Switzerland, Luxembourg',
  });

  // ========== TRANSPORT WORKSHEET ==========
  const transportSheet = workbook.addWorksheet('Transport');

  transportSheet.columns = [
    { header: 'Email*', key: 'email', width: 30 },
    { header: 'Password*', key: 'password', width: 20 },
    { header: 'Company Name*', key: 'name', width: 30 },
    { header: 'Country Code* (e.g., US, FR, DE)', key: 'country_code', width: 30 },
    { header: 'Contact Email*', key: 'contact_email', width: 30 },
    { header: 'Contact Phone', key: 'contact_phone', width: 20 },
    { header: 'Timezone* (e.g., America/New_York)', key: 'timezone', width: 35 },
    { header: 'Website URL', key: 'website_url', width: 40 },
    { header: 'Description', key: 'description', width: 50 },
    { header: 'Registration Number', key: 'registration_number', width: 25 },
    { header: 'Business Address', key: 'business_address', width: 40 },
    { header: 'Services Offered (comma-separated)', key: 'services_offered', width: 40 },
    { header: 'Languages Supported (comma-separated)', key: 'languages_supported', width: 40 },
    { header: 'Fleet Types (comma-separated)', key: 'fleet_types', width: 40 },
    { header: 'Fleet Size', key: 'fleet_size', width: 15 },
    { header: 'Certifications (comma-separated)', key: 'certifications', width: 40 },
  ];

  // Style header row
  transportSheet.getRow(1).eachCell((cell) => {
    cell.style = headerStyle;
  });
  transportSheet.getRow(1).height = 40;

  // Add example row
  transportSheet.addRow({
    email: 'contact@transportco.com',
    password: 'SecurePass123!',
    name: 'Premium Transport Services',
    country_code: 'DE',
    contact_email: 'info@transportco.com',
    contact_phone: '+49-30-12345678',
    timezone: 'Europe/Berlin',
    website_url: 'https://www.transportco.com',
    description: 'Professional transportation services for tours and events...',
    registration_number: 'TRANS-DE-12345',
    business_address: 'Unter den Linden 1, 10117 Berlin',
    services_offered: 'airport-transfer, city-tours, long-distance, vip-transport',
    languages_supported: 'de, en, fr',
    fleet_types: 'sedan, van, minibus, coach',
    fleet_size: 25,
    certifications: 'ISO9001, DOT',
  });

  // ========== INSTRUCTIONS WORKSHEET ==========
  const instructionsSheet = workbook.addWorksheet('Instructions');
  instructionsSheet.getColumn(1).width = 100;

  const instructions = [
    { text: 'BULK UPLOAD TEMPLATE - INSTRUCTIONS', style: { font: { size: 16, bold: true, color: { argb: 'FF4472C4' } } } },
    { text: '' },
    { text: 'HOW TO USE THIS TEMPLATE:', style: { font: { bold: true, size: 12 } } },
    { text: '1. Fill in the data for each category in the respective worksheet (Guides, Agencies, DMCs, Transport)' },
    { text: '2. Fields marked with * are required' },
    { text: '3. Do not modify the header row (first row)' },
    { text: '4. Keep the example row or delete it before uploading' },
    { text: '5. Save the file and upload it through the admin panel' },
    { text: '' },
    { text: 'IMPORTANT NOTES:', style: { font: { bold: true, size: 12 } } },
    { text: '• Email addresses must be unique across the entire system' },
    { text: '• Passwords must be at least 8 characters long' },
    { text: '• Country codes must be valid ISO 3166-1 alpha-2 codes (e.g., US, FR, GB, DE)' },
    { text: '• Timezones must be valid IANA timezone identifiers (e.g., America/New_York, Europe/Paris)' },
    { text: '• For comma-separated fields (specialties, languages, etc.), use lowercase with hyphens (e.g., cultural, historical, museum)' },
    { text: '• Boolean fields use TRUE or FALSE (case-insensitive)' },
    { text: '• All profiles will be created with "approved" status and ready to appear in the directory' },
    { text: '' },
    { text: 'COMMON SPECIALTIES:', style: { font: { bold: true, size: 12 } } },
    { text: 'Guides: cultural, historical, adventure, culinary, wildlife, museum, luxury, family-friendly, eco-tourism' },
    { text: 'Agencies/DMCs: group-tours, private-tours, corporate-travel, event-planning, mice, luxury-travel' },
    { text: 'Transport: airport-transfer, city-tours, long-distance, vip-transport, group-transport' },
    { text: '' },
    { text: 'COMMON LANGUAGES (use ISO 639-1 codes):', style: { font: { bold: true, size: 12 } } },
    { text: 'en (English), es (Spanish), fr (French), de (German), it (Italian), pt (Portuguese), ja (Japanese), zh (Chinese), ar (Arabic)' },
    { text: '' },
    { text: 'SUPPORT:', style: { font: { bold: true, size: 12 } } },
    { text: 'If you encounter any issues during the upload process, contact the system administrator.' },
  ];

  instructions.forEach((instruction, index) => {
    const row = instructionsSheet.getRow(index + 1);
    row.getCell(1).value = instruction.text;
    if (instruction.style) {
      row.getCell(1).style = instruction.style;
    }
    row.getCell(1).alignment = { wrapText: true, vertical: 'top' };
  });

  // Save the workbook
  const outputPath = path.join(__dirname, '..', 'Guide_Validator_Bulk_Upload_Template.xlsx');
  await workbook.xlsx.writeFile(outputPath);

  console.log(`✅ Excel template created successfully: ${outputPath}`);
  console.log('📝 The template includes:');
  console.log('   - Guides worksheet');
  console.log('   - Agencies worksheet');
  console.log('   - DMCs worksheet');
  console.log('   - Transport worksheet');
  console.log('   - Instructions worksheet');
}

// Run the script
createBulkUploadTemplate().catch(console.error);
