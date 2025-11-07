#!/usr/bin/env tsx
/**
 * Export Hardcoded Text to Translation Template
 * Creates a structured file for easy translation
 */

import * as fs from "fs";
import * as path from "path";

const SCAN_DIRS = ["app", "components", "lib"];
const SKIP_DIRS = ["node_modules", ".next", ".git"];
const FILE_EXTENSIONS = [".tsx", ".ts", ".jsx", ".js"];

interface HardcodedText {
  file: string;
  line: number;
  text: string;
  context: string;
  suggestedKey: string;
  namespace: string;
}

const findings: HardcodedText[] = [];
const seenTexts = new Set<string>();

// Patterns to detect hardcoded text
const patterns = {
  jsxText: />([A-Z][a-zA-Z\s,.'":!?&-]{3,100})</g,
  jsxAttribute: /(?:placeholder|label|title|alt|aria-label)=["']([^"']{3,100})["']/g,
  buttonText: /<(?:button|a|Link)[^>]*>([A-Z][a-zA-Z\s]{2,50})</g,
  headingText: /<h[1-6][^>]*>([A-Z][a-zA-Z\s,.'":!?-]{3,100})</g,
};

const skipPatterns = [
  /^[A-Z_]+$/,
  /^[a-z_]+$/,
  /^[a-z][A-Z]/,
  /^\/[a-z]/,
  /\.(tsx?|jsx?|json|css)/,
  /^https?:\/\//,
  /^\d+/,
  /^[A-Z]{2,3}$/,
  /className|onClick|onChange|onSubmit/i,
  /^(true|false|null|undefined)$/i,
];

function shouldSkip(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 3 || trimmed.length > 100) return true;
  if (skipPatterns.some(pattern => pattern.test(trimmed))) return true;
  if (!/[a-zA-Z]/.test(trimmed)) return true;
  return false;
}

function generateKey(text: string, filePath: string): string {
  // Remove special characters and create camelCase
  const cleaned = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 0)
    .slice(0, 4) // Max 4 words
    .map((word, i) => (i === 0 ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join("");

  return cleaned || "text";
}

function getNamespace(filePath: string): string {
  const relative = path.relative(process.cwd(), filePath);
  const parts = relative.split(path.sep);

  // For app routes
  if (parts[0] === "app") {
    if (parts[1] === "[locale]") {
      const section = parts[2];
      if (section === "auth") return "auth";
      if (section === "admin") return "admin";
      if (section === "directory") return "directory";
      if (section === "account") return "account";
      if (section === "pricing") return "pricing";
      if (section === "jobs") return "jobs";
      if (section === "contact") return "contact";
      if (section === "profiles") return "profile";
      if (section === "legal") return "legal";
      return section || "common";
    }
  }

  // For components
  if (parts[0] === "components") {
    const section = parts[1];
    if (section === "auth") return "auth";
    if (section === "admin") return "admin";
    if (section === "directory") return "directory";
    if (section === "account") return "account";
    if (section === "profile") return "profile";
    if (section === "jobs") return "jobs";
    if (section === "layout") return "nav";
    return section || "common";
  }

  return "common";
}

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (
      line.trim().startsWith("//") ||
      line.trim().startsWith("/*") ||
      line.trim().startsWith("*") ||
      line.includes("import ") ||
      line.includes("from ")
    ) {
      return;
    }

    const allPatterns = [
      patterns.jsxText,
      patterns.jsxAttribute,
      patterns.buttonText,
      patterns.headingText,
    ];

    for (const pattern of allPatterns) {
      const matches = line.matchAll(pattern);
      for (const match of matches) {
        const text = match[1].trim();

        if (!shouldSkip(text) && !seenTexts.has(text)) {
          seenTexts.add(text);

          const namespace = getNamespace(filePath);
          const key = generateKey(text, filePath);

          findings.push({
            file: path.relative(process.cwd(), filePath),
            line: lineNumber,
            text,
            context: line.trim().substring(0, 80),
            suggestedKey: key,
            namespace,
          });
        }
      }
    }
  });
}

function scanDirectory(dir: string) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) {
        scanDirectory(fullPath);
      }
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name);
      if (FILE_EXTENSIONS.includes(ext)) {
        scanFile(fullPath);
      }
    }
  }
}

