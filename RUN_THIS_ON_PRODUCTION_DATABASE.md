# ⚠️ CRITICAL: Run This Migration on Production Database

## 🔍 What's Happening

Your **local database** is working perfectly:
- ✅ 5,863 agencies with `active=true`
- ✅ Materialized view has all agencies
- ✅ Edge Function returns results
- ✅ RPC function works

But your **production website** (guidevalidator.com) is not showing agencies because:
- ❌ The production database still has the OLD materialized view
- ❌ The old view filters by `application_status='approved'` (which returns 0 results)
- ❌ The new view should filter by `active=true` (which returns 5,863 results)

## 📝 What You Need To Do

### Step 1: Open Supabase Production Dashboard
1. Go to https://supabase.com/dashboard
2. Select your **production project** (not local)
3. Click "SQL Editor" in the left sidebar

### Step 2: Run The Migration

Copy and paste this ENTIRE migration into the SQL Editor and click "Run":

```sql
-- ============================================================
-- COMPLETE MIGRATION: Add active field and update directory views
-- ============================================================

-- Step 1: Add active column to agencies table (if not exists)
ALTER TABLE agencies ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT false;

-- Step 2: Create index for active field
CREATE INDEX IF NOT EXISTS idx_agencies_active ON agencies(active);

-- Step 3: Set all Vietnamese agencies to active=true
UPDATE agencies
SET active = true
WHERE country_code = 'VN';

-- Step 4: Copy website_url to website for agencies where website is null
UPDATE agencies
SET website = website_url
WHERE website_url IS NOT NULL
  AND website_url != ''
  AND (website IS NULL OR website = '');

-- Step 5: Drop existing materialized views
DROP MATERIALIZED VIEW IF EXISTS agencies_browse_v CASCADE;
DROP MATERIALIZED VIEW IF EXISTS dmcs_browse_v CASCADE;
DROP MATERIALIZED VIEW IF EXISTS transport_browse_v CASCADE;

-- ============================================================
-- MATERIALIZED VIEW: agencies_browse_v (with active field)
-- ============================================================
CREATE MATERIALIZED VIEW agencies_browse_v AS
SELECT
  a.id,
  a.name,
  a.country_code,
  a.languages,
  a.specialties,
  a.logo_url,
  a.website_url as website,
  a.description,
  a.verified,
  a.featured,
  a.active,
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.review_count, 0) as review_count,
  CASE
    WHEN a.featured AND a.verified THEN 50
    WHEN a.featured THEN 40
    WHEN a.verified THEN 30
    ELSE 20
  END::bigint as sort_key,
  to_tsvector('simple', unaccent(COALESCE(a.name, '') || ' ' || COALESCE(a.description, ''))) as search_text,
  a.created_at,
  a.updated_at
FROM agencies a
LEFT JOIN LATERAL (
  SELECT
    AVG(overall_rating) as avg_overall_rating,
    COUNT(*) as review_count
  FROM reviews r
  WHERE r.reviewee_id = a.id
  AND r.status = 'approved'
) pr ON true
WHERE a.type = 'agency'
  AND a.active = true  -- Changed from application_status = 'approved'
  AND a.deleted_at IS NULL;

-- Create indexes on materialized view
CREATE UNIQUE INDEX agencies_browse_v_id_idx ON agencies_browse_v(id);
CREATE INDEX agencies_browse_v_country_idx ON agencies_browse_v(country_code);
CREATE INDEX agencies_browse_v_sort_idx ON agencies_browse_v(sort_key DESC, name);
CREATE INDEX agencies_browse_v_rating_idx ON agencies_browse_v(rating DESC);
CREATE INDEX agencies_browse_v_search_idx ON agencies_browse_v USING gin(search_text);
CREATE INDEX agencies_browse_v_languages_idx ON agencies_browse_v USING gin(languages);
CREATE INDEX agencies_browse_v_specialties_idx ON agencies_browse_v USING gin(specialties);
CREATE INDEX agencies_browse_v_active_idx ON agencies_browse_v(active);

-- ============================================================
-- MATERIALIZED VIEW: dmcs_browse_v (with active field)
-- ============================================================
CREATE MATERIALIZED VIEW dmcs_browse_v AS
SELECT
  a.id,
  a.name,
  a.country_code,
  a.languages,
  a.specialties,
  a.logo_url,
  a.website_url as website,
  a.description,
  a.verified,
  a.featured,
  a.active,
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.review_count, 0) as review_count,
  CASE
    WHEN a.featured AND a.verified THEN 50
    WHEN a.featured THEN 40
    WHEN a.verified THEN 30
    ELSE 20
  END::bigint as sort_key,
  to_tsvector('simple', unaccent(COALESCE(a.name, '') || ' ' || COALESCE(a.description, ''))) as search_text,
  a.created_at,
  a.updated_at
FROM agencies a
LEFT JOIN LATERAL (
  SELECT
    AVG(overall_rating) as avg_overall_rating,
    COUNT(*) as review_count
  FROM reviews r
  WHERE r.reviewee_id = a.id
  AND r.status = 'approved'
) pr ON true
WHERE a.type = 'dmc'
  AND a.active = true  -- Changed from application_status = 'approved'
  AND a.deleted_at IS NULL;

-- Create indexes on materialized view
CREATE UNIQUE INDEX dmcs_browse_v_id_idx ON dmcs_browse_v(id);
CREATE INDEX dmcs_browse_v_country_idx ON dmcs_browse_v(country_code);
CREATE INDEX dmcs_browse_v_sort_idx ON dmcs_browse_v(sort_key DESC, name);
CREATE INDEX dmcs_browse_v_rating_idx ON dmcs_browse_v(rating DESC);
CREATE INDEX dmcs_browse_v_search_idx ON dmcs_browse_v USING gin(search_text);
CREATE INDEX dmcs_browse_v_languages_idx ON dmcs_browse_v USING gin(languages);
CREATE INDEX dmcs_browse_v_specialties_idx ON dmcs_browse_v USING gin(specialties);
CREATE INDEX dmcs_browse_v_active_idx ON dmcs_browse_v(active);

-- ============================================================
-- MATERIALIZED VIEW: transport_browse_v (with active field)
-- ============================================================
CREATE MATERIALIZED VIEW transport_browse_v AS
SELECT
  a.id,
  a.name,
  a.country_code,
  a.languages,
  COALESCE((a.fleet_data->>'service_types')::text[], ARRAY[]::text[]) as service_types,
  a.logo_url,
  a.website_url as website,
  a.description,
  a.verified,
  a.featured,
  a.active,
  COALESCE(pr.avg_overall_rating, 0) as rating,
  COALESCE(pr.review_count, 0) as review_count,
  CASE
    WHEN a.featured AND a.verified THEN 50
    WHEN a.featured THEN 40
    WHEN a.verified THEN 30
    ELSE 20
  END::bigint as sort_key,
  to_tsvector('simple', unaccent(COALESCE(a.name, '') || ' ' || COALESCE(a.description, ''))) as search_text,
  a.created_at,
  a.updated_at
FROM agencies a
LEFT JOIN LATERAL (
  SELECT
    AVG(overall_rating) as avg_overall_rating,
    COUNT(*) as review_count
  FROM reviews r
  WHERE r.reviewee_id = a.id
  AND r.status = 'approved'
) pr ON true
WHERE a.type = 'transport'
  AND a.active = true  -- Changed from application_status = 'approved'
  AND a.deleted_at IS NULL;

-- Create indexes on materialized view
CREATE UNIQUE INDEX transport_browse_v_id_idx ON transport_browse_v(id);
CREATE INDEX transport_browse_v_country_idx ON transport_browse_v(country_code);
CREATE INDEX transport_browse_v_sort_idx ON transport_browse_v(sort_key DESC, name);
CREATE INDEX transport_browse_v_rating_idx ON transport_browse_v(rating DESC);
CREATE INDEX transport_browse_v_search_idx ON transport_browse_v USING gin(search_text);
CREATE INDEX transport_browse_v_languages_idx ON transport_browse_v USING gin(languages);
CREATE INDEX transport_browse_v_service_types_idx ON transport_browse_v USING gin(service_types);
CREATE INDEX transport_browse_v_active_idx ON transport_browse_v(active);

-- ============================================================
-- GRANT SELECT PERMISSIONS
-- ============================================================
GRANT SELECT ON agencies_browse_v TO anon, authenticated;
GRANT SELECT ON dmcs_browse_v TO anon, authenticated;
GRANT SELECT ON transport_browse_v TO anon, authenticated;

-- ============================================================
-- REFRESH FUNCTIONS (for future use)
-- ============================================================
CREATE OR REPLACE FUNCTION refresh_agencies_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY agencies_browse_v;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION refresh_dmcs_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY dmcs_browse_v;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION refresh_transport_view()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY transport_browse_v;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- VERIFICATION QUERIES
-- ============================================================
DO $$
DECLARE
  v_agencies_count int;
  v_dmcs_count int;
  v_transport_count int;
BEGIN
  -- Count records in each view
  SELECT COUNT(*) INTO v_agencies_count FROM agencies_browse_v WHERE country_code = 'VN';
  SELECT COUNT(*) INTO v_dmcs_count FROM dmcs_browse_v WHERE country_code = 'VN';
  SELECT COUNT(*) INTO v_transport_count FROM transport_browse_v WHERE country_code = 'VN';

  RAISE NOTICE '';
  RAISE NOTICE '✅ MIGRATION COMPLETED SUCCESSFULLY!';
  RAISE NOTICE '';
  RAISE NOTICE 'Summary:';
  RAISE NOTICE '  - Added active column to agencies table';
  RAISE NOTICE '  - Set % Vietnamese agencies to active=true', v_agencies_count;
  RAISE NOTICE '  - Normalized website fields';
  RAISE NOTICE '  - Recreated all materialized views with active filter';
  RAISE NOTICE '';
  RAISE NOTICE 'Directory Counts (Vietnam):';
  RAISE NOTICE '  - Agencies: %', v_agencies_count;
  RAISE NOTICE '  - DMCs: %', v_dmcs_count;
  RAISE NOTICE '  - Transport: %', v_transport_count;
  RAISE NOTICE '';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '  1. Visit https://www.guidevalidator.com/directory/agencies?country=VN';
  RAISE NOTICE '  2. Hard refresh browser (Ctrl+Shift+R)';
  RAISE NOTICE '  3. Wait 5 minutes for Edge Function cache to clear';
  RAISE NOTICE '';
END $$;
```

