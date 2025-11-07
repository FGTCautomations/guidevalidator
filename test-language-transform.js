// Quick test to verify language name transformation
// Run with: node test-language-transform.js

const getLanguageName = (locale, code) => {
  if (!code) return undefined;
  const normalized = code.toLowerCase();
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "language" });
    return displayNames.of(normalized) ?? normalized;
  } catch {
    return normalized;
  }
};

// Test cases
const testCases = [
  { code: "en", expected: "English" },
  { code: "vi", expected: "Vietnamese" },
  { code: "zh", expected: "Chinese" },
  { code: "fr", expected: "French" },
  { code: "es", expected: "Spanish" },
  { code: "ja", expected: "Japanese" },
];

console.log("Testing language name transformation (locale: en):\n");

testCases.forEach(({ code, expected }) => {
  const result = getLanguageName("en", code);
  const status = result === expected ? "✓" : "✗";
  console.log(`${status} ${code} -> ${result} (expected: ${expected})`);
});

console.log("\n\nTesting with different locale (locale: vi):\n");

testCases.forEach(({ code }) => {
  const result = getLanguageName("vi", code);
  console.log(`  ${code} -> ${result}`);
});
