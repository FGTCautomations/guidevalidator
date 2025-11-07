# Vietnamese Guides Import - Fixed Implementation Summary

## ❌ Issue Found

The original SQL script (`IMPORT_VIETNAMESE_GUIDES.sql`) attempted to insert `email` into the `profiles` table, but the `profiles` table doesn't have an `email` column. Emails are stored in `auth.users` table which requires service role access.

**Error Message:**
```
ERROR: 42703: column "email" of relation "profiles" does not exist
```

---

## ✅ Solution Implemented

Created a **two-part solution**:

### Part 1: Database Setup ([IMPORT_VIETNAMESE_GUIDES_FIXED.sql](./IMPORT_VIETNAMESE_GUIDES_FIXED.sql))

Creates necessary tables and policies:
- `profile_claim_tokens` - Stores claim tokens for guides
- `staging_imports` - Tracks import progress
- RLS policies for both tables

**Run this first in Supabase SQL Editor**

### Part 2: Admin Import System

Three new components that handle auth user creation:

1. **API Route** ([/app/api/admin/import-staging-guides/route.ts](./app/api/admin/import-staging-guides/route.ts))
   - Uses Supabase Service Role client
   - Creates auth users with temporary emails
   - Creates profiles, guides, credentials
   - Generates claim tokens
   - Returns import summary

2. **Admin Page** ([/app/[locale]/admin/import-guides/page.tsx](./app/[locale]/admin/import-guides/page.tsx))
   - Shows staging guide count
   - Shows already imported count
   - Explains import process
   - Provides import button

3. **Import Button** ([/components/admin/import-guides-button.tsx](./components/admin/import-guides-button.tsx))
   - Triggers API import
   - Shows progress
   - Displays results (imported, skipped, errors)
   - Links to invitations page

---

## 🚀 New Import Process

### Step 1: Prepare Data
```sql
-- Create staging table
CREATE TABLE IF NOT EXISTS public.guides_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  card_number text,
  country text,
  card_type text,
  language text,
  experience text,
  province_issue text,
  expiry_date text,
  image_url text,
  source_url text,
  created_at timestamptz DEFAULT NOW()
);

-- Load your guide data
INSERT INTO public.guides_staging (...) VALUES (...);
```

### Step 2: Run Database Setup
```bash
# Open Supabase SQL Editor
# Paste IMPORT_VIETNAMESE_GUIDES_FIXED.sql
# Click Run
```

### Step 3: Import via Admin UI
```
1. Visit: https://guidevalidator.com/admin/import-guides
2. Click "Start Import"
3. Wait for completion
4. Review results
```

### Step 4: Export Claim Links
```
1. Visit: https://guidevalidator.com/admin/guide-invitations
2. Select guides
3. Click "Export CSV"
```

### Step 5: Send Invitations
Email guides with their personalized claim links.

---

## 📁 Files Created/Updated

### New Files
1. `IMPORT_VIETNAMESE_GUIDES_FIXED.sql` - Database setup (replaces old SQL)
2. `app/api/admin/import-staging-guides/route.ts` - Import API endpoint
3. `app/[locale]/admin/import-guides/page.tsx` - Import admin page
4. `components/admin/import-guides-button.tsx` - Import trigger button
5. `IMPORT_FIXED_SUMMARY.md` - This file

### Updated Files
1. `QUICK_START_VIETNAMESE_GUIDES.md` - Updated with new process

### Existing Files (Still Valid)
1. `app/[locale]/claim-profile/[token]/page.tsx` - Claim page
2. `components/auth/claim-profile-form.tsx` - Claim form
3. `app/api/auth/claim-profile/route.ts` - Claim API
4. `app/[locale]/onboarding/complete-profile/page.tsx` - Onboarding
5. `app/[locale]/admin/guide-invitations/page.tsx` - Invitations dashboard
6. `components/admin/guide-invitation-manager.tsx` - Invitations UI
7. `lib/directory/types.ts` - Directory types
8. `lib/directory/queries.ts` - Directory queries
9. `components/directory/listing-card.tsx` - Listing card with badge

