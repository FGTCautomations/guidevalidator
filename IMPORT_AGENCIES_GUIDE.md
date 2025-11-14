# Import Agencies Guide

## Overview
Import 5,863 Vietnamese travel agencies from CSV into the database.

## Files Created
1. **[import-agencies.js](import-agencies.js)** - Import script
2. **[COLUMN_MAPPING.md](COLUMN_MAPPING.md)** - Column mapping documentation
3. **[check-agency-types.sql](check-agency-types.sql)** - Check enum values

## Step-by-Step Instructions

### Step 1: Check Agency Type Enum Values

**Run**: [check-agency-types.sql](check-agency-types.sql)

```sql
SELECT t.typname as enum_name, e.enumlabel as enum_value
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%agency%' OR t.typname LIKE '%segment%'
ORDER BY t.typname, e.enumsortorder;
```

**Share the results** so I can update the TYPE_MAPPING in the import script.

### Step 2: Update Type Mapping (if needed)

Based on Step 1 results, I may need to update the TYPE_MAPPING in [import-agencies.js](import-agencies.js):

```javascript
const TYPE_MAPPING = {
  'International Travel': 'travel_agency', // ← Update based on enum
  'Domestic Travel': 'travel_agency',
  'DMC': 'dmc',
  'Transport': 'transport_company'
};
```

### Step 3: Run the Import Script

```bash
node import-agencies.js
```

**Expected output**:
```
🚀 Starting agency import...

📋 CSV Headers: [...
]
📊 Total rows: 5863

✅ Imported 100 agencies...
✅ Imported 200 agencies...
...
✅ Imported 5800 agencies...

==================================================
📊 IMPORT SUMMARY
==================================================
✅ Successfully imported: 5863
❌ Errors: 0

🎉 Import complete!
```

### Step 4: Verify Import

```sql
-- Count imported agencies
SELECT COUNT(*) as total_agencies FROM agencies;

-- Check by type
SELECT type, COUNT(*) as count
FROM agencies
GROUP BY type;

-- Check application status
SELECT application_status, verified, COUNT(*)
FROM agencies
GROUP BY application_status, verified;

-- Sample agencies
SELECT
    name,
    registration_number,
    contact_email,
    contact_phone,
    application_data->>'english_name' as english_name
FROM agencies
LIMIT 10;
```

### Step 5: Create Claim Tokens (Like Guides)

After import, create claim tokens so agencies can claim their profiles:

```sql
-- Create tokens table for agencies if needed
CREATE TABLE IF NOT EXISTS agency_claim_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agency_id uuid NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
  registration_number text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL DEFAULT (NOW() + INTERVAL '1 year'),
  claimed_at timestamptz,
  claimed_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT NOW(),
  updated_at timestamptz DEFAULT NOW()
);

-- Generate tokens for all agencies
INSERT INTO agency_claim_tokens (
  agency_id,
  registration_number,
  token,
  expires_at
)
SELECT
  id,
  registration_number,
  encode(gen_random_bytes(32), 'base64'),
  NOW() + INTERVAL '1 year'
FROM agencies
WHERE registration_number IS NOT NULL;
```

## Data Handling

### Vietnamese Character Encoding
- ✅ Script reads CSV with UTF-8 encoding
- ✅ Handles Vietnamese characters properly (Công ty, Hà Nội, etc.)

### Date Format Conversion
- CSV: `22/04/2013` (DD/MM/YYYY)
- Database: `2013-04-22` (YYYY-MM-DD)

### Phone Number Cleaning
- Removes extra spaces
- Keeps format: `(024) 3556 5709`

### Website URL Normalization
- Adds `https://` if missing
- Converts to lowercase

## Column Mapping Summary

| CSV | Database | Example |
|-----|----------|---------|
| name | name | "Công ty TNHH Quốc Tế S.H.I.N W.A.L.L" |
| name (english) | application_data.english_name | "SHIN WALL INTERNATIONAL COMPANY LIMITED" |
| type | type | "International Travel" → 'travel_agency' |
| address | location_data.headquarters_address | "SỐ NHÀ 6, NGÕ 109 QUAN NHÂN" |
| license no | registration_number | "01-053/2022/TCDL-GP LHQT" |
| issue date | application_data.license_issue_date | "22/04/2013" → "2013-04-22" |
| phone | contact_phone | "(024) 3556 5709" |
| fax | application_data.fax | "" |
| website | website_url | "www.shinwall.com.vn" → "https://www.shinwall.com.vn" |
| email | contact_email | "shin-wall@shinwall.com.vn" |

## Troubleshooting

### Error: "type enum value not allowed"
**Solution**: Check Step 1 results and update TYPE_MAPPING in the script.

### Error: "profile creation failed"
**Solution**: Check if `role: 'travel_agency'` is valid. May need to use 'agency' or 'company'.

### Error: "duplicate key value"
**Solution**: Some agencies may already exist. Add duplicate check or use UPSERT.

### Error: encoding issues
**Solution**: Verify CSV is saved as UTF-8. Re-export from Excel/Google Sheets as UTF-8 CSV.

## After Import

1. ✅ All 5,863 agencies imported
2. ✅ Profiles created for each agency
3. ✅ Set to `application_status = 'approved'`
4. ✅ Set to `verified = false` (unclaimed)
5. ⏳ Generate claim tokens
6. ⏳ Add "Unclaimed" badge to agency UI (like guides)
7. ⏳ Build agency claim flow

## Next Steps

- Check directory to see if agencies appear
- Add agencies to admin panel
- Create agency claim page
- Send claim emails to agencies
