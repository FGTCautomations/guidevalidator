# Manual Migration Steps (Required)

## Step 1: Apply Database Migration

Since `supabase db push` requires a password, please apply the migration manually:

### Option A: Via Supabase Dashboard (Recommended)
1. **Open SQL Editor**: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new
2. **Copy** the entire contents of: `supabase/migrations/20250131_guide_search_optimization_fixed.sql`
   - ⚠️ **Important**: Use the `_fixed.sql` version (handles schema differences)
3. **Paste** into the SQL editor
4. **Click "Run"** button
5. Wait 30-60 seconds for completion
6. You should see: "Success. No rows returned"

### Option B: Via Supabase CLI (if you have the password)
```bash
# Set the database password when prompted
npx supabase db push
```

### ✅ Verification
After running, verify by executing this in SQL editor:
```sql
-- Should return rows (the guides in your database)
SELECT COUNT(*) FROM guides_browse_v;

-- Should return the function definition
SELECT proname FROM pg_proc WHERE proname = 'api_guides_search';
```

---

## Step 2: Deploy Edge Function

After the migration is applied, deploy the Edge Function:

### Via Supabase CLI
```bash
npx supabase functions deploy guides-search
```

### Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/functions
2. Click "Create a new function"
3. Name it: `guides-search`
4. Copy contents of: `supabase/functions/guides-search/index.ts`
5. Paste and click "Deploy"

---

## Step 3: Test the Endpoint

```bash
# Test with curl (replace YOUR_ANON_KEY with the actual key)
curl "https://vhqzmunorymtoisijiqb.supabase.co/functions/v1/guides-search?country=VN&limit=5" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTc4MzcsImV4cCI6MjA3NDM3MzgzN30.kKcEcFyf0knJ93ktT2k88V_dHOrOeVn7ExNtm-CqekE"
```

Expected response:
```json
{
  "results": [...],
  "facets": {
    "languages": [...],
    "specialties": [...],
    "total": 1234
  },
  "nextCursor": "..."
}
```

---

## Next Steps

Once the migration and edge function are deployed, I'll continue with:
- ✅ Creating Next.js API wrapper
- ✅ Building the new directory page
- ✅ Creating filter components
- ✅ Setting up infinite scroll

**Please apply the migration first, then let me know when it's done!**
