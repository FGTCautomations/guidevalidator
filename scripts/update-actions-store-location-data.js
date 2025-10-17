const fs = require('fs');
const path = require('path');

function updateGuideAction() {
  const filePath = path.join(__dirname, '..', 'app', '[locale]', 'auth', 'sign-up', 'guide', 'actions.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add locationData parsing after languagesRaw
  const locationDataParse = `  const languagesRaw = String(formData.get("languages") ?? "[]");
  const locationDataRaw = String(formData.get("locationData") ?? "{}");`;

  content = content.replace(
    `  const languagesRaw = String(formData.get("languages") ?? "[]");`,
    locationDataParse
  );

  // Add locationData variable after customLanguages
  const locationDataVar = `  let customLanguages: string[] = [];
  let locationData = null;`;

  content = content.replace(
    `  let customLanguages: string[] = [];`,
    locationDataVar
  );

  // Add locationData parsing after languages parsing
  const locationDataTry = `  try {
    customLanguages = languagesRaw ? JSON.parse(languagesRaw) : [];
  } catch {
    return { status: "error", message: "Invalid languages format." };
  }

  try {
    locationData = locationDataRaw ? JSON.parse(locationDataRaw) : null;
  } catch {
    return { status: "error", message: "Invalid location data format." };
  }`;

  content = content.replace(
    `  try {
    customLanguages = languagesRaw ? JSON.parse(languagesRaw) : [];
  } catch {
    return { status: "error", message: "Invalid languages format." };
  }`,
    locationDataTry
  );

  // Add location_data to the database insert
  content = content.replace(
    `    working_hours: workingHours,
  }).select("id").single();`,
    `    working_hours: workingHours,
    location_data: locationData,
  }).select("id").single();`
  );

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Guide action updated with location data storage');
}

function updateAgencyAction() {
  const filePath = path.join(__dirname, '..', 'app', '[locale]', 'auth', 'sign-up', 'agency', 'actions.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add locationData parsing
  if (!content.includes('locationDataRaw')) {
    content = content.replace(
      /const languagesRaw = String\(formData\.get\("languages"\) \?\? "\[\]"\);/,
      `const languagesRaw = String(formData.get("languages") ?? "[]");
  const locationDataRaw = String(formData.get("locationData") ?? "{}");`
    );
  }

  // Add locationData variable
  if (!content.includes('let locationData')) {
    content = content.replace(
      /let customLanguages: string\[\] = \[\];/,
      `let customLanguages: string[] = [];
  let locationData = null;`
    );
  }

  // Add locationData parsing
  if (!content.includes('locationData = locationDataRaw')) {
    content = content.replace(
      /(try \{[\s\S]*?customLanguages = languagesRaw.*?\n.*?\}[\s\S]*?catch[\s\S]*?\n.*?\})/,
      `$1

  try {
    locationData = locationDataRaw ? JSON.parse(locationDataRaw) : null;
  } catch {
    return { status: "error", message: "Invalid location data format." };
  }`
    );
  }

  // Add to database insert (agency_applications table)
  if (!content.includes('location_data: locationData')) {
    content = content.replace(
      /(working_hours: workingHours,[\s\S]*?\.select\("id"\)\.single\(\);)/,
      function(match) {
        return match.replace(
          'working_hours: workingHours,',
          `working_hours: workingHours,
    location_data: locationData,`
        );
      }
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Agency action updated with location data storage');
}

function updateDmcAction() {
  const filePath = path.join(__dirname, '..', 'app', '[locale]', 'auth', 'sign-up', 'dmc', 'actions.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add locationData parsing
  if (!content.includes('locationDataRaw')) {
    content = content.replace(
      /const languagesRaw = String\(formData\.get\("languages"\) \?\? "\[\]"\);/,
      `const languagesRaw = String(formData.get("languages") ?? "[]");
  const locationDataRaw = String(formData.get("locationData") ?? "{}");`
    );
  }

  // Add locationData variable
  if (!content.includes('let locationData')) {
    content = content.replace(
      /let customLanguages: string\[\] = \[\];/,
      `let customLanguages: string[] = [];
  let locationData = null;`
    );
  }

  // Add locationData parsing
  if (!content.includes('locationData = locationDataRaw')) {
    content = content.replace(
      /(try \{[\s\S]*?customLanguages = languagesRaw.*?\n.*?\}[\s\S]*?catch[\s\S]*?\n.*?\})/,
      `$1

  try {
    locationData = locationDataRaw ? JSON.parse(locationDataRaw) : null;
  } catch {
    return { status: "error", message: "Invalid location data format." };
  }`
    );
  }

  // Add to database insert
  if (!content.includes('location_data: locationData')) {
    content = content.replace(
      /(working_hours: workingHours,[\s\S]*?\.select\("id"\)\.single\(\);)/,
      function(match) {
        return match.replace(
          'working_hours: workingHours,',
          `working_hours: workingHours,
    location_data: locationData,`
        );
      }
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ DMC action updated with location data storage');
}

function updateTransportAction() {
  const filePath = path.join(__dirname, '..', 'app', '[locale]', 'auth', 'sign-up', 'transport', 'actions.ts');
  let content = fs.readFileSync(filePath, 'utf8');

  // Add locationData parsing
  if (!content.includes('locationDataRaw')) {
    content = content.replace(
      /const languagesRaw = String\(formData\.get\("languages"\) \?\? "\[\]"\);/,
      `const languagesRaw = String(formData.get("languages") ?? "[]");
  const locationDataRaw = String(formData.get("locationData") ?? "{}");`
    );
  }

  // Add locationData variable
  if (!content.includes('let locationData')) {
    content = content.replace(
      /let customLanguages: string\[\] = \[\];/,
      `let customLanguages: string[] = [];
  let locationData = null;`
    );
  }

  // Add locationData parsing
  if (!content.includes('locationData = locationDataRaw')) {
    content = content.replace(
      /(try \{[\s\S]*?customLanguages = languagesRaw.*?\n.*?\}[\s\S]*?catch[\s\S]*?\n.*?\})/,
      `$1

  try {
    locationData = locationDataRaw ? JSON.parse(locationDataRaw) : null;
  } catch {
    return { status: "error", message: "Invalid location data format." };
  }`
    );
  }

  // Add to database insert
  if (!content.includes('location_data: locationData')) {
    content = content.replace(
      /(working_hours: workingHours,[\s\S]*?\.select\("id"\)\.single\(\);)/,
      function(match) {
        return match.replace(
          'working_hours: workingHours,',
          `working_hours: workingHours,
    location_data: locationData,`
        );
      }
    );
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('✅ Transport action updated with location data storage');
}

try {
  console.log('🔄 Updating all form actions to store location data...\n');
  updateGuideAction();
  updateAgencyAction();
  updateDmcAction();
  updateTransportAction();
  console.log('\n✅ All form actions updated successfully!');
  console.log('\n📝 Note: Make sure the application tables have a location_data column (JSONB)');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
