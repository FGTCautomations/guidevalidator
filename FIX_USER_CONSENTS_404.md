# Fix: user_consents 404 Error

## Issue

You're seeing this error in the browser console:
```
vhqzmunorymtoisijiqb.supabase.co/rest/v1/user_consents?select=consent_type%2Cgranted&user_id=eq.54cb0b8d-b3be-40a7-92df-bc725c7d8525:1
Failed to load resource: the server responded with a status of 404
```

## Root Cause

The `user_consents` table doesn't exist in your Supabase database. The migration file exists but hasn't been applied yet.

**Migration File:** [supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql](supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql)

## Why It's Not Breaking Your App

The code has proper error handling (see [app/[locale]/account/privacy/page.tsx:30-41](app/[locale]/account/privacy/page.tsx)):

```typescript
try {
  const { data } = await supabase
    .from("user_consents")
    .select("*")
    .eq("user_id", user.id);
  consents = data || [];
} catch (error) {
  console.warn("user_consents table not available", error);
  // App continues without consents
}
```

So the app works fine, but you see 404 errors in the console.

## Solution Options

### Option 1: Apply the GDPR Migration (Recommended) ⭐

Run the GDPR compliance migration to create all required tables.

**Steps:**

1. **Go to Supabase SQL Editor**
   - Open: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new

2. **Copy and paste the migration**
   - Open file: [supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql](supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql)
   - Copy all contents
   - Paste into SQL Editor

3. **Run the migration**
   - Click "Run"
   - Wait for success message

4. **Refresh your app**
   - The 404 errors should disappear
   - Privacy page will now show consent management

**What this creates:**
- ✅ `user_consents` table - User consent tracking
- ✅ `dsar_requests` table - Data Subject Access Requests
- ✅ `archived_accounts` table - Account archiving
- ✅ `gdpr_audit_log` table - Audit logging
- ✅ Soft delete columns on profiles and agencies
- ✅ Row Level Security policies

### Option 2: Suppress the Error (Quick Fix)

If you don't need GDPR features right now, you can suppress the console error by improving the error handling.

**Modify:** [app/[locale]/account/privacy/page.tsx](app/[locale]/account/privacy/page.tsx)

Change line 33-37 from:
```typescript
const { data } = await supabase
  .from("user_consents")
  .select("*")
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });
```

To:
```typescript
const { data, error } = await supabase
  .from("user_consents")
  .select("consent_type, granted")  // Only select needed fields
  .eq("user_id", user.id)
  .order("created_at", { ascending: false });

if (error && error.code !== 'PGRST116') {  // PGRST116 = table not found
  console.warn("user_consents query error:", error);
}
```

**But this doesn't fix the root cause** - the table still doesn't exist.

### Option 3: Disable Privacy Page (Temporary)

If you don't need the privacy page yet, you can temporarily disable it.

**Modify:** [app/[locale]/account/privacy/page.tsx](app/[locale]/account/privacy/page.tsx)

Add at the top:
```typescript
export default async function PrivacyPage({ params }: PageProps) {
  // Temporarily disabled - GDPR tables not yet migrated
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Privacy Dashboard</h1>
        <p className="text-gray-600">Coming soon...</p>
      </div>
    </div>
  );
}
```

## Recommended Action

**Use Option 1** - Apply the GDPR migration. This:
- ✅ Fixes the 404 error completely
- ✅ Enables GDPR compliance features
- ✅ Provides proper consent management
- ✅ Enables data export/delete requests
- ✅ Future-proofs your application

## Quick Apply Script

I've created a standalone script to apply the migration:

```bash
# Run this to apply GDPR migration
npx tsx scripts/apply-gdpr-migration.ts
```

Or manually in Supabase SQL Editor:
1. Copy: [supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql](supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql)
2. Paste in: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new
3. Click "Run"

## Verify the Fix

After applying the migration:

1. **Check tables exist:**
   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'public'
   AND table_name IN ('user_consents', 'dsar_requests', 'archived_accounts', 'gdpr_audit_log');
   ```

2. **Refresh your app**
   - Open browser DevTools
   - Go to Console tab
   - Refresh the page
   - 404 errors should be gone!

3. **Test Privacy Page**
   - Navigate to `/en/account/privacy`
   - Should load without errors
   - Consent management should work

## What Each Table Does

### user_consents
Tracks user consent for cookies and data processing:
- Functional cookies (required)
- Analytics cookies (optional)
- Marketing cookies (optional)

### dsar_requests
Data Subject Access Requests:
- Export my data
- Delete my data
- Rectify incorrect data
- Restrict processing
- Data portability
- Object to processing

### archived_accounts
Stores archived account data for legal retention requirements.

### gdpr_audit_log
Logs all GDPR-related operations for compliance auditing.

## Summary

**Quick Fix:** Run the GDPR migration in Supabase SQL Editor
**Time:** 2 minutes
**Result:** No more 404 errors + GDPR compliance features enabled! 🎉
