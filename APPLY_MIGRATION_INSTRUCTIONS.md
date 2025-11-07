# Apply GDPR Migration - Step-by-Step Instructions

## 🎯 Goal
Fix the `user_consents` 404 error by creating the missing GDPR tables.

## ✅ Simple 3-Step Process

### Step 1: Open Supabase SQL Editor

Click this link:
👉 **https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new**

### Step 2: Copy and Paste the SQL

**Option A: From the ready-made file**
1. Open file: `READY_TO_PASTE_IN_SUPABASE.sql` (in your project root)
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into Supabase SQL Editor (Ctrl+V)

**Option B: From the migration file**
1. Open file: `supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql`
2. Select all (Ctrl+A)
3. Copy (Ctrl+C)
4. Paste into Supabase SQL Editor (Ctrl+V)

### Step 3: Run the Migration

1. Click the **"Run"** button in Supabase SQL Editor
2. Wait for the green success message
3. Done! ✨

## ✅ Verify It Worked

Run this command to check:
```bash
npx tsx scripts/check-gdpr-tables.ts
```

Should show:
```
✅ user_consents - EXISTS
✅ dsar_requests - EXISTS
✅ archived_accounts - EXISTS
✅ gdpr_audit_log - EXISTS
```

## ✅ Test in Your App

1. Refresh your browser
2. Open DevTools Console (F12)
3. The 404 errors should be gone!
4. Navigate to `/en/account/privacy`
5. Should load without errors

## 🎉 What This Creates

- **user_consents** - User cookie & data consent tracking
- **dsar_requests** - GDPR data export/delete requests
- **archived_accounts** - Account archiving for compliance
- **gdpr_audit_log** - Audit log for GDPR operations
- **Plus:** RLS policies, triggers, and utility functions

## ❓ Troubleshooting

### "Syntax error near..."
- Make sure you copied the ENTIRE file
- Check for any extra characters at start/end
- Try copying again from scratch

### "Already exists" errors
- This is OK! It means some parts already exist
- The migration will skip existing parts
- Just ignore these messages

### Still seeing 404 errors?
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh (Ctrl+F5)
- Check DevTools Console for new errors
- Run verification script: `npx tsx scripts/check-gdpr-tables.ts`

## 📞 Need Help?

Check these files:
- [FIX_USER_CONSENTS_404.md](FIX_USER_CONSENTS_404.md) - Detailed fix guide
- [supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql](supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql) - The migration file

---

**Ready?** Go to Step 1 and open the Supabase SQL Editor! 🚀
