# Deploy Updated Edge Function

The Edge Function has been updated to use the latest Supabase JS library which fixes the ByteString error with Vietnamese characters.

## Changes Made:
- Updated `supabase/functions/guides-search/index.ts` line 5
- Changed from `@supabase/supabase-js@2.38.4` to `@supabase/supabase-js@2` (latest)

## Option 1: Deploy via Supabase Dashboard (EASIEST)

1. Go to: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/functions

2. Find "guides-search" function and click "Deploy" or "Update"

3. Upload the function code from: `supabase/functions/guides-search/index.ts`

## Option 2: Deploy via CLI (if Docker Desktop is running)

```bash
# Start Docker Desktop first, then run:
npx supabase functions deploy guides-search --project-ref vhqzmunorymtoisijiqb
```

## Option 3: Deploy via Git Push (if linked to GitHub)

```bash
git add supabase/functions/guides-search/index.ts
git commit -m "Fix ByteString error: Update Supabase JS to latest version"
git push
```

If your Supabase project is linked to GitHub with automatic deployments, the Edge Function will redeploy automatically.

## Test After Deployment

Run this command to test the fix:
```bash
node test-edge-function-simple.js
```

Expected result:
- Test 1: ✅ Success (no search query)
- Test 2: ✅ Success (ASCII search)
- Test 3: ✅ Success (Vietnamese search) - **THIS SHOULD NOW WORK!**

## What Was the Problem?

The old version of Supabase JS (v2.38.4) had a bug where Vietnamese characters in RPC parameters caused a ByteString encoding error in the Deno runtime. The latest version fixes this issue.

The database migration was successfully applied, and the RPC function works correctly. The issue was purely in the Edge Function's library version.
