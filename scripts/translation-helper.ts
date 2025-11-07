#!/usr/bin/env tsx
/**
 * Translation Helper CLI
 * Interactive tool for managing translations
 */

import * as fs from "fs";
import * as path from "path";
import * as readline from "readline";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const BASE_LOCALE = "en";

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

// Load translations
function loadTranslations(locale: string): TranslationObject {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

// Save translations
function saveTranslations(locale: string, data: TranslationObject): void {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// Get value from nested object
function getValue(obj: TranslationObject, path: string): string | TranslationObject | undefined {
  const keys = path.split(".");
  let current: any = obj;
  for (const key of keys) {
    if (current[key] === undefined) return undefined;
    current = current[key];
  }
  return current;
}

// Set value in nested object
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

// Flatten to key-value pairs
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

// Create readline interface
function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

// Ask a question
function ask(rl: readline.Interface, question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

// Main menu
async function mainMenu() {
  console.clear();
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║           🌍 Translation Helper CLI v1.0                  ║");
  console.log("╚════════════════════════════════════════════════════════════╝\n");

  console.log("Available Commands:\n");
  console.log("  1. Add new translation key");
  console.log("  2. Update existing translation");
  console.log("  3. Find missing translations");
  console.log("  4. Search translations");
  console.log("  5. Sync all locales (auto-fill missing)");
  console.log("  6. Audit all translations");
  console.log("  7. Export translations to CSV");
  console.log("  8. Import translations from CSV");
  console.log("  9. Exit\n");

  const rl = createInterface();
  const choice = await ask(rl, "Select an option (1-9): ");
  rl.close();

  switch (choice) {
    case "1":
      await addNewKey();
      break;
    case "2":
      await updateTranslation();
      break;
    case "3":
      await findMissing();
      break;
    case "4":
      await searchTranslations();
      break;
    case "5":
      await syncAllLocales();
      break;
    case "6":
      await runAudit();
      break;
    case "7":
      await exportToCsv();
      break;
    case "8":
      console.log("CSV import coming soon!");
      await pressAnyKey();
      break;
    case "9":
      console.log("\n👋 Goodbye!\n");
      process.exit(0);
    default:
      console.log("\n❌ Invalid option\n");
      await pressAnyKey();
  }

  await mainMenu();
}

// Add new translation key
async function addNewKey() {
  console.clear();
  console.log("═══ Add New Translation Key ═══\n");

  const rl = createInterface();

  const key = await ask(rl, "Enter key (e.g., 'nav.home'): ");
  if (!key) {
    console.log("❌ Key cannot be empty");
    rl.close();
    await pressAnyKey();
    return;
  }

  const enValue = await ask(rl, "Enter English value: ");
  if (!enValue) {
    console.log("❌ Value cannot be empty");
    rl.close();
    await pressAnyKey();
    return;
  }

  const syncAll = await ask(rl, "Add to all locales? (y/n): ");
  rl.close();

  try {
    // Add to English
    const enData = loadTranslations(BASE_LOCALE);
    setValue(enData, key, enValue);
    saveTranslations(BASE_LOCALE, enData);

    if (syncAll.toLowerCase() === "y") {
      // Add to all other locales
      const locales = fs
        .readdirSync(MESSAGES_DIR)
        .filter((f) => f.endsWith(".json"))
        .map((f) => path.basename(f, ".json"))
        .filter((l) => l !== BASE_LOCALE);

      for (const locale of locales) {
        const data = loadTranslations(locale);
        setValue(data, key, enValue); // Use English as placeholder
        saveTranslations(locale, data);
      }

      console.log(`\n✅ Added '${key}' to all locales`);
    } else {
      console.log(`\n✅ Added '${key}' to English`);
    }
  } catch (error) {
    console.log(`\n❌ Error: ${error}`);
  }

  await pressAnyKey();
}

// Update existing translation
async function updateTranslation() {
  console.clear();
  console.log("═══ Update Translation ═══\n");

  const rl = createInterface();

  const locale = await ask(rl, "Enter locale code (e.g., 'es', 'fr'): ");
  const key = await ask(rl, "Enter key to update: ");

  const data = loadTranslations(locale);
  const current = getValue(data, key);

  if (current === undefined) {
    console.log(`\n❌ Key '${key}' not found in ${locale}`);
    rl.close();
    await pressAnyKey();
    return;
  }

  console.log(`\nCurrent value: "${current}"`);
  const newValue = await ask(rl, "Enter new value: ");
  rl.close();

  if (!newValue) {
    console.log("❌ Value cannot be empty");
    await pressAnyKey();
    return;
  }

  setValue(data, key, newValue);
  saveTranslations(locale, data);

  console.log(`\n✅ Updated '${key}' in ${locale}`);
  await pressAnyKey();
}

// Find missing translations
async function findMissing() {
  console.clear();
  console.log("═══ Missing Translations ═══\n");

  const baseData = loadTranslations(BASE_LOCALE);
  const baseEntries = flattenToEntries(baseData);
  const baseKeys = new Set(baseEntries.map(([k]) => k));

  const locales = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.basename(f, ".json"))
    .filter((l) => l !== BASE_LOCALE);

  for (const locale of locales) {
    const data = loadTranslations(locale);
    const entries = flattenToEntries(data);
    const keys = new Set(entries.map(([k]) => k));

    const missing = Array.from(baseKeys).filter((k) => !keys.has(k));

    if (missing.length > 0) {
      console.log(`\n${locale.toUpperCase()}: ${missing.length} missing keys`);
      missing.slice(0, 5).forEach((key) => console.log(`  - ${key}`));
      if (missing.length > 5) {
        console.log(`  ... and ${missing.length - 5} more`);
      }
    } else {
      console.log(`\n${locale.toUpperCase()}: ✅ Complete`);
    }
  }

  await pressAnyKey();
}

// Search translations
async function searchTranslations() {
  console.clear();
  console.log("═══ Search Translations ═══\n");

  const rl = createInterface();
  const query = await ask(rl, "Enter search term: ");
  rl.close();

  if (!query) {
    console.log("❌ Search term cannot be empty");
    await pressAnyKey();
    return;
  }

  const baseData = loadTranslations(BASE_LOCALE);
  const entries = flattenToEntries(baseData);

  const results = entries.filter(
    ([key, value]) =>
      key.toLowerCase().includes(query.toLowerCase()) ||
      value.toLowerCase().includes(query.toLowerCase())
  );

  console.log(`\nFound ${results.length} matches:\n`);
  results.slice(0, 20).forEach(([key, value]) => {
    console.log(`  ${key}: "${value}"`);
  });

  if (results.length > 20) {
    console.log(`\n  ... and ${results.length - 20} more matches`);
  }

  await pressAnyKey();
}

// Sync all locales
async function syncAllLocales() {
  console.clear();
  console.log("═══ Syncing All Locales ═══\n");

  const baseData = loadTranslations(BASE_LOCALE);
  const baseEntries = flattenToEntries(baseData);

  const locales = fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.basename(f, ".json"))
    .filter((l) => l !== BASE_LOCALE);

  for (const locale of locales) {
    const data = loadTranslations(locale);
    const entries = flattenToEntries(data);
    const keys = new Set(entries.map(([k]) => k));

    let added = 0;
    for (const [key, value] of baseEntries) {
      if (!keys.has(key)) {
        setValue(data, key, value); // Use English as placeholder
        added++;
      }
    }

    if (added > 0) {
      saveTranslations(locale, data);
      console.log(`  ${locale}: Added ${added} keys`);
    } else {
      console.log(`  ${locale}: Already synced`);
    }
  }

  console.log("\n✅ Sync complete!");
  await pressAnyKey();
}

// Run audit
async function runAudit() {
  console.clear();
  console.log("═══ Running Audit ═══\n");
  console.log("Use: npm run audit-translations\n");
  await pressAnyKey();
}

// Export to CSV
async function exportToCsv() {
  console.clear();
  console.log("═══ Exporting to CSV ═══\n");

  const baseData = loadTranslations(BASE_LOCALE);
  const baseEntries = flattenToEntries(baseData);

  const locales = ["en", ...fs
    .readdirSync(MESSAGES_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => path.basename(f, ".json"))
    .filter((l) => l !== BASE_LOCALE)];

  const rows: string[] = [];
  rows.push(`"Key",${locales.map((l) => `"${l}"`).join(",")}`);

  for (const [key] of baseEntries) {
    const values = locales.map((locale) => {
      const data = loadTranslations(locale);
      const value = getValue(data, key);
      return `"${String(value || "").replace(/"/g, '""')}"`;
    });
    rows.push(`"${key}",${values.join(",")}`);
  }

  const csvPath = path.join(process.cwd(), "translations-export.csv");
  fs.writeFileSync(csvPath, rows.join("\n"), "utf-8");

  console.log(`✅ Exported to: ${csvPath}`);
  await pressAnyKey();
}

// Wait for key press
async function pressAnyKey() {
  const rl = createInterface();
  await ask(rl, "\nPress Enter to continue...");
  rl.close();
}

// Run
mainMenu().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
