# Vietnamese Guides Import & Invitation System

## Overview

This system allows you to import Vietnamese guide data from a staging table (`guides_staging`) and invite them to claim their profiles on Guide Validator. Imported guides will appear in the directory with an "Incomplete Profile" badge until they claim and complete their profiles.

---

## Implementation Complete ✓

All components have been created and are ready to use:

1. **SQL Migration** - Imports guides from staging table
2. **Claim Profile Pages** - Allows guides to claim their imported profiles
3. **Onboarding Flow** - Guides complete their profiles after claiming
4. **Directory Display** - Shows incomplete profiles with badges
5. **Admin Dashboard** - Manages invitations and exports claim links

---

## Step-by-Step Guide

### Step 1: Prepare Your Staging Table

Ensure your `guides_staging` table exists in Supabase with the following columns:

```sql
CREATE TABLE IF NOT EXISTS public.guides_staging (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text,                  -- Guide's full name
  country text,               -- Country (e.g., "Vietnam")
  card_number text,           -- License number (REQUIRED for import)
  expiry_date text,           -- License expiry date
  province_issue text,        -- Issuing province/authority
  card_type text,             -- Type of license
  language text,              -- Languages spoken (comma-separated)
  experience text,            -- Years of experience or description
  image_url text,             -- Profile photo URL
  source_url text,            -- Original profile URL
  created_at timestamptz DEFAULT NOW()
);
```

**Important**: The `card_number` field is **required** for each guide to be imported.

### Step 2: Import Data to Staging Table

Load your Vietnamese guide data into the `guides_staging` table. Example:

```sql
INSERT INTO public.guides_staging (
  name, country, card_number, expiry_date, province_issue,
  card_type, language, experience, image_url, source_url
) VALUES
  ('Nguyen Van A', 'Vietnam', 'VN12345', '2026-12-31', 'Hanoi',
   'Tour Guide License', 'Vietnamese, English', '5 years',
   'https://example.com/photo1.jpg', 'https://example.com/profile1'),
  ('Tran Thi B', 'Vietnam', 'VN67890', '2025-06-30', 'Ho Chi Minh',
   'Tour Guide License', 'Vietnamese, English, French', '10 years',
   'https://example.com/photo2.jpg', 'https://example.com/profile2');
```

### Step 3: Run the Import Migration

Open Supabase SQL Editor and run the migration:

**File**: [IMPORT_VIETNAMESE_GUIDES.sql](./IMPORT_VIETNAMESE_GUIDES.sql)

```bash
# Navigate to: https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new
# Copy and paste the contents of IMPORT_VIETNAMESE_GUIDES.sql
# Click "Run"
```

**What this does:**
- Creates profiles for each guide with `application_status = 'approved'`
- Creates guides table entries with basic info
- Creates guide_credentials entries with license information
- Generates secure claim tokens (valid for 90 days)
- Marks profiles as incomplete (low `profile_completion_percentage`)

**Verify the import:**
```sql
-- Check import summary
SELECT
  (SELECT COUNT(*) FROM guides_staging WHERE card_number IS NOT NULL) as staging_count,
  (SELECT COUNT(*) FROM profiles WHERE application_data->>'imported_from' = 'guides_staging') as imported_profiles,
  (SELECT COUNT(*) FROM profile_claim_tokens WHERE profile_id IN (
    SELECT id FROM profiles WHERE application_data->>'imported_from' = 'guides_staging'
  )) as generated_tokens;
```

### Step 4: Access the Admin Dashboard

Navigate to the admin dashboard to manage invitations:

**URL**: `https://guidevalidator.com/en/admin/guide-invitations`

**Features:**
- View all imported guides
- Filter by: All, Unclaimed, Claimed
- Select guides and export claim links to CSV
- Copy claim links to clipboard
- View statistics (Total, Unclaimed, Claimed, Expired)
- See profile completion percentage for each guide

### Step 5: Export Claim Links

