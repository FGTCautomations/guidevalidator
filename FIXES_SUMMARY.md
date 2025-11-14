# Fixes Summary - Guides Directory & Admin Panel

## Issues Found

### 1. **Guides NOT showing in directory**
- **Root Cause**: The `guides_browse_v` materialized view is empty (0 records)
- **Why**: The materialized view hasn't been refreshed since guides were imported
- **Impact**: The guides directory uses a Supabase Edge Function that queries this materialized view

### 2. **Guides NOT showing in Admin/Users panel**
- **Root Cause**: The admin/users page query was trying to select `profiles.email` column which doesn't exist
- **Status**: ✅ **FIXED** - Removed email from the query
- **Verification**: The join query now works correctly (tested: returns 5 guides)

### 3. **Avatar handling for guides**
- **Current Status**: Already implemented correctly
  - Guides table has `avatar_url` column
  - Profiles table has `avatar_url` column
  - Avatar is synced between both tables
- **For profile claiming**: When a guide claims their profile, they can update the avatar through their profile settings

## Fixes Required

### Fix 1: Refresh Materialized View (REQUIRED)

**Run this SQL in Supabase SQL Editor:**

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;
```

Or run the complete diagnostic script: `fix-guides-directory.sql`

**This will:**
1. Populate the materialized view with all ~25,000 guides
2. Make guides appear in the directory immediately
3. Enable all filtering and search functionality

### Fix 2: Admin/Users Panel (ALREADY FIXED)

The following files were updated:
- ✅ `app/[locale]/admin/users/page.tsx` - Removed `email` from profiles query
- ✅ `components/admin/users-manager.tsx` - Removed email display and search

**The admin/users page should now work.** If it doesn't:
1. Hard refresh your browser (Ctrl+Shift+R)
2. Check the page in incognito mode
3. Restart your dev server

## Avatar Handling - How It Works

### Current Implementation ✅

1. **On Import/Creation**:
   - `guides.avatar_url` is populated from import data OR set to NULL
   - `profiles.avatar_url` is synced from guides.avatar_url

2. **On Profile Claim**:
   - Guide claims profile using claim token
   - Profile is linked to their auth account
   - They can now edit their profile settings

3. **On Avatar Update**:
   - Guide goes to profile settings
   - Uploads new avatar image
   - `profiles.avatar_url` is updated
   - Materialized view refresh syncs to `guides_browse_v.avatar_url`

### Code Location for Avatar Updates

The avatar update functionality is typically in:
- Profile settings page: `app/[locale]/dashboard/settings/profile/page.tsx`
- Avatar upload component: Check for avatar/image upload components
- Server action: Look for profile update actions

**Avatar Field Priority:**
1. Use `profiles.avatar_url` if it exists (user has set custom avatar)
2. Fall back to `guides.avatar_url` (imported avatar from original data)
3. Fall back to default placeholder avatar

## Verification Steps

### After running the SQL refresh:

1. **Check materialized view:**
   ```sql
   SELECT COUNT(*) FROM guides_browse_v;
   -- Should return ~25,000
   ```

2. **Check directory:**
   - Visit `/directory/guides?country=VN`
   - Should see list of Vietnamese guides

3. **Check admin panel:**
   - Visit `/admin/users`
   - Click "Guides" tab
   - Should see guides list

4. **Check avatars:**
   - Look at guide cards in directory
   - Avatars should display if `avatar_url` is set
   - Default avatar placeholder if `avatar_url` is NULL

## Additional Notes

### Why Materialized View?

The `guides_browse_v` materialized view is used for performance:
- Precomputes joins between guides, profiles, locations, ratings
- Enables fast full-text search
- Provides pre-aggregated data for filtering

### When to Refresh?

The materialized view should be refreshed:
- After bulk imports (like you just did)
- Periodically (daily) via cron job
- After significant data changes

### Automatic Refresh?

Consider setting up automatic refresh:
```sql
-- Add to cron job or scheduled function
REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;
```

You can use:
- Supabase Edge Function with cron trigger
- pg_cron extension
- External cron job calling Supabase RPC function