### Step 3: Verify It Worked

After running the migration, run this verification query:

```sql
-- Check the result
SELECT COUNT(*) as total_agencies
FROM agencies_browse_v
WHERE country_code = 'VN';

-- Should return: 5863
```

### Step 4: Wait and Test

1. **Wait 5 minutes** for the Edge Function cache to clear
2. **Hard refresh** your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
3. Visit: https://www.guidevalidator.com/directory/agencies?country=VN
4. You should now see 5,863 agencies!

---

## ✅ Other Fixes Included

### Ads Update Fixed
The ads update error is also fixed. After deploying the code changes:
- Creating ads with directory selector will work
- Updating ads with directory selector will work

### Search Button Added
The "Search All Accounts" button has been added to the main admin dashboard.

---

## 📋 Quick Checklist

- [ ] Run SQL migration in Supabase production dashboard
- [ ] Verify query returns 5863 agencies
- [ ] Wait 5 minutes for cache
- [ ] Hard refresh browser
- [ ] Test directory at https://www.guidevalidator.com/directory/agencies?country=VN
- [ ] Deploy latest code changes for ads fix
- [ ] Test ads creation/update
- [ ] Check search button on admin dashboard

---

## 🆘 Still Not Working?

If after running the migration and waiting 5 minutes you still don't see agencies:

1. Open browser console (F12)
2. Go to Network tab
3. Visit the directory page
4. Look for the request to `/functions/v1/agencies-search`
5. Check the response
6. Share any errors you see

The backend is 100% working locally, so if the production database has the migration applied, it should work!
