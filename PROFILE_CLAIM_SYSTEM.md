# Profile Claim System Setup

## What Was Changed

### 1. UI Update - Show "Unclaimed" Badge
**File**: [components/admin/users-manager.tsx:254-258](components/admin/users-manager.tsx#L254-L258)

Added an amber badge that shows when a guide profile hasn't been claimed:
```tsx
{!profile.verified && !profile.license_verified && (
  <span className="px-2 py-1 text-xs rounded bg-amber-50 text-amber-700 border border-amber-300">
    ⚠ Profile Not Claimed
  </span>
)}
```

**Now you'll see**:
- 🟡 **"⚠ Profile Not Claimed"** - For imported guides who haven't claimed their profile yet
- 🔵 **"✓ Verified"** - For guides who have claimed and verified their profile
- 🟣 **"✓ License"** - For guides whose license has been verified

### 2. Generate Claim Tokens
**Script**: [generate-claim-tokens.sql](generate-claim-tokens.sql)

This creates a unique claim token for each guide based on their license number.

## How the Claim System Works

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Import (Current State)                            │
├─────────────────────────────────────────────────────────────┤
│ ✅ guides table: 25,743 records                            │
│ ✅ profiles table: 25,743 profiles (all approved)          │
│ ✅ Claim tokens: Generated with license_number             │
│ Status: application_status='approved', verified=false      │
│ UI Shows: 🟡 "⚠ Profile Not Claimed"                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Guide Claims Profile                              │
├─────────────────────────────────────────────────────────────┤
│ 1. Guide visits claim URL with token                       │
│ 2. Guide verifies identity with license number             │
│ 3. Guide creates account (auth.users entry)                │
│ 4. System links profile to auth user                       │
│ 5. System updates:                                         │
│    - profile_claim_tokens.claimed_at = NOW()               │
│    - profiles.verified = true                              │
│    - profiles.license_verified = true                      │
│ UI Shows: 🔵 "✓ Verified" + 🟣 "✓ License"               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Guide Customizes Profile                          │
├─────────────────────────────────────────────────────────────┤
│ Guide can now:                                             │
│ - Update avatar (uploads to profiles.avatar_url)           │
│ - Edit headline, bio, specialties                          │
│ - Set hourly rate                                          │
│ - Update availability                                       │
│ - Manage bookings                                          │
└─────────────────────────────────────────────────────────────┘
```

## Setup Instructions

### Step 1: Generate Claim Tokens

Run [generate-claim-tokens.sql](generate-claim-tokens.sql) in Supabase SQL Editor.

**Expected output**:
```sql
total_tokens_created: 25743
status: 'Unclaimed', count: 25743
```

### Step 2: Restart Dev Server

```bash
npm run dev
```

### Step 3: Verify UI Shows "Unclaimed" Badge

1. Visit: `http://localhost:3000/admin/users`
2. Click **"Guides"** tab
3. You should see: 🟡 **"⚠ Profile Not Claimed"** on all guide cards

### Step 4: Test Claim Flow (Optional)

To test the claim system, you'll need to:
1. Get a sample claim token from Step 8 of the SQL script
2. Create a claim page UI (if not exists): `/claim-profile/[token]`
3. Test the full flow

## Database Schema Reference

### profile_claim_tokens Table

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Primary key |
| profile_id | uuid | References profiles(id) |
| license_number | text | Guide's license number |
| token | text | Unique claim token (base64) |
| expires_at | timestamptz | Token expiry (1 year) |
| claimed_at | timestamptz | When claimed (NULL = unclaimed) |
| claimed_by | uuid | References auth.users(id) |

### Claim URL Format

```
https://your-domain.com/claim-profile/{token}
```

Example:
```
https://guide-validator.com/claim-profile/a3B9...xYz==
```

## Query Examples

### Find unclaimed profiles
```sql
SELECT
    p.full_name,
    g.license_number,
    pct.token,
    pct.expires_at
FROM profile_claim_tokens pct
JOIN profiles p ON p.id = pct.profile_id
JOIN guides g ON g.profile_id = p.id
WHERE pct.claimed_at IS NULL
ORDER BY pct.created_at DESC
LIMIT 10;
```

### Check claim status for a license number
```sql
SELECT
    pct.license_number,
    pct.token,
    pct.claimed_at,
    p.verified,
    p.full_name
FROM profile_claim_tokens pct
JOIN profiles p ON p.id = pct.profile_id
WHERE pct.license_number = 'LICENSE-12345';
```

### Mark a profile as claimed (manual)
```sql
UPDATE profile_claim_tokens
SET
    claimed_at = NOW(),
    claimed_by = 'USER_AUTH_ID_HERE'::uuid
WHERE token = 'TOKEN_HERE';

UPDATE profiles
SET
    verified = true,
    license_verified = true
WHERE id = (
    SELECT profile_id
    FROM profile_claim_tokens
    WHERE token = 'TOKEN_HERE'
);
```

## Next Steps

After generating tokens, you can:

1. **Send claim emails** to guides with their unique claim URLs
2. **Create claim page UI** at `/claim-profile/[token]`
3. **Build verification flow**:
   - Guide enters license number to verify identity
   - Guide creates account
   - System links profile to auth user
4. **Update profiles on claim**:
   - Set `verified = true`
   - Set `claimed_at = NOW()`
   - Link to auth.users

## Badge States Summary

| Status | Badge | Meaning |
|--------|-------|---------|
| Imported, not claimed | 🟡 "⚠ Profile Not Claimed" | Guide exists but hasn't claimed |
| Claimed & verified | 🔵 "✓ Verified" | Guide has claimed profile |
| License verified | 🟣 "✓ License" | License has been verified |
| Approved | 🟢 "approved" | Shows in public directory |

---

**All set! Run the SQL script to generate tokens, then restart your dev server.**
