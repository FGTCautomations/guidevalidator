const fs = require('fs');
const path = require('path');

function getAllApiRoutes(dirPath, arrayOfFiles = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    if (fs.statSync(filePath).isDirectory()) {
      arrayOfFiles = getAllApiRoutes(filePath, arrayOfFiles);
    } else if (file === 'route.ts') {
      arrayOfFiles.push(filePath);
    }
  });

  return arrayOfFiles;
}

const apiDir = path.join(__dirname, 'app', 'api');
const apiRoutes = getAllApiRoutes(apiDir);

console.log(`Found ${apiRoutes.length} API route files\n`);

let addedCount = 0;
let skippedCount = 0;

apiRoutes.forEach((filePath) => {
  const content = fs.readFileSync(filePath, 'utf8');

  // Check if already has dynamic export
  if (/export\s+const\s+dynamic\s*=/.test(content)) {
    console.log(`✓ Already has dynamic export: ${filePath.replace(__dirname + '\\', '')}`);
    skippedCount++;
    return;
  }

  // Add dynamic export at the top
  const newContent = 'export const dynamic = "force-dynamic";\n\n' + content;
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log(`✓ Added dynamic export to: ${filePath.replace(__dirname + '\\', '')}`);
  addedCount++;
});

console.log(`\n✅ Done! Added to ${addedCount} files, skipped ${skippedCount} files`);
