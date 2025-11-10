// Script to add dynamic export to all page.tsx files
const fs = require('fs');
const path = require('path');

function getAllFiles(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllFiles(filePath, arrayOfFiles);
    } else if (file === 'page.tsx' || file === 'layout.tsx') {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const localeDir = path.join(__dirname, 'app', '[locale]');
const pageFiles = getAllFiles(localeDir);

console.log(`Found ${pageFiles.length} files to process\n`);

let processedCount = 0;
let skippedCount = 0;

pageFiles.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if already has the export
  if (/export\s+const\s+dynamic\s*=/.test(content)) {
    console.log(`✓ Already has dynamic export: ${filePath}`);
    skippedCount++;
    return;
  }

  // Add export at the beginning
  const newContent = 'export const dynamic = "force-dynamic";\n\n' + content;
  fs.writeFileSync(filePath, newContent, 'utf8');

  console.log(`✓ Added dynamic export to: ${filePath}`);
  processedCount++;
});

console.log(`\n✅ Done!`);
console.log(`   Processed: ${processedCount} files`);
console.log(`   Skipped: ${skippedCount} files (already had export)`);
