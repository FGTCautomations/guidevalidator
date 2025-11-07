#!/usr/bin/env tsx
/**
 * Translation Audit Script
 * Checks all translation files for completeness against English (base language)
 */

import * as fs from "fs";
import * as path from "path";

const MESSAGES_DIR = path.join(process.cwd(), "messages");
const BASE_LOCALE = "en";

interface TranslationObject {
  [key: string]: string | TranslationObject;
}

// Flatten nested object keys into dot notation
function flattenKeys(obj: TranslationObject, prefix = ""): string[] {
  const keys: string[] = [];

  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (typeof value === "object" && value !== null) {
      keys.push(...flattenKeys(value, fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

// Get all locale files
function getLocaleFiles(): string[] {
  return fs
    .readdirSync(MESSAGES_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => path.basename(file, ".json"));
}

// Load and parse a translation file
function loadTranslations(locale: string): TranslationObject {
  const filePath = path.join(MESSAGES_DIR, `${locale}.json`);
  const content = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(content);
}

// Main audit function
function auditTranslations() {
  console.log("🔍 Translation Audit Report\n");
  console.log("=" .repeat(80));

  const locales = getLocaleFiles();
  const baseTranslations = loadTranslations(BASE_LOCALE);
  const baseKeys = flattenKeys(baseTranslations);

  console.log(`\n📊 Base language (${BASE_LOCALE}): ${baseKeys.length} keys\n`);

  const results: {
    locale: string;
    totalKeys: number;
    missingKeys: string[];
    extraKeys: string[];
    completeness: number;
  }[] = [];

  for (const locale of locales) {
    if (locale === BASE_LOCALE) continue;

    const translations = loadTranslations(locale);
    const keys = flattenKeys(translations);
    const keySet = new Set(keys);
    const baseKeySet = new Set(baseKeys);

    const missingKeys = baseKeys.filter((key) => !keySet.has(key));
    const extraKeys = keys.filter((key) => !baseKeySet.has(key));
    const completeness = ((keys.length / baseKeys.length) * 100).toFixed(1);

    results.push({
      locale,
      totalKeys: keys.length,
      missingKeys,
      extraKeys,
      completeness: parseFloat(completeness),
    });
  }

  // Sort by completeness (descending)
  results.sort((a, b) => b.completeness - a.completeness);

  // Print summary
  console.log("📋 Summary by Language:\n");
  console.log("┌─────────────┬─────────────┬─────────────┬─────────────┬──────────────┐");
  console.log("│ Locale      │ Total Keys  │ Missing     │ Extra       │ Complete (%) │");
  console.log("├─────────────┼─────────────┼─────────────┼─────────────┼──────────────┤");

  for (const result of results) {
    const status = result.completeness === 100 ? "✅" : result.completeness >= 90 ? "⚠️ " : "❌";
    console.log(
      `│ ${status} ${result.locale.padEnd(8)} │ ${String(result.totalKeys).padEnd(11)} │ ${String(result.missingKeys.length).padEnd(11)} │ ${String(result.extraKeys.length).padEnd(11)} │ ${String(result.completeness).padEnd(12)} │`
    );
  }
  console.log("└─────────────┴─────────────┴─────────────┴─────────────┴──────────────┘\n");

  // Print detailed missing keys for incomplete translations
  console.log("\n📝 Detailed Missing Keys:\n");

  for (const result of results) {
    if (result.missingKeys.length > 0) {
      console.log(`\n${result.locale.toUpperCase()} - Missing ${result.missingKeys.length} keys:`);
      console.log("─".repeat(80));

      // Group by namespace
      const grouped: { [namespace: string]: string[] } = {};
      for (const key of result.missingKeys) {
        const namespace = key.split(".")[0];
        if (!grouped[namespace]) grouped[namespace] = [];
        grouped[namespace].push(key);
      }

      for (const [namespace, keys] of Object.entries(grouped)) {
        console.log(`\n  ${namespace}: (${keys.length} missing)`);
        for (const key of keys.slice(0, 10)) {
          console.log(`    - ${key}`);
        }
        if (keys.length > 10) {
          console.log(`    ... and ${keys.length - 10} more`);
        }
      }
    }
  }

  // Print extra keys warning
  const withExtraKeys = results.filter((r) => r.extraKeys.length > 0);
  if (withExtraKeys.length > 0) {
    console.log("\n\n⚠️  Languages with extra keys (not in base language):\n");
    for (const result of withExtraKeys) {
      console.log(`  ${result.locale}: ${result.extraKeys.length} extra keys`);
      for (const key of result.extraKeys.slice(0, 5)) {
        console.log(`    - ${key}`);
      }
      if (result.extraKeys.length > 5) {
        console.log(`    ... and ${result.extraKeys.length - 5} more`);
      }
    }
  }

  // Overall statistics
  console.log("\n\n📊 Overall Statistics:\n");
  const avgCompleteness = (
    results.reduce((sum, r) => sum + r.completeness, 0) / results.length
  ).toFixed(1);
  const fullyComplete = results.filter((r) => r.completeness === 100).length;
  const needsWork = results.filter((r) => r.completeness < 90).length;

  console.log(`  Average Completeness: ${avgCompleteness}%`);
  console.log(`  Fully Complete: ${fullyComplete}/${results.length} languages`);
  console.log(`  Needs Work (<90%): ${needsWork}/${results.length} languages`);

  console.log("\n" + "=".repeat(80) + "\n");

  // Generate JSON report
  const report = {
    baseLocale: BASE_LOCALE,
    baseKeyCount: baseKeys.length,
    auditDate: new Date().toISOString(),
    results,
  };

  const reportPath = path.join(process.cwd(), "translation-audit-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`✅ Detailed report saved to: ${reportPath}\n`);
}

// Run audit
try {
  auditTranslations();
} catch (error) {
  console.error("❌ Error running audit:", error);
  process.exit(1);
}
