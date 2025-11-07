#!/usr/bin/env tsx
/**
 * Auto-fill Missing Translations
 * Fills missing translation keys with English values (marked for translation)
 */

import * as fs from "fs";
import * as path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const BASE_LOCALE = "en";

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

// Load and parse a translation file
function loadTranslations(locale: string): TranslationObject {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

// Save translations to file
function saveTranslations(locale: string, data: TranslationObject): void {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// Get value from nested object using dot notation
function getValue(obj: TranslationObject, path: string): string | TranslationObject | undefined {
  const keys = path.split(".");
  let current: any = obj;

  for (const key of keys) {
    if (current[key] === undefined) return undefined;
    current = current[key];
  }

  return current;
}

// Set value in nested object using dot notation
function setValue(obj: TranslationObject, path: string, value: string): void {
  const keys = path.split(".");
  let current: any = obj;

  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    if (!current[key] || typeof current[key] !== "object") {
      current[key] = {};
    }
    current = current[key];
  }

  current[keys[keys.length - 1]] = value;
}

// Flatten nested object into dot notation paths with values
function flattenToEntries(obj: TranslationObject, prefix = ""): [string, string][] {
  const entries: [string, string][] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null) {
      entries.push(...flattenToEntries(value, fullKey));
    } else {
      entries.push([fullKey, String(value)]);
    }
  }

  return entries;
}

// Get all locale files except base
function getTargetLocales(): string[] {
  return fs
    .readdirSync(MESSAGES_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"))
    .filter((locale) => locale !== BASE_LOCALE);
}

// Main auto-fill function
function autoFillTranslations() {
  console.log("🔧 Auto-filling Missing Translations\n");
  console.log("=" .repeat(80));

  const baseTranslations = loadTranslations(BASE_LOCALE);
  const baseEntries = flattenToEntries(baseTranslations);
  const baseMap = new Map(baseEntries);

  const locales = getTargetLocales();

  for (const locale of locales) {
    console.log(`\n📝 Processing ${locale.toUpperCase()}...`);

    const translations = loadTranslations(locale);
    const existingEntries = flattenToEntries(translations);
    const existingKeys = new Set(existingEntries.map(([key]) => key));

    let addedCount = 0;

    for (const [key, value] of baseEntries) {
      if (!existingKeys.has(key)) {
        // Add English value with marker for translation
        setValue(translations, key, value);
        addedCount++;
      }
    }

    if (addedCount > 0) {
      saveTranslations(locale, translations);
      console.log(`  ✅ Added ${addedCount} missing keys`);
    } else {
      console.log(`  ✅ Already complete!`);
    }
  }

  console.log("\n" + "=".repeat(80));
  console.log("\n✅ Auto-fill complete! All translations now have fallback values.\n");
  console.log("⚠️  Note: Newly added translations use English text as fallback.");
  console.log("   Please update them with proper translations.\n");
}

// Run auto-fill
try {
  autoFillTranslations();
} catch (error) {
  console.error("❌ Error running auto-fill:", error);
  process.exit(1);
}
