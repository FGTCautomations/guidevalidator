# 🌍 Translation Migration Guide

Complete step-by-step guide to translate all visual text in your codebase

## 📋 Overview

This guide will help you systematically find and translate all hardcoded English text in your application.

---

## 🎯 Phase 1: Discover Hardcoded Text

### Step 1: Scan Your Codebase

```bash
npm run i18n:scan
```

This will:
- Scan all `.tsx`, `.ts`, `.jsx`, `.js` files
- Find hardcoded English text
- Categorize by priority (high/medium/low)
- Generate a detailed JSON report

### Step 2: Review the Report

Open `hardcoded-text-report.json` to see:

```json
{
  "summary": {
    "total": 450,
    "high": 120,
    "medium": 200,
    "low": 130
  },
  "fileStats": [
    {
      "file": "components/auth/sign-in-form.tsx",
      "count": 25,
      "high": 15
    }
  ],
  "findings": [...]
}
```

### Step 3: Prioritize

Focus on:
1. **High Priority** (120 items): Buttons, forms, placeholders, headings
2. **Medium Priority** (200 items): Paragraphs, labels, descriptions
3. **Low Priority** (130 items): Error messages, tooltips

---

## 🔧 Phase 2: Set Up Translation Infrastructure

### Already Done ✅
- ✅ Language selector in header
- ✅ 11 languages configured
- ✅ Translation files structure
- ✅ next-intl setup

### Verify Setup

Check that these files exist:
```
messages/
├── en.json       ← Base language
├── es.json
├── fr.json
└── ... (8 more)
```

---

## 📝 Phase 3: Migration Process

### Workflow Overview

```
1. Identify hardcoded text
2. Choose appropriate translation key
3. Add to messages/en.json
4. Replace in component
5. Sync to other languages
6. Test in browser
```

### Example Migration

#### Before (Hardcoded):
```tsx
// components/auth/sign-in-form.tsx
export function SignInForm() {
  return (
    <div>
      <h1>Sign In</h1>
      <input placeholder="Enter your email" />
      <button>Submit</button>
    </div>
  );
}
```

#### After (Translated):
```tsx
// components/auth/sign-in-form.tsx
"use client";

import { useTranslations } from "next-intl";

export function SignInForm() {
  const t = useTranslations("auth.signin");

  return (
    <div>
      <h1>{t("title")}</h1>
      <input placeholder={t("emailPlaceholder")} />
      <button>{t("submit")}</button>
    </div>
  );
}
```

#### Translation File:
```json
// messages/en.json
{
  "auth": {
    "signin": {
      "title": "Sign In",
      "emailPlaceholder": "Enter your email",
      "submit": "Submit"
    }
  }
}
```

---

## 📚 Phase 4: Translation Patterns

### Pattern 1: Client Components

**When to use:** Interactive components with useState, onClick, etc.

```tsx
"use client";

import { useTranslations } from "next-intl";

export function MyComponent() {
  const t = useTranslations("namespace");

  return <div>{t("key")}</div>;
}
```

### Pattern 2: Server Components

**When to use:** Pages and layouts (default in App Router)

```tsx
import { getTranslations } from "next-intl/server";

export default async function Page() {
  const t = await getTranslations("namespace");

  return <div>{t("key")}</div>;
}
```

### Pattern 3: Form Placeholders

```tsx
<input
  placeholder={t("form.emailPlaceholder")}
  aria-label={t("form.emailLabel")}
/>
```

### Pattern 4: Dynamic Content

```tsx
// With variables
t("welcome", { name: user.name })

// In messages/en.json
{
  "welcome": "Welcome, {name}!"
}
```

### Pattern 5: Pluralization

```tsx
t("itemCount", { count: items.length })

// In messages/en.json
{
  "itemCount": "{count, plural, =0 {No items} =1 {1 item} other {# items}}"
}
```

### Pattern 6: Rich Text (with HTML)

```tsx
t.rich("terms", {
  link: (chunks) => <a href="/terms">{chunks}</a>
})

// In messages/en.json
{
  "terms": "I agree to the <link>terms and conditions</link>"
}
```

---

## 🗂️ Phase 5: Organization Strategy

### Namespace Structure

Organize translations by feature/section:

```json
{
  "nav": {
    "home": "Home",
    "about": "About"
  },
  "auth": {
    "signin": {
      "title": "Sign In",
      "subtitle": "Welcome back"
    },
    "signup": {
      "title": "Sign Up",
      "subtitle": "Create your account"
    }
  },
  "profile": {
    "edit": {
      "title": "Edit Profile",
      "save": "Save Changes"
    }
  },
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit"
  }
}
```

