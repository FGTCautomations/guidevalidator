# Agency Import Fixes Summary

## Issues & Solutions

### ✅ Issue 1: Application Status Should Be Pending
**Problem**: Agencies were imported as `'approved'`, but should be `'pending'` for review.

**Fix**:
1. **Update existing agencies**: Run [fix-agencies-status.sql](fix-agencies-status.sql)
2. **Updated import script**: [import-agencies.js](import-agencies.js) now uses `'pending'`

```sql
-- Fix existing agencies
UPDATE agencies
SET application_status = 'pending', verified = false
WHERE application_status = 'approved' AND country_code = 'VN';
```

### ✅ Issue 2: Missing Website URLs
**Problem**: Website URLs weren't saved during import.

**Fix**: Run [update-agencies-data.js](update-agencies-data.js) to add missing websites.

```bash
node update-agencies-data.js
```

### ✅ Issue 3: Missing English Names
**Problem**: English names weren't saved in `application_data`.

**Fix**: Same script as Issue 2 - [update-agencies-data.js](update-agencies-data.js) adds both websites and English names.

---

## Quick Fix Steps

### Step 1: Fix Application Status
```bash
# Run in Supabase SQL Editor
```
Use [fix-agencies-status.sql](fix-agencies-status.sql)

### Step 2: Add Missing Data
```bash
node update-agencies-data.js
```

---

## Issue 4: Admin UI - Show Application Data

**Requirement**: In user management, show all application form data and make it editable.

### Current State
- Agency data is stored in `application_data` JSONB field
- Contains: `english_name`, `license_issue_date`, `fax`, `import_source`

### What Needs to Change

#### 1. Display Application Data in Admin Panel
File: [components/admin/users-manager.tsx](components/admin/users-manager.tsx)

Need to show:
- **English Name**: `application_data->>'english_name'`
- **License Issue Date**: `application_data->>'license_issue_date'`
- **Fax**: `application_data->>'fax'`
- **Address**: `location_data->>'headquarters_address'`

#### 2. Make Fields Editable
Add edit functionality to:
- Name (Vietnamese & English)
- Contact info (email, phone, fax)
- Website
- Registration number
- Address
- License issue date

#### 3. Application Review Workflow
When admin reviews an application:
- Can edit all fields
- Can approve → sets `application_status = 'approved'`, `verified = true`
- Can reject → sets `application_status = 'rejected'`, adds `rejection_reason`

---

## Data Structure Reference

### Agencies Table Columns
```
- id (uuid)
- name (text) - Vietnamese name
- type (enum: 'agency', 'dmc', 'transport')
- registration_number (text) - License number
- contact_email (text)
- contact_phone (text)
- website_url (text)
- application_status ('pending', 'approved', 'rejected')
- verified (boolean)
- application_data (jsonb) - Contains:
  - english_name
  - license_issue_date
  - fax
  - import_source
  - imported_at
- location_data (jsonb) - Contains:
  - headquarters_address
```

---

## Next Steps

1. ✅ **Run fix-agencies-status.sql** - Change status to pending
2. ✅ **Run update-agencies-data.js** - Add websites & English names
3. ⏳ **Update Admin UI** - Show and edit application data
4. ⏳ **Add Application Review Flow** - Approve/reject workflow
5. ⏳ **Add "Unclaimed" Badge** - Like guides system

---

## Admin UI Changes Needed

### Component: `components/admin/users-manager.tsx`

#### Show Application Data
```tsx
// In agency card display
<div className="grid grid-cols-2 gap-3">
  <div>
    <span className="text-sm text-gray-600">English Name:</span>
    <p>{agency.application_data?.english_name || 'N/A'}</p>
  </div>
  <div>
    <span className="text-sm text-gray-600">License Issue Date:</span>
    <p>{agency.application_data?.license_issue_date || 'N/A'}</p>
  </div>
  <div>
    <span className="text-sm text-gray-600">Fax:</span>
    <p>{agency.application_data?.fax || 'N/A'}</p>
  </div>
  <div>
    <span className="text-sm text-gray-600">Address:</span>
    <p>{agency.location_data?.headquarters_address || 'N/A'}</p>
  </div>
</div>
```

#### Edit Modal
Create an edit modal that allows updating:
- All text fields
- JSONB fields (application_data, location_data)
- Status (pending → approved/rejected)

---

## Claim System for Agencies

Similar to guides, agencies should be able to claim their profiles:

1. **Create agency_claim_tokens table** (if doesn't exist)
2. **Generate tokens** for all agencies using `registration_number`
3. **Add "Unclaimed" badge** to admin UI
4. **Build claim flow** at `/claim-agency/[token]`

See [PROFILE_CLAIM_SYSTEM.md](PROFILE_CLAIM_SYSTEM.md) for reference (same flow as guides).

---

## Summary

| Task | Status | Command/File |
|------|--------|--------------|
| Fix application status | ⏳ To do | `fix-agencies-status.sql` |
| Add websites & English names | ⏳ To do | `node update-agencies-data.js` |
| Update admin UI to show data | ⏳ To do | Manual update needed |
| Add edit functionality | ⏳ To do | Manual update needed |
| Add claim system | ⏳ To do | Similar to guides |