1. Go to [/admin/guide-invitations](/en/admin/guide-invitations)
2. Filter guides (e.g., "Unclaimed" to see guides who haven't claimed yet)
3. Select guides using checkboxes
4. Click **"Export CSV"** to download invitation data

**CSV Format:**
```
Guide Name,License Number,Claim Link,Languages,Status,Expires
"Nguyen Van A","VN12345","https://guidevalidator.com/claim-profile/ABC123...","Vietnamese; English","Unclaimed","2025-03-15"
```

### Step 6: Send Invitation Emails

Use the exported CSV to send personalized emails. Here's a template:

**Subject**: Claim Your Guide Profile on Guide Validator

```
Dear [Guide Name],

We've created a professional profile for you on Guide Validator, a platform that connects licensed tour guides with travel agencies and DMCs worldwide.

Your License Number: [License Number]

Claim Your Profile: [Claim Link]

This link will expire in 90 days. Once you claim your profile, you can:
• Complete your professional profile
• Get discovered by travel agencies and DMCs
• Receive booking requests directly
• Manage your availability calendar
• Build your reputation with reviews

To claim your profile:
1. Click the link above
2. Verify your identity with your license number
3. Create your account (email + password)
4. Complete your profile information

If you have any questions, please contact us at support@guidevalidator.com

Best regards,
Guide Validator Team
```

**Sending Options:**
- **Manual**: Use your email client with mail merge
- **Automated**: Use email service (SendGrid, Mailgun, etc.) with CSV import
- **Bulk**: Use the admin dashboard's "Copy Links" feature for quick sharing

---

## How Guides Claim Their Profiles

### Guide Experience

1. **Receive invitation email** with their unique claim link
2. **Click the claim link**: `https://guidevalidator.com/claim-profile/{token}`
3. **Verify identity**: Enter their license number (shown in email)
4. **Create account**: Provide email and password
5. **Complete profile**: Fill in missing information
6. **Go live**: Profile becomes fully visible in directory

### Claim Page Features

- ✓ Two-step verification (license number + account creation)
- ✓ Secure token validation (expires after 90 days)
- ✓ One-time use tokens (can't be claimed twice)
- ✓ Clear error messages for expired/claimed links
- ✓ Pre-filled profile information from staging data

---

## Directory Display

### Before Claiming (Incomplete Profile)

Guides appear in the directory with:
- **Orange badge**: "Incomplete Profile (30%)"
- Basic information from staging data
- Limited profile visibility
- Placeholder email (not shown publicly)

### After Claiming & Completing

- Badge removed when `profile_completion_percentage >= 100`
- Full profile information visible
- Real contact email for booking requests
- Enhanced search visibility

---

## Admin Features

### Admin Dashboard ([/admin/guide-invitations](/en/admin/guide-invitations))

**Statistics Cards:**
- Total Imported Guides
- Unclaimed Guides (pending invitation)
- Claimed Guides (successfully onboarded)
- Expired Tokens (need new invitations)

**Guide Management:**
- Filter by status (All, Unclaimed, Claimed)
- Bulk select guides
- Export claim links to CSV
- Copy links to clipboard
- View profile completion progress
- See individual claim status

**Actions:**
- Export selected guides to CSV
- Copy claim links for bulk sharing
- Monitor claim progress
- Track profile completion

---

## Database Schema

### New Tables Created

**`profile_claim_tokens`**
```sql
id                uuid PRIMARY KEY
profile_id        uuid REFERENCES profiles(id)
license_number    text NOT NULL
token             text UNIQUE NOT NULL
expires_at        timestamptz NOT NULL (90 days from creation)
claimed_at        timestamptz (NULL until claimed)
claimed_by        uuid REFERENCES auth.users(id)
created_at        timestamptz
updated_at        timestamptz
```

**RLS Policies:**
- Public can SELECT unclaimed, non-expired tokens
- Only admins can INSERT/UPDATE/DELETE

### Modified Tables

**`profiles`** - Added fields (already exist):
- `profile_completed`: boolean
- `profile_completion_percentage`: integer (0-100)
- `required_fields_missing`: jsonb array
- `application_data`: jsonb (stores staging data)

**`guides`** - Uses existing structure

**`guide_credentials`** - Uses existing structure

---

## File Reference

### Created Files

1. **SQL Migration**
   - `IMPORT_VIETNAMESE_GUIDES.sql` - Main import script

2. **Claim Profile Pages**
   - `app/[locale]/claim-profile/[token]/page.tsx` - Token validation & claim page
   - `components/auth/claim-profile-form.tsx` - Claim form component
   - `app/api/auth/claim-profile/route.ts` - API endpoint for claiming

3. **Onboarding**
   - `app/[locale]/onboarding/complete-profile/page.tsx` - Updated with claimed profile support

4. **Admin Tools**
   - `app/[locale]/admin/guide-invitations/page.tsx` - Admin dashboard page
   - `components/admin/guide-invitation-manager.tsx` - Invitation management UI

5. **Directory Updates**
   - `lib/directory/types.ts` - Added profile completion fields
   - `lib/directory/queries.ts` - Fetch profile completion data
   - `components/directory/listing-card.tsx` - Display incomplete profile badge

---

## Troubleshooting

### Issue: Guides not appearing in directory after import

**Check:**
```sql
-- Verify guides were imported
SELECT COUNT(*) FROM profiles
WHERE application_data->>'imported_from' = 'guides_staging';

-- Verify application_status is 'approved'
SELECT id, full_name, application_status
FROM profiles
WHERE application_data->>'imported_from' = 'guides_staging';

-- Check if guides table entries exist
SELECT COUNT(*) FROM guides
WHERE profile_id IN (
  SELECT id FROM profiles
  WHERE application_data->>'imported_from' = 'guides_staging'
);
```

**Solution:**
- Ensure `application_status = 'approved'` for all imported profiles
- Verify guides table has corresponding entries
- Check RLS policies allow public SELECT on approved profiles

### Issue: Claim link shows "Expired" or "Already Claimed"

**Check:**
```sql
-- Find claim token status
SELECT
  pct.*,
  p.full_name,
  p.email
FROM profile_claim_tokens pct
JOIN profiles p ON pct.profile_id = p.id
WHERE pct.token = 'YOUR_TOKEN_HERE';
```

**Solutions:**
- **Expired**: Generate new token (run import script again for specific guide)
- **Already Claimed**: Guide has already claimed profile, they should sign in

### Issue: Profile completion badge not showing

**Check:**
```sql
-- Verify profile completion data
SELECT
  id,
  full_name,
  profile_completed,
  profile_completion_percentage
FROM profiles
WHERE application_data->>'imported_from' = 'guides_staging';
```

**Solution:**
- Ensure `profile_completion_percentage < 100`
- Verify directory queries fetch these fields
- Clear browser cache and refresh

### Issue: Admin dashboard not accessible

**Check:**
```sql
-- Verify your role
SELECT id, role FROM profiles WHERE id = auth.uid();
```

**Solution:**
- Ensure your role is `'admin'` or `'super_admin'`
- Sign out and sign in again
- Contact super admin to update your role

---

## Security Considerations

### Token Security
- ✓ Tokens are cryptographically secure (32 random bytes, base64 encoded)
- ✓ Tokens expire after 90 days
- ✓ One-time use (marked as claimed after use)
- ✓ Requires license number verification

### RLS Policies
- ✓ Public can only see unclaimed, non-expired tokens
- ✓ Only admins can manage tokens
- ✓ Guides can only access their own profiles after claiming

### Data Privacy
- ✓ Temporary staging emails (`guide-{license}@guidevalidator-staging.com`)
- ✓ Real emails only added after claiming
- ✓ Old staging profile deleted after successful claim
- ✓ License numbers stored securely in `guide_credentials`

---

## Maintenance

### Regular Tasks

**Every 7 days:**
- Check unclaimed guide count
- Send reminder emails to unclaimed guides

**Every 30 days:**
- Review expired tokens
- Generate new tokens for high-priority guides
- Archive unclaimed profiles older than 90 days

**Every 90 days:**
- Clean up expired tokens:
```sql
DELETE FROM profile_claim_tokens
WHERE expires_at < NOW()
  AND claimed_at IS NULL;
```

- Archive/delete unclaimed profiles:
```sql
DELETE FROM profiles
WHERE application_data->>'imported_from' = 'guides_staging'
  AND profile_completed = false
  AND created_at < NOW() - INTERVAL '90 days';
```

---

## Future Enhancements

### Potential Features
1. **Email Integration**: Automated invitation emails from admin dashboard
2. **SMS Notifications**: Send claim links via SMS
3. **Multi-language Support**: Invitation emails in Vietnamese
4. **Token Regeneration**: Regenerate expired tokens from admin dashboard
5. **Bulk Import UI**: Upload CSV directly through admin interface
6. **Progress Tracking**: Email notifications on profile completion milestones
7. **Reminder System**: Automated reminders for unclaimed profiles

---

## Support

For issues or questions:
- **Documentation**: This file
- **SQL Script**: [IMPORT_VIETNAMESE_GUIDES.sql](./IMPORT_VIETNAMESE_GUIDES.sql)
- **Admin Dashboard**: `/admin/guide-invitations`
- **Contact**: support@guidevalidator.com

---

## Quick Reference Commands

```sql
-- View all imported guides
SELECT * FROM profiles
WHERE application_data->>'imported_from' = 'guides_staging';

-- View unclaimed tokens
SELECT * FROM profile_claim_tokens
WHERE claimed_at IS NULL AND expires_at > NOW();

-- Count by status
SELECT
  COUNT(*) FILTER (WHERE claimed_at IS NULL AND expires_at > NOW()) as unclaimed,
  COUNT(*) FILTER (WHERE claimed_at IS NOT NULL) as claimed,
  COUNT(*) FILTER (WHERE claimed_at IS NULL AND expires_at <= NOW()) as expired
FROM profile_claim_tokens;

-- Generate new token for specific guide (if expired)
INSERT INTO profile_claim_tokens (profile_id, license_number, token, expires_at)
SELECT
  p.id,
  gc.license_number,
  encode(gen_random_bytes(32), 'base64'),
  NOW() + INTERVAL '90 days'
FROM profiles p
JOIN guide_credentials gc ON gc.guide_id = p.id
WHERE p.full_name = 'Guide Name Here'
  AND p.application_data->>'imported_from' = 'guides_staging';
```

---

**Implementation Date**: 2025-01-28
**Version**: 1.0
**Status**: ✓ Complete and Ready to Use