function generateTranslationTemplate() {
  console.log("🔍 Scanning codebase for hardcoded text...\n");

  for (const dir of SCAN_DIRS) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      scanDirectory(fullPath);
    }
  }

  console.log(`Found ${findings.length} unique text instances\n`);

  // Group by namespace
  const grouped: Record<string, HardcodedText[]> = {};
  findings.forEach((finding) => {
    if (!grouped[finding.namespace]) {
      grouped[finding.namespace] = [];
    }
    grouped[finding.namespace].push(finding);
  });

  // Generate translation template
  const template: Record<string, any> = {};

  for (const [namespace, items] of Object.entries(grouped)) {
    template[namespace] = {};
    const keyCount: Record<string, number> = {};

    items.forEach((item) => {
      let key = item.suggestedKey;

      // Handle duplicate keys
      if (keyCount[key]) {
        keyCount[key]++;
        key = `${key}${keyCount[key]}`;
      } else {
        keyCount[key] = 1;
      }

      template[namespace][key] = item.text;
    });
  }

  // Save template
  const templatePath = path.join(process.cwd(), "translation-template.json");
  fs.writeFileSync(templatePath, JSON.stringify(template, null, 2) + "\n");

  console.log(`✅ Translation template saved to: translation-template.json\n`);

  // Generate CSV for easy editing
  const csvRows: string[] = [];
  csvRows.push("Namespace,Key,English Text,Spanish,French,German,Chinese,Hindi,Urdu,Arabic,Japanese,Korean,Russian");

  for (const [namespace, items] of Object.entries(grouped)) {
    const keyCount: Record<string, number> = {};

    items.forEach((item) => {
      let key = item.suggestedKey;

      if (keyCount[key]) {
        keyCount[key]++;
        key = `${key}${keyCount[key]}`;
      } else {
        keyCount[key] = 1;
      }

      const escapedText = `"${item.text.replace(/"/g, '""')}"`;
      csvRows.push(
        `"${namespace}","${key}",${escapedText},,,,,,,,,,`
      );
    });
  }

  const csvPath = path.join(process.cwd(), "translation-template.csv");
  fs.writeFileSync(csvPath, csvRows.join("\n"));

  console.log(`✅ CSV template saved to: translation-template.csv\n`);

  // Generate markdown report
  const mdLines: string[] = [];
  mdLines.push("# 📋 Hardcoded Text Translation List\n");
  mdLines.push(`**Total unique texts found:** ${findings.length}\n`);
  mdLines.push("**Last updated:** " + new Date().toISOString() + "\n");
  mdLines.push("---\n");

  const sortedNamespaces = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);

  for (const [namespace, items] of sortedNamespaces) {
    mdLines.push(`\n## ${namespace.toUpperCase()} (${items.length} items)\n`);

    const keyCount: Record<string, number> = {};

    items.forEach((item, i) => {
      let key = item.suggestedKey;

      if (keyCount[key]) {
        keyCount[key]++;
        key = `${key}${keyCount[key]}`;
      } else {
        keyCount[key] = 1;
      }

      mdLines.push(`### ${i + 1}. \`${namespace}.${key}\`\n`);
      mdLines.push(`**English:** "${item.text}"\n`);
      mdLines.push(`**File:** ${item.file}:${item.line}\n`);
      mdLines.push(`**Context:** \`${item.context}\`\n`);
      mdLines.push("**Translations:**");
      mdLines.push("- Spanish: ");
      mdLines.push("- French: ");
      mdLines.push("- German: ");
      mdLines.push("- Chinese: ");
      mdLines.push("- Hindi: ");
      mdLines.push("- Urdu: ");
      mdLines.push("- Arabic: ");
      mdLines.push("- Japanese: ");
      mdLines.push("- Korean: ");
      mdLines.push("- Russian: \n");
    });
  }

  const mdPath = path.join(process.cwd(), "TRANSLATION_LIST.md");
  fs.writeFileSync(mdPath, mdLines.join("\n"));

  console.log(`✅ Markdown list saved to: TRANSLATION_LIST.md\n`);

  // Print summary
  console.log("=" .repeat(80));
  console.log("\n📊 Summary by Namespace:\n");

  sortedNamespaces.forEach(([namespace, items]) => {
    console.log(`  ${namespace.padEnd(20)} ${items.length.toString().padStart(4)} items`);
  });

  console.log("\n" + "=" .repeat(80));
  console.log("\n📝 Files Generated:\n");
  console.log("  1. translation-template.json  - JSON structure ready to copy");
  console.log("  2. translation-template.csv   - Spreadsheet for translators");
  console.log("  3. TRANSLATION_LIST.md        - Human-readable markdown list");
  console.log("\n💡 Next Steps:\n");
  console.log("  1. Review TRANSLATION_LIST.md");
  console.log("  2. Add translations to translation-template.csv");
  console.log("  3. Or manually add to messages/*.json files");
  console.log("\n" + "=" .repeat(80) + "\n");
}

// Run
try {
  generateTranslationTemplate();
} catch (error) {
  console.error("❌ Error:", error);
  process.exit(1);
}
