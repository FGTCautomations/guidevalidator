# Testing the Ads System

## Issue: Ads not visible on website

### Possible Causes:

1. **Database migration not applied**
   - The `ads`, `sponsored_listings`, and `ad_clicks` tables don't exist
   - The `select_ad()` RPC function doesn't exist

2. **No active ads in database**
   - Even if tables exist, there are no ads created
   - Or ads exist but are inactive or outside their date range

3. **RLS (Row Level Security) blocking queries**
   - Policies might be too restrictive
   - Anonymous users can't read active ads

### Steps to Debug:

#### Step 1: Verify Database Migration

Go to Supabase Dashboard → SQL Editor and run:

```sql
-- Check if ads table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'ads'
);

-- Check if select_ad function exists
SELECT EXISTS (
  SELECT FROM pg_proc
  WHERE proname = 'select_ad'
);
```

**If both return `false`:**
- The migration hasn't been applied yet
- Copy/paste the entire contents of `supabase/migrations/20250201_ads_system_clean.sql` into SQL Editor and run it

#### Step 2: Check for Active Ads

```sql
-- Check if any ads exist
SELECT COUNT(*) FROM ads;

-- Check active ads
SELECT
  id,
  advertiser_name,
  ad_type,
  placement,
  is_active,
  start_at,
  end_at
FROM ads
WHERE is_active = true
  AND now() BETWEEN start_at AND end_at;
```

**If no ads exist:**
- You need to create test ads via the admin panel at `/en/admin/ads`

#### Step 3: Test RPC Function Directly

```sql
-- Test the select_ad function
SELECT * FROM select_ad('homepage_mid', null, null);
SELECT * FROM select_ad('listings', null, 'guides');
SELECT * FROM select_ad('footer', null, null);
```

**Expected result:**
- If ads exist and match criteria: Returns 1 row with ad data
- If no matching ads: Returns 0 rows (empty result)
- If function doesn't exist: Error message

#### Step 4: Create a Test Ad

If tables exist but no ads, create a test ad in SQL Editor:

```sql
INSERT INTO ads (
  advertiser_name,
  ad_type,
  placement,
  target_url,
  image_url,
  headline,
  description,
  cta_label,
  start_at,
  end_at,
  is_active,
  weight
) VALUES (
  'Test Advertiser',
  'banner',
  ARRAY['homepage_mid'],
  'https://example.com',
  'https://via.placeholder.com/728x90.png?text=Test+Banner',
  'Test Banner Ad',
  'This is a test advertisement',
  'Learn More',
  now() - interval '1 day',  -- Started yesterday
  now() + interval '30 days', -- Ends in 30 days
  true,
  1
);
```

#### Step 5: Check Browser Console

Open browser DevTools (F12) → Console tab and look for:
- Network errors fetching `/api/ads`
- JavaScript errors in ad components
- RPC function errors from Supabase

#### Step 6: Check Server-Side Rendering

The ads use server components, so check terminal output for:
- Supabase connection errors
- RPC function errors
- Authentication issues

### Quick Fix Checklist:

- [ ] Database migration applied (run `20250201_ads_system_clean.sql`)
- [ ] At least one active ad exists in database
- [ ] Ad has correct placement (e.g., `['homepage_mid']`)
- [ ] Ad is within date range (now between start_at and end_at)
- [ ] Ad is active (`is_active = true`)
- [ ] RLS policies allow public to read active ads
- [ ] `select_ad()` function exists and works
- [ ] No errors in browser console
- [ ] No errors in terminal/server logs

### Most Likely Issue:

**The database migration hasn't been applied yet.**

**Solution:**
1. Open Supabase Dashboard
2. Go to SQL Editor
3. Copy entire contents of `supabase/migrations/20250201_ads_system_clean.sql`
4. Paste and click "Run"
5. Create a test ad via admin panel or SQL
6. Refresh the website

### Testing Ad Visibility:

Once migration is applied and ad created, ads should appear:

1. **Homepage**: Between "How It Works" and "Global CTA" sections
2. **Listings**: After 3rd and 10th guide in `/en/directory/guides`
3. **Footer**: Above the site footer on any page

**Remember:** Ads only render when matching ads exist. If no ads match the criteria (placement, date range, active status), nothing is rendered (no empty space).
