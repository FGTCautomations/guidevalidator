# Quick Start: Vietnamese Guides Import

## 🚀 5-Minute Setup

### 1. Prepare Your Data

Load Vietnamese guide data into `public.guides_staging` table:

```sql
-- Create staging table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.guides_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,
  card_number text,
  country text,
  card_type text,
  language text,
  experience text,
  province_issue text,
  expiry_date text,
  image_url text,
  source_url text,
  created_at timestamptz DEFAULT NOW()
);

-- Insert your guide data
INSERT INTO public.guides_staging (
  name,           -- Guide full name
  card_number,    -- License number (REQUIRED)
  country,        -- "Vietnam"
  card_type,      -- "Tour Guide License"
  language,       -- "Vietnamese, English" (comma-separated)
  experience,     -- "5 years" or description
  province_issue, -- "Hanoi" or issuing authority
  expiry_date,    -- "2026-12-31"
  image_url,      -- Profile photo URL
  source_url      -- Original profile URL
) VALUES
  ('Nguyen Van A', 'VN12345', 'Vietnam', 'Tour Guide License',
   'Vietnamese, English', '5 years', 'Hanoi', '2026-12-31',
   'https://example.com/photo.jpg', 'https://example.com/profile');
```

### 2. Run Database Setup

Open Supabase SQL Editor → Paste `IMPORT_VIETNAMESE_GUIDES_FIXED.sql` → Run

**Supabase Dashboard**: `https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new`

This creates necessary tables (profile_claim_tokens, staging_imports) and RLS policies.

### 3. Run Import via Admin UI

1. Visit: `/admin/import-guides`
2. Review import summary
3. Click "Start Import"
4. Wait for completion

### 4. Export Claim Links

1. Visit: `/admin/guide-invitations`
2. Select guides
3. Click "Export CSV"

### 5. Send Invitations

Email guides with their claim links:

```
Subject: Claim Your Guide Profile on Guide Validator

Dear [Name],

Claim your profile: https://guidevalidator.com/claim-profile/[TOKEN]
Your License Number: [LICENSE]

Link expires in 90 days.
```

### 6. Guides Claim Profiles

1. Click claim link
2. Enter license number
3. Create account
4. Complete profile

---

## 🔧 Alternative: Import via SQL (Advanced)

If you prefer to use the API route directly with cURL or Postman:

```bash
# Get your session token from browser (Developer Tools → Application → Cookies)
export TOKEN="your-supabase-session-token"

curl -X POST https://guidevalidator.com/api/admin/import-staging-guides \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

---

## 📊 What Happens

### Immediately After Import
- ✓ Guides appear in directory
- ✓ Orange "Incomplete Profile" badge shown
- ✓ Claim tokens generated (90-day expiry)
- ✓ Basic info from staging data displayed

### After Guide Claims & Completes
- ✓ Badge removed
- ✓ Full profile information visible
- ✓ Real email for booking requests
- ✓ Enhanced search visibility

---

## 🎯 Admin Dashboard

**URL**: `/admin/guide-invitations`

**Features**:
- View all imported guides
- Filter: All, Unclaimed, Claimed
- Export claim links (CSV)
- Copy links to clipboard
- Monitor profile completion

---

## 📁 Files Created

1. `IMPORT_VIETNAMESE_GUIDES.sql` - Import script
2. `app/[locale]/claim-profile/[token]/page.tsx` - Claim page
3. `components/auth/claim-profile-form.tsx` - Claim form
4. `app/api/auth/claim-profile/route.ts` - Claim API
5. `app/[locale]/admin/guide-invitations/page.tsx` - Admin dashboard
6. `components/admin/guide-invitation-manager.tsx` - Admin UI

---

## ✅ Verification

```sql
-- Check import success
SELECT
  (SELECT COUNT(*) FROM guides_staging WHERE card_number IS NOT NULL) as staging_count,
  (SELECT COUNT(*) FROM profiles WHERE application_data->>'imported_from' = 'guides_staging') as imported_count,
  (SELECT COUNT(*) FROM profile_claim_tokens WHERE expires_at > NOW() AND claimed_at IS NULL) as active_tokens;
```

---

## 🔧 Common Commands

```sql
-- View unclaimed guides
SELECT p.full_name, pct.token, pct.license_number
FROM profiles p
JOIN profile_claim_tokens pct ON pct.profile_id = p.id
WHERE pct.claimed_at IS NULL AND pct.expires_at > NOW();

-- Count by status
SELECT
  COUNT(*) FILTER (WHERE pct.claimed_at IS NULL) as unclaimed,
  COUNT(*) FILTER (WHERE pct.claimed_at IS NOT NULL) as claimed
FROM profile_claim_tokens pct;

-- Regenerate token for specific guide
INSERT INTO profile_claim_tokens (profile_id, license_number, token, expires_at)
VALUES (
  'PROFILE_ID_HERE',
  'LICENSE_NUMBER_HERE',
  encode(gen_random_bytes(32), 'base64'),
  NOW() + INTERVAL '90 days'
);
```

---

## 📖 Full Documentation

See `VIETNAMESE_GUIDES_IMPORT_GUIDE.md` for complete details.

---

**Ready to Start?** → Run `IMPORT_VIETNAMESE_GUIDES.sql` in Supabase SQL Editor
