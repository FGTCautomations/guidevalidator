# Apply Fixed GDPR Migration

## Problem Identified

The existing `dsar_requests` table was created WITHOUT the `user_id` column, causing the original migration to fail with error:

```
ERROR: 42703: column "user_id" does not exist
```

## Solution

The fixed migration file (`FIXED_GDPR_MIGRATION.sql`) will:

1. **Drop the incomplete `dsar_requests` table**
2. **Recreate it with the correct schema** (including `user_id` column)
3. **Create all other GDPR tables** (user_consents, archived_accounts, gdpr_audit_log)
4. **Set up all RLS policies, triggers, and functions**

## How to Apply (3 Simple Steps)

### Step 1: Open Supabase SQL Editor

Click this link:
👉 **https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new**

### Step 2: Copy the Fixed Migration

Open the file: `FIXED_GDPR_MIGRATION.sql` (in your project root)
- Select all (Ctrl+A)
- Copy (Ctrl+C)
- Paste into Supabase SQL Editor (Ctrl+V)

### Step 3: Run It

1. Click the **"Run"** button
2. Wait for the green success message
3. Done! ✨

## Verify It Worked

Run this command:
```bash
npx tsx scripts/check-gdpr-tables.ts
```

Expected output:
```
✅ user_consents - EXISTS
✅ dsar_requests - EXISTS
✅ archived_accounts - EXISTS
✅ gdpr_audit_log - EXISTS
```

## What Changed from Original Migration?

The fixed migration:
- ✅ Drops the incomplete `dsar_requests` table first using `DROP TABLE IF EXISTS ... CASCADE`
- ✅ Adds `DROP POLICY IF EXISTS` before creating policies (prevents "already exists" errors)
- ✅ Adds `DROP TRIGGER IF EXISTS` before creating triggers (prevents conflicts)
- ✅ Everything else is identical to the original migration

## Test Your App

1. Refresh your browser
2. Open DevTools Console (F12)
3. The `user_consents 404` error should be **GONE** ✨
4. Navigate to `/en/account/privacy`
5. Should load without errors

---

**Ready?** Open the SQL Editor and run the fixed migration! 🚀
