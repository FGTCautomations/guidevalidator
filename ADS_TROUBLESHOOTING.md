# Ads System Troubleshooting Guide

## Current Issue: Ads Not Visible on Website

### Most Likely Cause
**The database migration has NOT been applied yet.**

The ads system requires database tables and functions to be created before it can work. Without these, the system cannot store or retrieve any ads.

---

## ✅ SOLUTION: Apply the Database Migration

### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb
2. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Migration
1. Open the file: `supabase/migrations/20250201_ads_system_clean.sql`
2. Copy the **ENTIRE** file contents (all 230 lines)
3. Paste into the SQL Editor
4. Click the green "Run" button

### Step 3: Verify Migration Success
You should see a message like "Success. No rows returned" or similar.

To verify tables were created, run this query:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('ads', 'sponsored_listings', 'ad_clicks');
```

**Expected result:** 3 rows showing the three tables.

---

## Step 4: Create a Test Ad

After the migration is applied, you need to create at least one ad.

### Option A: Via Admin Panel (Recommended)
1. Navigate to: `http://localhost:3002/en/admin/ads`
2. Click "Create New Ad"
3. Fill in the form:
   - **Advertiser Name**: Test Advertiser
   - **Ad Type**: banner
   - **Placements**: Check "homepage_mid"
   - **Image URL**: `https://via.placeholder.com/728x90.png?text=Test+Banner`
   - **Headline**: Test Banner Ad
   - **Description**: This is a test advertisement
   - **Target URL**: https://example.com
   - **Start Date**: Today's date
   - **End Date**: 30 days from now
   - **Weight**: 1
   - **Active**: ✓ Checked
4. Click "Create Ad"

### Option B: Via SQL (Quick Test)
Run this in Supabase SQL Editor:

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
  ARRAY['homepage_mid', 'footer'],
  'https://example.com',
  'https://via.placeholder.com/728x90.png?text=Test+Banner',
  'Test Banner Ad',
  'This is a test advertisement for homepage',
  'Learn More',
  now() - interval '1 day',
  now() + interval '30 days',
  true,
  1
);
```

---

## Step 5: Verify Ad is Active

Run this query to check your ad:

```sql
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

**Expected result:** You should see your test ad listed.

---

## Step 6: Test the RPC Function

Verify the ad selection function works:

```sql
-- Test homepage placement
SELECT * FROM select_ad('homepage_mid', null, null);

-- Test footer placement
SELECT * FROM select_ad('footer', null, null);

-- Test listings placement
SELECT * FROM select_ad('listings', 'US', 'guides');
```

**Expected result:** Each query should return 1 row with your ad data (if you created an ad for that placement).

---

## Step 7: Check the Website

### Where to Look for Ads:

1. **Homepage (http://localhost:3002/en)**
   - Look between "How It Works" section and "Global CTA" section
   - Should see a banner ad if you created one with `homepage_mid` placement

2. **Footer (any page)**
   - Look just above the site footer
   - Should see an ad if you created one with `footer` placement

3. **Guide Listings (http://localhost:3002/en/directory/guides)**
   - Select a country with guides
   - Look after the 3rd and 10th guide in the list
   - Should see native card ads if you created ads with `listings` placement

---

## Debugging with Server Logs

I've added debug logging to help diagnose issues. Check your terminal where `npm run dev` is running.

You should see logs like:
```
[selectAd] Calling RPC with params: { placement: 'homepage_mid', country: undefined, listContext: undefined }
[selectAd] RPC response: [{ id: 1, advertiser_name: 'Test Advertiser', ... }]
[selectAd] Returning: Ad: Test Advertiser
[AdSlot] placement=homepage_mid, country=undefined, ad= Found: Test Advertiser
```

### If you see:
- **`Error selecting ad: ... function select_ad does not exist`**
  → Migration not applied. Go back to Step 1.

- **`RPC response: []`**
  → No ads match the criteria. Check:
  - Ad has correct placement in array
  - Ad is within date range
  - Ad is active (`is_active = true`)

- **`Error selecting ad: permission denied`**
  → RLS policy issue. Re-run the migration.

---

## Common Issues and Solutions

### Issue 1: "Function select_ad does not exist"
**Solution:** Apply the database migration (see Step 1-2 above)

### Issue 2: No ads showing but no errors
**Solution:** Create an ad (see Step 4 above)

### Issue 3: Admin panel returns 403 Forbidden
**Solution:** Already fixed! Make sure your user has role = 'admin' or 'super_admin' in the profiles table:
```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
```

### Issue 4: Images not loading
**Solution:** Already fixed! `next.config.mjs` now allows external images.

### Issue 5: Ads not showing on specific page
**Check:**
- Ad has the correct placement array for that page
- For listings, ad must have placement containing 'listings'
- For homepage mid, ad must have placement containing 'homepage_mid'
- For footer, ad must have placement containing 'footer'

---

## Testing Checklist

- [ ] Database migration applied successfully
- [ ] `ads` table exists
- [ ] `select_ad` function exists
- [ ] At least one test ad created
- [ ] Test ad is active (`is_active = true`)
- [ ] Test ad is within date range
- [ ] Test ad has correct placement array
- [ ] RPC function returns ad data
- [ ] No errors in browser console
- [ ] No errors in terminal logs
- [ ] Ad visible on website

---

## Need More Help?

### Check Terminal Logs
Look for `[selectAd]` and `[AdSlot]` log messages to see what's happening.

### Check Browser Console (F12)
Look for:
- Network errors
- JavaScript errors
- Red error messages

### Verify Supabase Connection
Run this in SQL Editor:
```sql
SELECT current_database(), current_user;
```
Should return your database name and user.

---

## Summary

The ads system is fully implemented and ready to work. The **only** missing step is:

1. **Apply the database migration** → `20250201_ads_system_clean.sql`
2. **Create a test ad** → Via admin panel or SQL

Once these two steps are complete, ads will appear on the website automatically!
