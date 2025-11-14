# CSV to Database Column Mapping

## CSV Headers
stt, name, name (english), type, address, license no, issue date, phone, fax, website, email

## Total: 5,863 agencies to import

## Column Mapping

| CSV Column | Database Column | Storage | Notes |
|------------|----------------|---------|-------|
| `stt` | - | Not stored | Sequential number only |
| `name` | `name` | Direct | Vietnamese company name |
| `name (english)` | `application_data.english_name` | JSONB | English company name |
| `type` | `type` | Direct | Maps to enum (need to check values) |
| `address` | `location_data.headquarters_address` | JSONB | Full Vietnamese address |
| `license no` | `registration_number` | Direct | Government license number |
| `issue date` | `application_data.license_issue_date` | JSONB | Convert DD/MM/YYYY → YYYY-MM-DD |
| `phone` | `contact_phone` | Direct | Primary phone number |
| `fax` | `application_data.fax` | JSONB | Fax number |
| `website` | `website_url` | Direct | Company website |
| `email` | `contact_email` | Direct | Primary contact email |

## Additional Fields Set Automatically

| Field | Value | Reason |
|-------|-------|--------|
| `country_code` | `'VN'` | All agencies are Vietnamese |
| `application_status` | `'approved'` | Pre-approved imports |
| `verified` | `false` | Not claimed yet |
| `featured` | `false` | Default |
| `languages` | `['vi']` | Vietnamese by default |
| `specialties` | `[]` | Empty array |
| `services_offered` | `[]` | Empty array |
| `created_at` | Current timestamp | Import time |
| `updated_at` | Current timestamp | Import time |

## Type Mapping

CSV type values need to map to database enum. Check with:
```sql
SELECT typname, enumlabel FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname LIKE '%agency%';
```

Likely mappings:
- `"International Travel"` → `'travel_agency'`
- `"Domestic Travel"` → `'travel_agency'`
- `"DMC"` → `'dmc'`
- `"Transport"` → `'transport_company'`
