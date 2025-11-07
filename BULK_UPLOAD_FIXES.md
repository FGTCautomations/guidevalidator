# Bulk Upload Fixes - Summary

## Issues Found

### 1. Schema Column Name Mismatch for Agencies/DMCs/Transport
**Error:** `Could not find the 'languages_supported' column of 'agencies' in the schema cache`

**Root Cause:**
- The code was using column name `languages_supported` but the actual database column is named `languages`
- The code was also using column name `website_url` but the actual database column is named `website`
- The code was using `services_offered` which doesn't exist - should map to `specialties` column

**Database Schema (Actual Columns):**
```sql
-- agencies table columns (from migration 20250929150000_profile_segments.sql)
ALTER TABLE public.agencies
  ADD COLUMN IF NOT EXISTS languages text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS specialties text[] NOT NULL DEFAULT '{}';
```

**Fixed in:** [app/api/admin/bulk-upload/route.ts:548-563](app/api/admin/bulk-upload/route.ts#L548-L563)

**Changes Made:**
```typescript
// BEFORE (incorrect):
languages_supported: row.languages_supported ? parseCommaSeparated(row.languages_supported) : [],
website_url: row.website_url || null,
services_offered: row.services_offered ? parseCommaSeparated(row.services_offered) : [],

// AFTER (fixed):
languages: row.languages_supported ? parseCommaSeparated(row.languages_supported) : [],
website: row.website_url || null,
specialties: row.services_offered ? parseCommaSeparated(row.services_offered) : [],
```

### 2. Duplicate Profile Key Constraint for Guides
**Error:** `duplicate key value violates unique constraint "profiles_pkey"`

**Root Cause:**
- Test users were already created in a previous bulk upload attempt
- When retrying the upload, the system tried to create profiles with IDs that already exist
- The auth users exist but something went wrong in the previous attempt

**Solution:**
Two options:

**Option A: Delete the test users first (Recommended)**
1. Run the cleanup script: [cleanup_duplicate_test_users.sql](cleanup_duplicate_test_users.sql)
2. This will remove:
   - test@example.com
   - test2@hotmail.com
   - test3@gmail.com
   - test4@outlook.com
   - contact@travelagency.com
   - contact@dmccompany.com
   - contact@transportco.com

**Option B: Use different email addresses in your Excel file**
- Simply use different emails for testing

### 3. Missing Required Columns in Agencies Table Insert
**Error:** Various schema errors

**Root Cause:**
- The code was trying to insert non-existent columns into the agencies table
- Missing required columns: `verified`, `featured`, `country_code`

**Fixed in:** [app/api/admin/bulk-upload/route.ts:548-563](app/api/admin/bulk-upload/route.ts#L548-L563)

**Complete Fixed Agencies Insert:**
```typescript
const agencyData: any = {
  id: authData.user.id,
  type: role,  // 'agency', 'dmc', or 'transport'
  name: row.name,
  slug: row.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") + "-" + authData.user.id.substring(0, 8),
  country_code: row.country_code.toUpperCase(),
  registration_number: row.registration_number || null,
  vat_id: (role === "agency" && (row as AgencyRow).tax_id) ? (row as AgencyRow).tax_id : null,
  description: row.description || null,
  website: row.website_url || null,  // ✅ Fixed: 'website' not 'website_url'
  logo_url: null,
  verified: false,  // ✅ Added required field
  featured: false,  // ✅ Added required field
  languages: row.languages_supported ? parseCommaSeparated(row.languages_supported) : [],  // ✅ Fixed column name
  specialties: row.services_offered ? parseCommaSeparated(row.services_offered) : [],  // ✅ Fixed column name
  coverage_summary: (role === "dmc" && (row as DMCRow).coverage_summary) ? (row as DMCRow).coverage_summary : null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};
```

## Complete Agencies Table Schema

Based on migrations:

| Column Name | Data Type | NOT NULL | Default | Notes |
|-------------|-----------|----------|---------|-------|
| id | uuid | YES | gen_random_uuid() | Primary Key |
| type | text | YES | | 'agency', 'dmc', 'transport' |
| name | text | YES | | Organization name |
| slug | text | YES | | URL-friendly identifier |
| country_code | char(2) or text | YES | | ISO country code |
| registration_number | text | NO | | Business registration |
| vat_id | text | NO | | VAT ID |
| verified | boolean | YES | false | Admin verified |
| featured | boolean | YES | false | Featured listing |
| created_at | timestamptz | YES | now() | Audit timestamp |
| updated_at | timestamptz | YES | now() | Audit timestamp |
| languages | text[] | YES | '{}' | Language codes array |
| specialties | text[] | YES | '{}' | Specialties array |
| deleted_at | timestamptz | NO | | Soft delete |
| deletion_reason | text | NO | | Deletion reason |
| deletion_requested_at | timestamptz | NO | | Deletion requested |
| description | text | NO | | Description |
| coverage_summary | text | NO | | Geographic coverage |
| logo_url | text | NO | | Logo URL |
| website | text | NO | | Website URL |

## How to Test the Fixes

1. **Clean up test data:**
   ```bash
   # Run this SQL in Supabase SQL Editor:
   # https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new
   ```
   Copy and paste contents of [cleanup_duplicate_test_users.sql](cleanup_duplicate_test_users.sql)

2. **Verify the cleanup:**
   The script will show a count of remaining test users (should be 0)

3. **Retry the bulk upload:**
   - Go to Admin Dashboard → Bulk Upload
   - Upload the same Excel file
   - All records should now upload successfully

## Files Changed

- [app/api/admin/bulk-upload/route.ts](app/api/admin/bulk-upload/route.ts) - Fixed column name mappings
- [cleanup_duplicate_test_users.sql](cleanup_duplicate_test_users.sql) - Created cleanup script

## Summary of Fixes

✅ Fixed `languages_supported` → `languages` column name mismatch
✅ Fixed `website_url` → `website` column name mismatch
✅ Fixed `services_offered` → `specialties` column mapping
✅ Added required fields: `verified`, `featured`, `country_code`
✅ Created SQL cleanup script for duplicate test users
✅ Improved slug generation to avoid conflicts (added user ID prefix)

## Next Steps

1. Run the cleanup SQL script
2. Test the bulk upload with the same Excel file
3. Verify all users are created successfully
4. Check that:
   - Guides have profiles, auth users, and guide records
   - Agencies/DMCs/Transport have agencies records and profiles
   - All languages and specialties are stored correctly
