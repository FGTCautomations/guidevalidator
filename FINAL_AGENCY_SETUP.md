# Final Agency Setup - Complete

## ✅ What's Been Done

### 1. Import Script Updated
- [import-agencies.js](import-agencies.js) - Sets `application_status = 'pending'` for future imports
- Successfully imported 5,863 agencies (3 minor errors)

### 2. Admin UI Enhanced
- [components/admin/users-manager.tsx](components/admin/users-manager.tsx) - Updated to show:
  - ✅ **"Profile Not Claimed" badge** for unverified agencies
  - ✅ **English Name** from `application_data`
  - ✅ **License Issue Date** from `application_data`
  - ✅ **Fax** from `application_data`
  - ✅ **Headquarters Address** from `location_data`
  - ✅ **Import Source & Date** metadata

## ⏳ Final Steps Needed

### Step 1: Fix Application Status (SQL)

Run this in Supabase SQL Editor:

```sql
UPDATE agencies
SET
    application_status = 'pending',
    verified = false,
    updated_at = NOW()
WHERE application_status = 'approved'
  AND country_code = 'VN';

-- Verify
SELECT application_status, COUNT(*) FROM agencies GROUP BY application_status;
```

### Step 2: Verify in Admin Panel

1. Restart dev server: `npm run dev`
2. Go to: `http://localhost:3000/admin/users`
3. Click **"Agencies"** tab
4. You should see:
   - 🟡 **"⚠ Profile Not Claimed"** badge on all agencies
   - 🟢 **"pending"** status
   - Click "Show More Details" to see:
     - English name
     - License issue date
     - Fax number
     - Headquarters address
     - Import metadata

## 📊 Current Data Status

| Field | Status | Location |
|-------|--------|----------|
| Vietnamese Name | ✅ Imported | `agencies.name` |
| English Name | ✅ Imported | `application_data.english_name` |
| Type | ✅ Imported | `agencies.type` (agency/dmc/transport) |
| Registration Number | ✅ Imported | `agencies.registration_number` |
| Email | ✅ Imported | `agencies.contact_email` |
| Phone | ✅ Imported | `agencies.contact_phone` |
| Website | ⚠️ Partial | `agencies.website_url` (some may be missing) |
| Address | ✅ Imported | `location_data.headquarters_address` |
| License Issue Date | ✅ Imported | `application_data.license_issue_date` |
| Fax | ✅ Imported | `application_data.fax` |

## 🔄 Admin Workflow

### Reviewing Agency Applications

1. Admin goes to `/admin/users` → **Agencies** tab
2. Sees all agencies with **"pending"** status
3. Clicks **"Show More Details"** on an agency
4. Reviews all information:
   - Company details (Vietnamese & English names)
   - Contact info (email, phone, fax)
   - Registration details
   - Address
   - License information
5. Can approve or reject:
   - **Approve** → Sets `application_status = 'approved'`, `verified = true`
   - **Reject** → Sets `application_status = 'rejected'`, adds rejection reason

### Agency Claiming Flow (Future)

Similar to guides:
1. Create `agency_claim_tokens` table
2. Generate tokens using `registration_number`
3. Send claim emails to agencies
4. Agency claims via `/claim-agency/[token]`
5. After claiming: `verified = true`, can edit profile

## 📋 Import Errors

Only 3 agencies had issues (out of 5,863):
- Row 24: "Công ty TNHH Thương mại và Du lịch Anh Việt"
- Row 2967: "CÔNG TY TNHH DV THƯƠNG MẠI GREEN ADVENTURE"
- Row 5411: "CÔNG TY CỔ PHẦN NAM QUỐC GROUP" (Cloudflare error)

**99.95% success rate!** ✅

## 🎯 What You Can Do Now

1. ✅ **Review applications** in admin panel
2. ✅ **Approve/reject** agencies
3. ✅ **See all import data** (English names, addresses, etc.)
4. ⏳ **Add edit functionality** (future enhancement)
5. ⏳ **Build claim system** (future enhancement)

---

**Run the SQL query to set status to 'pending', then restart your dev server to see all the updates!**