### Best Practices

1. **Use nested structure** for related translations
2. **Create "common" namespace** for reused text (Save, Cancel, etc.)
3. **Use descriptive keys**: `auth.signin.title` not `text1`
4. **Keep related translations together**

---

## 🚀 Phase 6: File-by-File Migration

### Recommended Order

1. **Authentication pages** (high visibility)
   - `/auth/sign-in`
   - `/auth/sign-up`
   - `/auth/reset-password`

2. **Main navigation**
   - Header
   - Footer
   - Sidebar

3. **Home page**
   - Hero section
   - Feature sections
   - CTAs

4. **User-facing forms**
   - Profile edit
   - Contact form
   - Job posting

5. **Directory/listings**
   - Search filters
   - Results display
   - Detail pages

6. **Admin panel**
   - Dashboard
   - User management
   - Settings

### Migration Checklist Per File

```markdown
- [ ] Identify all hardcoded text
- [ ] Choose namespace (e.g., "auth.signin")
- [ ] Add keys to messages/en.json
- [ ] Import useTranslations or getTranslations
- [ ] Replace hardcoded text with t() calls
- [ ] Test in browser (English)
- [ ] Run: npm run i18n:fill
- [ ] Test in another language (Spanish)
- [ ] Commit changes
```

---

## 🛠️ Phase 7: Tools & Commands

### Find Hardcoded Text
```bash
npm run i18n:scan
```

### Add New Translation Keys
```bash
npm run i18n:helper
# Select: 1. Add new translation key
```

### Fill Missing Translations
```bash
npm run i18n:fill
```

### Audit Progress
```bash
npm run i18n:audit
```

### Test Locally
```bash
npm run dev
# Visit: http://localhost:3000/es
# (or /fr, /de, etc.)
```

---

## 📊 Phase 8: Tracking Progress

### Create a Spreadsheet

| File | Total Strings | Translated | Status | Owner |
|------|---------------|------------|--------|-------|
| auth/sign-in.tsx | 15 | 15 | ✅ Done | Dev1 |
| auth/sign-up.tsx | 20 | 10 | 🔄 In Progress | Dev2 |
| home/page.tsx | 30 | 0 | ⏳ Todo | - |

### Git Strategy

**Option 1: Feature Branch**
```bash
git checkout -b feat/i18n-migration
# Migrate all files
git commit -m "Add i18n support"
```

**Option 2: Incremental Commits**
```bash
# Per feature/section
git commit -m "Add i18n: auth pages"
git commit -m "Add i18n: navigation"
git commit -m "Add i18n: home page"
```

---

## 🎓 Phase 9: Common Scenarios

### Scenario 1: Component Using Hardcoded Text

**Before:**
```tsx
export function DeleteButton() {
  return (
    <button onClick={handleDelete}>
      Delete Item
    </button>
  );
}
```

**After:**
```tsx
"use client";
import { useTranslations } from "next-intl";

export function DeleteButton() {
  const t = useTranslations("common");

  return (
    <button onClick={handleDelete}>
      {t("delete")}
    </button>
  );
}
```

### Scenario 2: Page with Metadata

**Before:**
```tsx
export const metadata = {
  title: "Sign In | Guide Validator",
  description: "Sign in to your account"
};
```

**After:**
```tsx
import { getTranslations } from "next-intl/server";

export async function generateMetadata({ params }: Props) {
  const t = await getTranslations({ locale: params.locale, namespace: "auth.signin" });

  return {
    title: `${t("metaTitle")} | Guide Validator`,
    description: t("metaDescription")
  };
}
```

### Scenario 3: Form with Validation Messages

**Before:**
```tsx
const errors = {
  required: "This field is required",
  email: "Invalid email address",
  minLength: "Must be at least 8 characters"
};
```

**After:**
```tsx
const t = useTranslations("validation");

const errors = {
  required: t("required"),
  email: t("invalidEmail"),
  minLength: t("minLength", { count: 8 })
};
```

### Scenario 4: Toast Notifications

**Before:**
```tsx
toast.success("Profile updated successfully!");
toast.error("Failed to update profile");
```

**After:**
```tsx
const t = useTranslations("profile.edit");

toast.success(t("successMessage"));
toast.error(t("errorMessage"));
```

---

## 🧪 Phase 10: Testing

### Test Checklist

- [ ] **English works** (baseline)
- [ ] **Spanish works** (test RTL is NOT affected)
- [ ] **Arabic works** (test RTL)
- [ ] **All forms submit** with translated text
- [ ] **Placeholders display** correctly
- [ ] **Buttons are clickable** (not text issues)
- [ ] **Dynamic content** (counts, names) works
- [ ] **Error messages** show translations
- [ ] **Success messages** show translations
- [ ] **Page titles** show translations

