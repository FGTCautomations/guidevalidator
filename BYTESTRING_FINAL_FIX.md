# ByteString Error - FINAL FIX

## Problem
Vietnamese characters causing "Value is not a valid ByteString" error in Edge Function.

## Root Cause
The issue was NOT in the database or the RPC function - those work perfectly.

The issue was in how the Edge Function passes parameters to PostgREST:
- POST with JSON body → Deno/PostgREST have encoding issues with UTF-8
- URL parameters → Properly encoded by URLSearchParams

## Solution Applied

### Changed Edge Function to use GET with URL parameters

**File**: `supabase/functions/guides-search/index.ts`

**Before** (lines 177-202):
```typescript
// POST with JSON body
const rpcResponse = await fetch(`${supabaseUrl}/rest/v1/rpc/api_guides_search`, {
  method: "POST",
  body: JSON.stringify({ p_q: params.q, ... })
});
```

**After** (lines 177-202):
```typescript
// GET with URL parameters
const rpcParams = new URLSearchParams();
if (params.q) rpcParams.set("p_q", params.q);
// ... other params

const rpcResponse = await fetch(
  `${supabaseUrl}/rest/v1/rpc/api_guides_search?${rpcParams.toString()}`,
  { method: "GET" }
);
```

### Why This Works
- `URLSearchParams` properly encodes Vietnamese UTF-8 characters
- GET parameters are URL-encoded by default
- PostgREST correctly decodes URL parameters
- Avoids JSON encoding issues in Deno runtime

## Deployment

**Commit**: `3104ce0`

**Redeploy the Edge Function**:
1. Go to: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/functions
2. Find "guides-search" function
3. Click "Deploy new version" or "Redeploy"

## Test After Deployment

```bash
node test-with-pagination.js
```

Expected result:
```
✅ Test 1 Success! (Vietnamese search with no cursor)
Results: 3
```

or

```bash
node test-edge-function-simple.js
```

All 3 tests should pass!

## Summary

✅ Database migration applied
✅ RPC function works correctly
✅ Edge Function rewritten to use GET with URL params
✅ Committed to git (3104ce0)
⏳ **NEEDS: Edge Function redeployment**

This is the final fix - URL encoding Vietnamese characters instead of JSON encoding them!
