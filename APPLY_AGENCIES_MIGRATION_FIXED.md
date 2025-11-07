# Apply Agencies Search Migration - CORRECTED VERSION

## What Was Wrong Before

The previous migration was trying to query from a `profiles` table join, but the actual database structure has:
- **One `agencies` table** with all agency/DMC/transport data
- A `type` column that distinguishes between 'agency', 'dmc', and 'transport'
- All data is self-contained in the agencies table (no profile join needed)

## Current Data

Your database already has:
- **7 agencies** (type='agency')
- **5 DMCs** (type='dmc')
- **4 transport** (type='transport')

## Step 1: Apply the CORRECTED SQL Migration

1. Open Supabase Dashboard SQL Editor:
   https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new

2. Open this file:
   `c:\Users\PC\Guide-Validator\supabase\migrations\20250131_agencies_search_correct.sql`

3. Copy the entire contents and paste into the SQL Editor

4. Click **Run**

5. You should see success messages with the counts:
   ```
   ✅ Agencies, DMCs, and Transport search system created successfully!
   ```

## Step 2: Verify the Migration

Run this in SQL Editor to verify:

```sql
-- Check row counts
SELECT 'agencies_browse_v' as view, COUNT(*) as count FROM agencies_browse_v
UNION ALL
SELECT 'dmcs_browse_v', COUNT(*) FROM dmcs_browse_v
UNION ALL
SELECT 'transport_browse_v', COUNT(*) FROM transport_browse_v;

-- View sample data
SELECT id, name, country_code, array_length(languages, 1) as lang_count
FROM agencies_browse_v
LIMIT 3;

SELECT id, name, country_code, array_length(languages, 1) as lang_count
FROM dmcs_browse_v
LIMIT 3;

SELECT id, name, country_code, array_length(service_types, 1) as service_count
FROM transport_browse_v
LIMIT 3;

-- Test the RPC functions
SELECT jsonb_pretty(api_agencies_search(
  p_country := 'US',
  p_limit := 5
));

SELECT jsonb_pretty(api_dmcs_search(
  p_country := 'FR',
  p_limit := 5
));

SELECT jsonb_pretty(api_transport_search(
  p_country := 'FR',
  p_limit := 5
));
```

## Expected Results

After running the verification queries, you should see:
- `agencies_browse_v`: 7 rows
- `dmcs_browse_v`: 5 rows
- `transport_browse_v`: 4 rows

The RPC functions should return JSON with:
- `results` array with agency/DMC/transport data
- `facets` object with language and specialty/service type counts
- `nextCursor` for pagination (if more than p_limit results)

## Step 3: Reply "migration applied and verified"

Once you see the expected results, reply with "migration applied and verified" and I will:
1. Redeploy the Edge Functions (they're already deployed but may need to be refreshed)
2. Rebuild the frontend
3. Test that the directories display your existing data

## What This Fixes

This corrected migration:
- ✅ Queries from the actual `agencies` table structure
- ✅ Uses the `type` column to filter agencies/DMCs/transport
- ✅ Doesn't try to join with profiles table
- ✅ Uses columns that actually exist (name, country_code, languages, specialties, etc.)
- ✅ Will display your existing 7 agencies, 5 DMCs, and 4 transport companies