### Browser Testing

```bash
# Start dev server
npm run dev

# Test URLs:
http://localhost:3000/en      # English
http://localhost:3000/es      # Spanish
http://localhost:3000/fr      # French
http://localhost:3000/ar      # Arabic (RTL)
http://localhost:3000/ur      # Urdu (RTL)
```

### Automated Testing

```tsx
// Example test
import { screen, render } from "@testing-library/react";
import { IntlProvider } from "next-intl";

test("shows translated text", () => {
  render(
    <IntlProvider locale="es" messages={{ hello: "Hola" }}>
      <MyComponent />
    </IntlProvider>
  );

  expect(screen.getByText("Hola")).toBeInTheDocument();
});
```

---

## 🚨 Phase 11: Common Pitfalls

### Pitfall 1: Forgetting "use client"

**Problem:**
```tsx
// Error: useTranslations only works in client components
export function MyComponent() {
  const t = useTranslations("common");
  return <div>{t("hello")}</div>;
}
```

**Solution:**
```tsx
"use client";  // Add this!

export function MyComponent() {
  const t = useTranslations("common");
  return <div>{t("hello")}</div>;
}
```

### Pitfall 2: Using Server API in Client Component

**Problem:**
```tsx
"use client";
import { getTranslations } from "next-intl/server"; // Wrong!
```

**Solution:**
```tsx
"use client";
import { useTranslations } from "next-intl"; // Correct!
```

### Pitfall 3: Missing Translation Key

**Problem:** App crashes with "MISSING_MESSAGE"

**Solution:**
```bash
# Add missing keys
npm run i18n:fill

# Or add manually to messages/en.json
```

### Pitfall 4: Hardcoded Concatenation

**Bad:**
```tsx
const message = t("welcome") + " " + user.name; // Don't do this!
```

**Good:**
```tsx
const message = t("welcome", { name: user.name });
// messages/en.json: "welcome": "Welcome, {name}!"
```

---

## 📈 Phase 12: Progress Tracking

### Week 1: Setup & Discovery
- [x] Run hardcoded text scan
- [x] Review report
- [x] Prioritize files
- [ ] Create migration spreadsheet

### Week 2: High Priority
- [ ] Migrate authentication pages (15 files)
- [ ] Migrate navigation (3 files)
- [ ] Test in 3 languages

### Week 3: Medium Priority
- [ ] Migrate home page (1 file)
- [ ] Migrate profile pages (10 files)
- [ ] Test in all 11 languages

### Week 4: Low Priority
- [ ] Migrate admin pages (20 files)
- [ ] Migrate error pages (5 files)
- [ ] Final testing

### Week 5: Polish
- [ ] Fix any issues
- [ ] Professional translation review
- [ ] Deploy to production

---

## 🎯 Quick Reference

### Import Statements

```tsx
// Client components
import { useTranslations } from "next-intl";

// Server components (pages, layouts)
import { getTranslations } from "next-intl/server";
```

### Usage

```tsx
// Client
const t = useTranslations("namespace");

// Server
const t = await getTranslations("namespace");

// Use
{t("key")}
{t("keyWithVar", { name: "John" })}
```

### Commands

```bash
npm run i18n:scan      # Find hardcoded text
npm run i18n:helper    # Interactive management
npm run i18n:fill      # Auto-fill missing
npm run i18n:audit     # Check completeness
```

### File Locations

```
messages/en.json               # English translations (base)
components/                    # Components to migrate
app/[locale]/                  # Pages to migrate
hardcoded-text-report.json    # Scan results
```

---

## 💡 Pro Tips

1. **Start small**: Migrate one page completely before moving on
2. **Test frequently**: Check translations after each file
3. **Use common namespace**: Avoid duplicating "Save", "Cancel", etc.
4. **Keep keys descriptive**: Future you will thank you
5. **Document decisions**: Add comments for complex translations
6. **Get native speakers**: For final review
7. **Use context**: `auth.signin.title` better than `signinTitle`
8. **Version control**: Commit translations separately from code
9. **Automate**: Use scripts for repetitive tasks
10. **Celebrate wins**: Track progress and celebrate milestones! 🎉

---

## 📞 Need Help?

- Check `I18N_GUIDE.md` for reference
- Run `npm run i18n:helper` for interactive tools
- Review `hardcoded-text-report.json` for findings
- Test in browser frequently

---

**Happy Translating! 🌍**
