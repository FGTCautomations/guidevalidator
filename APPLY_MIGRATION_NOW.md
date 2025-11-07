# Apply Directory Search Migration NOW

The RPC functions don't exist because the migration hasn't been applied yet.

## Quick Steps

1. Open this file: supabase/migrations/20250131_directory_search_simple.sql
2. Copy ALL the contents
3. Open Supabase SQL Editor in your dashboard
4. Paste and run the SQL
5. Then run VERIFY_TEST_PROFILES.sql to test everything

## What This Creates

- Materialized views for agencies, DMCs, and transport
- RPC functions: api_agencies_search, api_dmcs_search, api_transport_search
- Indexes for performance

After applying, test at:
- http://localhost:3000/en/directory/agencies?country=VN
- http://localhost:3000/en/directory/dmcs?country=TH
- http://localhost:3000/en/directory/transport?country=PH