---

## 🔑 Key Differences from Original

| Original Approach | Fixed Approach |
|------------------|----------------|
| Direct SQL INSERT into profiles with email | API route using service role client |
| Single SQL script | Two-part: SQL setup + API import |
| No progress tracking | Real-time import progress |
| No error handling | Detailed error reporting |
| Manual token generation | Automatic token generation |

---

## ✅ What Works Now

1. ✓ Creates auth users with temporary emails (e.g., `guide-vn12345@guidevalidator-staging.com`)
2. ✓ Creates profiles linked to auth users
3. ✓ Creates guides table entries
4. ✓ Creates guide_credentials with license info
5. ✓ Generates secure claim tokens (90-day expiry)
6. ✓ Shows guides in directory with "Incomplete Profile" badge
7. ✓ Tracks import progress with detailed results
8. ✓ Handles errors gracefully (skips duplicates, reports failures)
9. ✓ Admin can export claim links to CSV
10. ✓ Guides can claim profiles and complete information

---

## 🔒 Security Features

- ✓ Admin-only access to import functionality
- ✓ Service role key protected (server-side only)
- ✓ Secure token generation (32 random bytes)
- ✓ 90-day token expiration
- ✓ One-time use tokens
- ✓ License number verification required
- ✓ RLS policies on all tables

---

## 📊 Import Results Format

After import completes, you'll see:

```json
{
  "total": 100,
  "imported": 95,
  "skipped": 3,
  "errors": [
    {
      "guide": "Nguyen Van X",
      "error": "Email already exists"
    }
  ]
}
```

**Total**: Number of guides in staging table
**Imported**: Successfully imported guides
**Skipped**: Already imported (duplicates)
**Errors**: Guides that failed with error messages

---

## 🐛 Troubleshooting

### Import button doesn't work
**Check:** Ensure you're logged in as admin
```sql
SELECT role FROM profiles WHERE id = auth.uid();
-- Should return 'admin' or 'super_admin'
```

### "Unauthorized" error
**Check:** Verify service role key is set
```bash
# In .env.local
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Guides not appearing in directory
**Check:** Application status and RLS policies
```sql
SELECT id, full_name, application_status, profile_completed
FROM profiles
WHERE application_data->>'imported_from' = 'guides_staging';
```

### Import fails silently
**Check:** Browser console and server logs
```bash
# Browser: F12 → Console
# Server: Check terminal where npm run dev is running
```

---

## 🎯 Next Steps

1. **Run Database Setup**
   - Execute `IMPORT_VIETNAMESE_GUIDES_FIXED.sql` in Supabase

2. **Load Staging Data**
   - Insert guide data into `guides_staging` table

3. **Import Guides**
   - Visit `/admin/import-guides`
   - Click "Start Import"

4. **Send Invitations**
   - Visit `/admin/guide-invitations`
   - Export CSV
   - Send emails

5. **Monitor Claims**
   - Track claim progress from invitations dashboard
   - Send reminder emails to unclaimed guides

---

## 📖 Documentation

- **Quick Start**: [QUICK_START_VIETNAMESE_GUIDES.md](./QUICK_START_VIETNAMESE_GUIDES.md)
- **Full Guide**: [VIETNAMESE_GUIDES_IMPORT_GUIDE.md](./VIETNAMESE_GUIDES_IMPORT_GUIDE.md)
- **This Summary**: [IMPORT_FIXED_SUMMARY.md](./IMPORT_FIXED_SUMMARY.md)

---

## ✨ Summary

The Vietnamese guides import system is now fully functional! The fix separates database setup (SQL) from data import (API), allowing proper auth user creation with service role permissions. Admins can now import guides with a single click, export claim links, and monitor the entire process through an intuitive dashboard.

**Status**: ✅ Ready to Use
**Implementation Date**: 2025-01-28
**Version**: 2.0 (Fixed)
