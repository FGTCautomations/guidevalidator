# Apply Directory Segments Migration

## Step 1: Apply SQL Migration

1. Open Supabase Dashboard SQL Editor:
   https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new

2. Open this file in a text editor:
   `c:\Users\PC\Guide-Validator\supabase\migrations\20250131_directory_search_all_segments.sql`

3. Copy the entire contents and paste into the SQL Editor

4. Click **Run**

5. You should see success messages for:
   - Created materialized view `agencies_browse_v`
   - Created materialized view `dmcs_browse_v`
   - Created materialized view `transport_browse_v`
   - Created function `api_agencies_search`
   - Created function `api_dmcs_search`
   - Created function `api_transport_search`

## Step 2: Verify Migration

Run this query to verify:
```sql
SELECT COUNT(*) FROM agencies_browse_v;
SELECT COUNT(*) FROM dmcs_browse_v;
SELECT COUNT(*) FROM transport_browse_v;
```

## Step 3: Tell Claude "migration applied"

Once you see the success message, reply with "migration applied" and Claude will proceed to:
1. Deploy the 3 Edge Functions
2. Create all TypeScript API clients
3. Create all filter components
4. Create all directory pages
5. Test the complete system

## Expected Results

After completion, you'll have:
- `/en/directory/agencies` - with filters for languages, services, niche focus
- `/en/directory/dmcs` - with filters for languages, services, specializations
- `/en/directory/transport` - with filters for languages, service types, fleet types

All with the same performant infinite scroll and cursor pagination as the guides directory!
