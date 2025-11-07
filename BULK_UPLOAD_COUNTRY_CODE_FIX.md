# Bulk Upload - Country Code Foreign Key Error

## Current Status: 6/7 Success! 🎉

**Working:**
- ✅ 3 out of 4 guides uploaded
- ✅ 1 agency uploaded
- ✅ 1 DMC uploaded
- ✅ 1 transport uploaded

**Failing:**
- ❌ Row 5: test4@12outlook.com

## The Error

```
Profile creation failed: insert or update on table "profiles" violates
foreign key constraint "profiles_country_code_fkey"
```

## Root Cause

The `country_code` field in your Excel file for Row 5 (test4@12outlook.com) contains an **invalid country code** that doesn't exist in the `countries` table.

The `profiles` table has a foreign key constraint:
```sql
ALTER TABLE profiles
  ADD CONSTRAINT profiles_country_code_fkey
  FOREIGN KEY (country_code) REFERENCES countries(code);
```

This means the country code must be a valid 2-letter ISO country code that exists in your `countries` table.

## Solution Options

### Option 1: Fix the Excel File (Recommended) ⭐

Open your Excel file and check Row 5 (test4@12outlook.com) in the "Country Code" column.

**Common mistakes:**
- Empty/null value
- Invalid code (e.g., "UK" instead of "GB")
- Lowercase instead of uppercase
- 3-letter code instead of 2-letter (e.g., "USA" instead of "US")
- Country name instead of code (e.g., "United States" instead of "US")

**Valid examples:**
- US (United States)
- GB (United Kingdom)
- CA (Canada)
- DE (Germany)
- FR (France)
- ES (Spain)
- IT (Italy)
- AU (Australia)

### Option 2: Add Validation to Bulk Upload

We can add country code validation with a helpful error message before attempting to create the profile.

### Option 3: Make Country Code Optional

If country codes are not required for your use case, we can make the field nullable.

## Quick Fix

1. **Check your Excel file, Row 5:**
   - What value is in the "Country Code" column?
   - Change it to a valid 2-letter ISO code (e.g., "US")

2. **Retry the upload**
   - Should succeed with 7/7 records

## To Check Valid Country Codes

Run this query in Supabase SQL Editor:
```sql
SELECT code, name
FROM countries
ORDER BY name;
```

Or create a quick script:
```bash
npx tsx -e "
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const { data } = await client.from('countries').select('code, name').order('name');
console.log('Valid country codes:');
data.forEach(c => console.log(\`  \${c.code} - \${c.name}\`));
"
```

## Prevention: Add Validation

Want to add validation to show a better error message? I can add:

1. **Pre-validation** before upload starts
2. **Country code lookup** to verify it exists
3. **Friendly error messages** like "Invalid country code 'XY' for Row 5. Must be a valid 2-letter ISO code like 'US', 'GB', etc."

Let me know if you want me to add this validation!
