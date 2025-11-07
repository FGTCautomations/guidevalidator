#!/usr/bin/env tsx
/**
 * Import translations from CSV to JSON files
 */

import * as fs from "fs";
import * as path from "path";

const CSV_PATH = path.join(process.cwd(), "translation-template.csv");
const MESSAGES_DIR = path.join(process.cwd(), "messages");

// Parse CSV line handling quoted values with commas
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Column mapping
const COLUMNS = {
  namespace: 0,
  key: 1,
  english: 2,
  spanish: 3,
  french: 4,
  german: 5,
  chinese: 6,
  hindi: 7,
  urdu: 8,
  arabic: 9,
  japanese: 10,
  korean: 11,
  russian: 12,
};

const LANGUAGE_MAP: Record<string, string> = {
  spanish: "es",
  french: "fr",
  german: "de",
  chinese: "zh-Hans",
  hindi: "hi",
  urdu: "ur",
  arabic: "ar",
  japanese: "ja",
  korean: "ko",
  russian: "ru",
};

console.log("📥 Importing translations from CSV...\n");

// Read CSV file
const csvContent = fs.readFileSync(CSV_PATH, "utf-8");
const lines = csvContent.split("\n").filter((line) => line.trim());

// Skip header
const dataLines = lines.slice(1);

// Parse translations
const translations: Record<string, Record<string, Record<string, string>>> = {};

// Initialize structure for each language
Object.values(LANGUAGE_MAP).forEach((lang) => {
  translations[lang] = {};
});

let processedCount = 0;
let skippedCount = 0;

for (const line of dataLines) {
  const cols = parseCSVLine(line);

  if (cols.length < 13) {
    skippedCount++;
    continue;
  }

  const namespace = cols[COLUMNS.namespace].replace(/"/g, "");
  const key = cols[COLUMNS.key].replace(/"/g, "");

  // Skip if no key or namespace
  if (!namespace || !key) {
    skippedCount++;
    continue;
  }

  // Process each language
  for (const [langName, colIndex] of Object.entries(COLUMNS)) {
    if (langName === "namespace" || langName === "key" || langName === "english") continue;

    const langCode = LANGUAGE_MAP[langName];
    if (!langCode) continue;

    let translation = cols[colIndex];

    // Remove quotes if present
    if (translation && translation.startsWith('"') && translation.endsWith('"')) {
      translation = translation.slice(1, -1);
    }

    // Use English as fallback if translation is empty
    if (!translation || translation.trim() === "") {
      translation = cols[COLUMNS.english].replace(/"/g, "");
    }

    // Clean up encoding issues and HTML entities
    translation = translation
      .replace(/�/g, "'") // Fix apostrophes
      .replace(/&#10;/g, "\n") // Fix line breaks
      .trim();

    // Initialize namespace if not exists
    if (!translations[langCode][namespace]) {
      translations[langCode][namespace] = {};
    }

    translations[langCode][namespace][key] = translation;
  }

  processedCount++;
}

console.log(`✅ Processed ${processedCount} translation entries`);
if (skippedCount > 0) {
  console.log(`⚠️  Skipped ${skippedCount} invalid lines\n`);
}

// Load existing translations and merge
for (const [langCode, namespaces] of Object.entries(translations)) {
  const filePath = path.join(MESSAGES_DIR, `${langCode}.json`);

  console.log(`📝 Updating ${langCode}.json...`);

  // Load existing file
  let existing: Record<string, any> = {};
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, "utf-8");
    existing = JSON.parse(content);
  }

  // Merge translations
  for (const [namespace, keys] of Object.entries(namespaces)) {
    if (!existing[namespace]) {
      existing[namespace] = {};
    }

    // Merge keys
    Object.assign(existing[namespace], keys);
  }

  // Save updated file
  fs.writeFileSync(filePath, JSON.stringify(existing, null, 2) + "\n", "utf-8");

  const keyCount = Object.values(namespaces).reduce((sum, ns) => sum + Object.keys(ns).length, 0);
  console.log(`   Added/updated ${keyCount} keys`);
}

console.log("\n✅ All translations imported successfully!\n");
console.log("📊 Summary:");
console.log(`   Languages updated: ${Object.keys(translations).length}`);
console.log(`   Total entries: ${processedCount}`);
console.log(`   Files updated: messages/*.json\n`);
console.log("💡 Next steps:");
console.log("   1. Run: npm run dev");
console.log("   2. Test different languages in browser");
console.log("   3. Verify translations are showing correctly\n");
