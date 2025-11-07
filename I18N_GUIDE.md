# 🌍 Internationalization (i18n) Guide

Complete guide for managing translations in Guide Validator

## 📋 Table of Contents

1. [Overview](#overview)
2. [Supported Languages](#supported-languages)
3. [Getting Started](#getting-started)
4. [Translation Management](#translation-management)
5. [SEO Configuration](#seo-configuration)
6. [Build Optimization](#build-optimization)
7. [Best Practices](#best-practices)

---

## Overview

Guide Validator supports 11 languages with **zero performance impact** on load speed. Each user only downloads their selected language (~30KB).

### Architecture

- **Framework**: Next.js 14 + next-intl
- **Strategy**: Static generation with on-demand rendering
- **Bundle**: Only one language per request
- **SEO**: Full hreflang and canonical tag support

---

## Supported Languages

| Language | Code | Native Name | Flag | Priority |
|----------|------|-------------|------|----------|
| English | `en` | English | 🇬🇧 | ⭐ High |
| Spanish | `es` | Español | 🇪🇸 | ⭐ High |
| French | `fr` | Français | 🇫🇷 | ⭐ High |
| German | `de` | Deutsch | 🇩🇪 | ⭐ High |
| Chinese | `zh-Hans` | 中文 (简体) | 🇨🇳 | Standard |
| Hindi | `hi` | हिन्दी | 🇮🇳 | Standard |
| Urdu | `ur` | اردو | 🇵🇰 | Standard |
| Arabic | `ar` | العربية | 🇸🇦 | Standard |
| Japanese | `ja` | 日本語 | 🇯🇵 | Standard |
| Korean | `ko` | 한국어 | 🇰🇷 | Standard |
| Russian | `ru` | Русский | 🇷🇺 | Standard |

**Priority Languages** are pre-generated at build time. Others are generated on-demand.

---

## Getting Started

### View Translation Status

```bash
npm run i18n:audit
```

This generates a detailed report showing:
- Completeness percentage per language
- Missing translation keys
- Extra keys not in base language
- Overall statistics

### Auto-Fill Missing Translations

```bash
npm run i18n:fill
```

Automatically fills missing keys with English fallback values (marked for translation).

### Interactive Translation Helper

```bash
npm run i18n:helper
```

Interactive CLI tool with menu-driven options:
1. Add new translation key
2. Update existing translation
3. Find missing translations
4. Search translations
5. Sync all locales
6. Audit translations
7. Export to CSV
8. Import from CSV

---

## Translation Management

### File Structure

```
messages/
├── en.json       # Base language (English)
├── es.json       # Spanish
├── fr.json       # French
├── de.json       # German
├── zh-Hans.json  # Chinese Simplified
├── hi.json       # Hindi
├── ur.json       # Urdu
├── ar.json       # Arabic
├── ja.json       # Japanese
├── ko.json       # Korean
└── ru.json       # Russian
```

### Translation Format

```json
{
  "nav": {
    "home": "Home",
    "directory": "Directory",
    "pricing": "Pricing"
  },
  "auth": {
    "signin": "Sign In",
    "signup": "Sign Up"
  }
}
```

### Adding New Translations

#### Option 1: Manual Edit

1. Edit `messages/en.json` (base language)
2. Run `npm run i18n:fill` to sync to all languages
3. Update non-English files with actual translations

#### Option 2: Using Helper Tool

1. Run `npm run i18n:helper`
2. Select "Add new translation key"
3. Enter key (e.g., `nav.newItem`)
4. Enter English value
5. Choose to sync to all locales

### Updating Translations

```bash
npm run i18n:helper
# Select option 2: Update existing translation
```

### Searching Translations

```bash
npm run i18n:helper
# Select option 4: Search translations
```

---

## SEO Configuration

### Hreflang Tags

Automatic hreflang tags are generated for all pages:

```html
<link rel="alternate" hreflang="en" href="https://guidevalidator.com/en" />
<link rel="alternate" hreflang="es" href="https://guidevalidator.com/es" />
<link rel="alternate" hreflang="fr" href="https://guidevalidator.com/fr" />
<!-- ... all languages ... -->
<link rel="alternate" hreflang="x-default" href="https://guidevalidator.com/en" />
<link rel="canonical" href="https://guidevalidator.com/[current-locale]" />
```

### Configuration

Set your site URL in `.env.local`:

```env
NEXT_PUBLIC_SITE_URL=https://guidevalidator.com
```

### Metadata

Each locale has:
- Canonical URL pointing to current language version
- Alternate links to all language versions
- x-default link pointing to English version

---

## Build Optimization

### Priority vs On-Demand Rendering

**Configuration:** `i18n/build-config.ts`

```typescript
// Pre-generated at build time (faster first load)
export const priorityLocales = ["en", "es", "fr", "de"];

// Generated on first request (reduces build time)
export const onDemandLocales = ["zh-Hans", "hi", "ur", "ar", "ko", "ja", "ru"];
```

### Build Time Comparison

| Scenario | Pages Generated | Build Time | Strategy |
|----------|-----------------|------------|----------|
| **Development** | ~52 (English only) | ~30 seconds | Fast iteration |
| **Preview** | ~208 (4 priority locales) | ~2 minutes | Quick previews |
| **Production** | ~208 (4 priority locales) | ~3 minutes | Optimized |

Other locales are generated on-demand and cached.

### Adjusting Priority Locales

Edit `i18n/build-config.ts`:

```typescript
// Add more locales to priority list for pre-generation
export const priorityLocales = ["en", "es", "fr", "de", "zh-Hans", "ja"];
```

### Full Static Generation

To pre-generate ALL locales at build time:

```typescript
// i18n/build-config.ts
export function getStaticGenLocales(): SupportedLocale[] {
  return locales; // Generate all locales
}
```

---

## Best Practices

### 1. Always Start with English

English (`en.json`) is the base language. Add keys there first, then sync to other languages.

### 2. Use Descriptive Keys

**Good:**
```json
{
  "auth": {
    "signin": {
      "title": "Sign In",
      "subtitle": "Welcome back to Guide Validator"
    }
  }
}
```

**Bad:**
```json
{
  "text1": "Sign In",
  "text2": "Welcome back"
}
```

### 3. Group Related Translations

```json
{
  "profile": {
    "edit": {
      "title": "Edit Profile",
      "save": "Save Changes",
      "cancel": "Cancel"
    }
  }
}
```

### 4. Keep Values Short and Contextual

Avoid hardcoding entire paragraphs. Break into smaller, reusable pieces.

### 5. Use Placeholders for Dynamic Content

```json
{
  "welcome": "Welcome, {name}!",
  "itemsCount": "You have {count} items"
}
```

### 6. Handle Pluralization

```json
{
  "reviews": {
    "one": "1 review",
    "other": "{count} reviews"
  }
}
```

### 7. Test with RTL Languages

Arabic and Urdu are RTL (right-to-left). Test your UI with these languages.

### 8. Regular Audits

Run weekly audits to catch missing translations:

```bash
npm run i18n:audit
```

### 9. Export for Translation Services

```bash
npm run i18n:helper
# Select option 7: Export to CSV
```

Send `translations-export.csv` to translators, then import back.

### 10. User-Generated Content

Keep user-generated content (profiles, reviews) in original language. Don't auto-translate.

---

## Troubleshooting

### Missing Translation Warnings

**Problem:** Build shows `MISSING_MESSAGE` warnings

**Solution:**
```bash
npm run i18n:fill
```

### Translation Not Showing

**Problem:** Added translation but it's not appearing

**Solutions:**
1. Clear Next.js cache: `rm -rf .next`
2. Restart dev server
3. Check key path is correct
4. Verify JSON syntax is valid

### Build Taking Too Long

**Problem:** Build time exceeds 10 minutes

**Solutions:**
1. Reduce priority locales in `i18n/build-config.ts`
2. Use on-demand rendering for more languages
3. Enable caching in CI/CD

### Language Selector Not Working

**Problem:** Switching languages doesn't work

**Solutions:**
1. Check browser console for errors
2. Verify all locale routes exist
3. Clear browser cache
4. Check Next.js middleware configuration

---

## Performance Metrics

### Bundle Size Impact

| Scenario | First Load JS | Impact |
|----------|---------------|--------|
| **1 Language** | 87.2 KB | Baseline |
| **11 Languages** | 87.2 KB | **+0 KB** |

Only one language file is loaded per request (~28-32 KB).

### Load Speed

- **Initial Page Load**: 0ms overhead (language selected server-side)
- **Language Switch**: Full page reload (~200-500ms)
- **Subsequent Navigation**: Instant (cached)

### SEO Impact

- **Indexing**: Each language indexed separately
- **Rankings**: Improved international SEO
- **Crawl Budget**: Efficient (static pages)

---

## API Reference

### Configuration Files

| File | Purpose |
|------|---------|
| `i18n/config.ts` | Locale definitions and labels |
| `i18n/build-config.ts` | Build optimization settings |
| `i18n/request.ts` | Runtime configuration |
| `messages/*.json` | Translation files |

### npm Scripts

| Command | Description |
|---------|-------------|
| `npm run i18n:audit` | Audit all translations |
| `npm run i18n:fill` | Auto-fill missing keys |
| `npm run i18n:helper` | Interactive translation tool |

### Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `LanguageSelector` | `components/layout/language-selector.tsx` | Dropdown menu |
| `HreflangTags` | `components/seo/hreflang-tags.tsx` | SEO meta tags |

---

## Support

For questions or issues:

1. Check this guide first
2. Run `npm run i18n:audit` for diagnostics
3. Check build logs for specific errors
4. Review Next.js i18n documentation

---

## Changelog

### v1.0 (Current)
- ✅ 11 languages supported
- ✅ Language selector in header
- ✅ Full hreflang SEO support
- ✅ Optimized build process
- ✅ Translation management tools
- ✅ Auto-fill missing translations
- ✅ CSV export functionality
- ✅ Interactive CLI helper

---

**Last Updated:** 2025-01-05
**Maintained By:** Development Team
