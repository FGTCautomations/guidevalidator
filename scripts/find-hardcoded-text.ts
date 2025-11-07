#!/usr/bin/env tsx
/**
 * Find Hardcoded Text Script
 * Scans codebase for hardcoded English text that should be translated
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
  type: "jsx" | "string" | "object";
  severity: "high" | "medium" | "low";
}

const findings: HardcodedText[] = [];

// Patterns to detect hardcoded text
const patterns = {
  // JSX text content: <div>Hello World</div>
  jsxText: />([A-Z][a-zA-Z\s,.'":!?-]{3,})</g,

  // String literals in JSX: placeholder="Enter name"
  jsxAttribute: /(?:placeholder|label|title|alt|aria-label)=["']([^"']{3,})["']/g,

  // Button/Link text: <button>Click Here</button>
  buttonText: /<(?:button|a|Link)[^>]*>([A-Z][a-zA-Z\s]{2,})</g,

  // Title/heading text: <h1>Page Title</h1>
  headingText: /<h[1-6][^>]*>([A-Z][a-zA-Z\s,.'":!?-]{3,})</g,

  // String assignments: const title = "Hello"
  stringAssignment: /(?:title|label|placeholder|text|message|description|name)\s*[:=]\s*["']([^"']{3,})["']/g,
};

// Words/phrases that indicate translatable text
const translatableIndicators = [
  "sign in", "sign up", "log in", "log out", "submit", "cancel", "save",
  "edit", "delete", "create", "update", "search", "filter", "sort",
  "welcome", "hello", "thank", "please", "error", "success", "warning",
  "name", "email", "password", "phone", "address", "message",
  "profile", "account", "settings", "dashboard", "home", "about",
];

// Skip patterns (things that shouldn't be translated)
const skipPatterns = [
  /^[A-Z_]+$/, // ALL_CAPS (constants)
  /^[a-z_]+$/, // snake_case (variable names)
  /^[a-z][A-Z]/, // camelCase (variable names)
  /^\/[a-z]/, // Paths (/api, /home)
  /\.(tsx?|jsx?|json|css)/, // File extensions
  /^https?:\/\//, // URLs
  /^\d+/, // Numbers
  /^[A-Z]{2,3}$/, // Country codes, etc
  /className|onClick|onChange|onSubmit/i, // React props
];

function shouldSkip(text: string): boolean {
  const trimmed = text.trim();

  // Too short
  if (trimmed.length < 3) return true;

  // Check skip patterns
  if (skipPatterns.some(pattern => pattern.test(trimmed))) return true;

  // Only special characters
  if (!/[a-zA-Z]/.test(trimmed)) return true;

  return false;
}

function isTranslatable(text: string): boolean {
  const lower = text.toLowerCase();

  // Check if contains any translatable indicators
  if (translatableIndicators.some(indicator => lower.includes(indicator))) {
    return true;
  }

  // Check if it's a sentence (starts with capital, has spaces)
  if (/^[A-Z][a-z]+ .+/.test(text)) {
    return true;
  }

  return false;
}

function getSeverity(text: string, context: string): "high" | "medium" | "low" {
  // High priority: User-facing UI text
  if (context.includes("<button") || context.includes("<Link") ||
      context.includes("placeholder") || context.includes("title")) {
    return "high";
  }

  // Medium priority: Headings, labels
  if (context.includes("<h") || context.includes("label") ||
      context.includes("<p>")) {
    return "medium";
  }

  // Low priority: Everything else
  return "low";
}

function scanFile(filePath: string) {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Skip comments and imports
    if (line.trim().startsWith("//") ||
        line.trim().startsWith("/*") ||
        line.trim().startsWith("*") ||
        line.includes("import ") ||
        line.includes("from ")) {
      return;
    }

    // Check for JSX text content
    const jsxMatches = line.matchAll(patterns.jsxText);
    for (const match of jsxMatches) {
      const text = match[1].trim();
      if (!shouldSkip(text) && isTranslatable(text)) {
        findings.push({
          file: filePath,
          line: lineNumber,
          text,
          context: line.trim(),
          type: "jsx",
          severity: getSeverity(text, line),
        });
      }
    }

    // Check for JSX attributes
    const attrMatches = line.matchAll(patterns.jsxAttribute);
    for (const match of attrMatches) {
      const text = match[1].trim();
      if (!shouldSkip(text) && isTranslatable(text)) {
        findings.push({
          file: filePath,
          line: lineNumber,
          text,
          context: line.trim(),
          type: "string",
          severity: "high", // Attributes are usually important
        });
      }
    }

    // Check for button/link text
    const buttonMatches = line.matchAll(patterns.buttonText);
    for (const match of buttonMatches) {
      const text = match[1].trim();
      if (!shouldSkip(text) && isTranslatable(text)) {
        findings.push({
          file: filePath,
          line: lineNumber,
          text,
          context: line.trim(),
          type: "jsx",
          severity: "high",
        });
      }
    }

    // Check for heading text
    const headingMatches = line.matchAll(patterns.headingText);
    for (const match of headingMatches) {
      const text = match[1].trim();
      if (!shouldSkip(text) && isTranslatable(text)) {
        findings.push({
          file: filePath,
          line: lineNumber,
          text,
          context: line.trim(),
          type: "jsx",
          severity: "high",
        });
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

function generateReport() {
  console.log("🔍 Scanning codebase for hardcoded text...\n");

  const startTime = Date.now();

  for (const dir of SCAN_DIRS) {
    const fullPath = path.join(process.cwd(), dir);
    if (fs.existsSync(fullPath)) {
      scanDirectory(fullPath);
    }
  }

  const duration = Date.now() - startTime;

  console.log("=" .repeat(80));
  console.log(`\n📊 Scan Results (${duration}ms)\n`);
  console.log("=" .repeat(80));

  // Group by severity
  const high = findings.filter(f => f.severity === "high");
  const medium = findings.filter(f => f.severity === "medium");
  const low = findings.filter(f => f.severity === "low");

  console.log(`\n🔴 HIGH Priority: ${high.length} items`);
  console.log(`🟡 MEDIUM Priority: ${medium.length} items`);
  console.log(`🟢 LOW Priority: ${low.length} items`);
  console.log(`\n📈 TOTAL: ${findings.length} hardcoded text instances\n`);

  // Show top offenders
  const fileGroups = findings.reduce((acc, finding) => {
    if (!acc[finding.file]) acc[finding.file] = [];
    acc[finding.file].push(finding);
    return acc;
  }, {} as Record<string, HardcodedText[]>);

  const sortedFiles = Object.entries(fileGroups)
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  console.log("📁 Files with Most Hardcoded Text:\n");
  sortedFiles.forEach(([file, items]) => {
    const relPath = path.relative(process.cwd(), file);
    console.log(`  ${relPath}: ${items.length} instances`);
  });

  // Show sample findings
  console.log("\n\n📝 Sample Findings (High Priority):\n");
  console.log("─".repeat(80));

  high.slice(0, 20).forEach((finding, i) => {
    const relPath = path.relative(process.cwd(), finding.file);
    console.log(`\n${i + 1}. ${relPath}:${finding.line}`);
    console.log(`   Text: "${finding.text}"`);
    console.log(`   Context: ${finding.context.substring(0, 70)}...`);
  });

  if (high.length > 20) {
    console.log(`\n   ... and ${high.length - 20} more high priority items`);
  }

  // Save detailed report
  const report = {
    scannedAt: new Date().toISOString(),
    duration: `${duration}ms`,
    summary: {
      total: findings.length,
      high: high.length,
      medium: medium.length,
      low: low.length,
    },
    fileStats: Object.entries(fileGroups)
      .map(([file, items]) => ({
        file: path.relative(process.cwd(), file),
        count: items.length,
        high: items.filter(f => f.severity === "high").length,
        medium: items.filter(f => f.severity === "medium").length,
        low: items.filter(f => f.severity === "low").length,
      }))
      .sort((a, b) => b.count - a.count),
    findings: findings.map(f => ({
      ...f,
      file: path.relative(process.cwd(), f.file),
    })),
  };

  const reportPath = path.join(process.cwd(), "hardcoded-text-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  console.log("\n\n" + "=".repeat(80));
  console.log(`\n✅ Detailed report saved to: hardcoded-text-report.json`);
  console.log("\n💡 Next Steps:");
  console.log("   1. Review high priority items first");
  console.log("   2. Replace hardcoded text with translation keys");
  console.log("   3. Use: const t = useTranslations('namespace')");
  console.log("   4. Replace: 'Hello' → {t('greeting')}");
  console.log("\n" + "=".repeat(80) + "\n");
}

// Run scan
try {
  generateReport();
} catch (error) {
  console.error("❌ Error scanning codebase:", error);
  process.exit(1);
}
