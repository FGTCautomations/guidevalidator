# ROOT CAUSE FOUND! 🎯

## Why Materialized View is Empty

The materialized view has a **WHERE clause filter** that only includes guides with:

```sql
WHERE p.application_status = 'approved'
  AND (p.rejection_reason IS NULL OR NOT p.rejection_reason LIKE 'FROZEN:%');
```

**Your imported guides probably have `application_status = 'pending'` or `NULL`**, which means they're being filtered OUT of the directory view!

## The Problem

Located in: [supabase/migrations/20250131_guide_search_optimization_fixed.sql:64-66](supabase/migrations/20250131_guide_search_optimization_fixed.sql#L64-L66)

```sql
CREATE MATERIALIZED VIEW guides_browse_v AS
SELECT
  g.profile_id as id,
  p.full_name as name,
  ...
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
-- 🚨 THIS IS THE PROBLEM:
WHERE p.application_status = 'approved'
  AND (p.rejection_reason IS NULL OR NOT p.rejection_reason LIKE 'FROZEN:%');
```

## Why This Happened

When you imported Vietnamese guides:
1. ✅ Guides were created in `guides` table
2. ✅ Profiles were created in `profiles` table
3. ✅ Join between tables works perfectly
4. ❌ But `application_status` was probably set to `'pending'` or left `NULL`
5. ❌ Materialized view filters them ALL out because they're not 'approved'
6. ❌ Directory shows 0 guides

## The Fix

**Run this SQL script**: [FIX_IMPORTED_GUIDES_STATUS.sql](FIX_IMPORTED_GUIDES_STATUS.sql)

This will:
1. Check current application_status of all guides
2. Update all imported guide profiles to `'approved'`
3. Set `verified = true` and `license_verified = true`
4. Refresh the materialized view
5. Verify guides now appear in directory

### Quick Fix (Copy-Paste into Supabase SQL Editor)

```sql
-- Check current status
SELECT
    p.application_status,
    COUNT(*) as guide_count
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
GROUP BY p.application_status;

-- Approve all imported guide profiles
UPDATE profiles p
SET
    application_status = 'approved',
    application_submitted_at = COALESCE(application_submitted_at, NOW()),
    application_reviewed_at = NOW(),
    verified = true,
    license_verified = true,
    updated_at = NOW()
WHERE p.role = 'guide'
  AND p.id IN (SELECT profile_id FROM guides)
  AND (p.application_status != 'approved' OR p.application_status IS NULL);

-- Refresh materialized view
REFRESH MATERIALIZED VIEW guides_browse_v;

-- Check if it worked
SELECT COUNT(*) as total_guides_in_directory FROM guides_browse_v;
```

**Expected Result**: Last query should show ~25,000 guides ✅

## Why Step 7 Was Showing 0

When you ran:
```sql
REFRESH MATERIALIZED VIEW guides_browse_v;
SELECT COUNT(*) as count_after_refresh FROM guides_browse_v;
```

The refresh DID work! But it refreshed to 0 records because:
- The view's WHERE clause filtered out all non-approved guides
- Your guides aren't approved yet
- Result: Empty view

## After the Fix

Once you approve the guides and refresh:

1. **Directory will work**: Visit `/directory/guides?country=VN` and see guides
2. **Search will work**: Full-text search functionality enabled
3. **Filtering will work**: Country, language, specialty filters
4. **Admin panel already works**: Just needs browser refresh

## Future Import Workflow

When importing guides in the future, make sure to set:
```javascript
application_status: 'approved',
verified: true,
license_verified: true,
application_submitted_at: new Date().toISOString(),
application_reviewed_at: new Date().toISOString()
```

This way they'll immediately appear in the directory.

## Verification After Fix

1. Run the SQL fix script
2. Check count: `SELECT COUNT(*) FROM guides_browse_v;` → Should show ~25,000
3. Visit directory: `http://localhost:3000/directory/guides?country=VN`
4. You should see guides! 🎉

---

## Summary

| Component | Status | Issue | Fix |
|-----------|--------|-------|-----|
| Guides table | ✅ Working | Has 25,000+ guides | None needed |
| Profiles table | ✅ Working | Has matching profiles | None needed |
| Join query | ✅ Working | Returns data correctly | None needed |
| Materialized view | ❌ Empty | Filters out non-approved guides | **Approve guide profiles** |
| Admin panel avatars | ✅ Fixed | Code updated | Restart dev server |
| Admin panel guides | ✅ Fixed | Query updated | Refresh browser |

**Root Cause**: Application status filtering in materialized view WHERE clause
**Solution**: Approve all imported guide profiles
**Script**: [FIX_IMPORTED_GUIDES_STATUS.sql](FIX_IMPORTED_GUIDES_STATUS.sql)
