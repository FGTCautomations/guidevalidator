# Phase 4: Completion Guide

## ✅ COMPLETED (60% of Phase 4)

### 1. Admin Applications Page ✅
**File**: `app/[locale]/admin/applications/page.tsx`
- Queries `guides` table with `profiles.application_status='pending'`
- Queries `agencies` table with `application_status='pending'` and appropriate `type`
- Admin can now view pending applications from consolidated tables

### 2. Directory Listings ✅
**File**: `lib/directory/queries.ts`
- Guide directory: Filters by `profiles.application_status='approved'`
- Agency/DMC/Transport directories: Filter by `application_status='approved'`
- Only approved profiles show in public directories

### 3. Guide Sign-Up Form ✅
**File**: `app/[locale]/auth/sign-up/guide/actions.ts`
- Creates profile with `application_status='pending'`
- Creates guide record with all application data
- Stores original application in `application_data` JSONB column
- No longer uses `guide_applications` table

---

## 🔄 REMAINING (40% of Phase 4)

### 4. Agency/DMC/Transport Sign-Up Forms (PENDING)
Need to update 3 more action files following the same pattern as guide sign-up:

#### Files to Update:
1. **`app/[locale]/auth/sign-up/agency/actions.ts`**
2. **`app/[locale]/auth/sign-up/dmc/actions.ts`**
3. **`app/[locale]/auth/sign-up/transport/actions.ts`**

#### Pattern to Follow:

```typescript
// OLD APPROACH (guide_applications/agency_applications/etc)
const { data: application, error } = await service
  .from("agency_applications")  // or dmc_applications, transport_applications
  .insert({ ...allData })
  .select("id")
  .single();

// NEW CONSOLIDATED APPROACH (agencies table)
// Step 1: Create agency record with application_status='pending'
const applicationData = { ...allOriginalData }; // Preserve for application_data

const { error: agencyError } = await service.from("agencies").insert({
  id: gen_random_uuid(),  // Generate ID
  type: "agency",  // or "dmc", "transport"
  name: legalCompanyName,
  slug: slugify(legalCompanyName),
  country_code: registrationCountry,
  description: companyDescription,
  registration_number: registrationNumber,
  vat_id: taxId,
  website: websiteUrl,
  logo_url: logoReference,
  languages: languagesArray,
  specialties: servicesArray,
  contact_email: contactEmail,
  contact_phone: contactPhone,
  location_data: locationData,
  fleet_data: fleetData,  // For transport only
  application_status: "pending",
  application_submitted_at: new Date().toISOString(),
  application_data: applicationData,  // Preserve original
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
});
```

**Key Changes for Each**:
- **Agency**: `type='agency'`, no fleet_data
- **DMC**: `type='dmc'`, no fleet_data
- **Transport**: `type='transport'`, include fleet_data

**No profile needed** for agencies/DMCs/transport (they're organizations, not user accounts)

---

### 5. Admin Verification API (PENDING - CRITICAL)
**File**: `app/api/admin/verification/route.ts`

This is the most important remaining piece - it handles approval/rejection.

#### Current Approach (OLD):
```typescript
// Fetch from application table
const application = await supabase
  .from('guide_applications')
  .select('*')
  .eq('id', appId)
  .single();

// Move to master table
await supabase.from('guides').insert(transformedData);

// Delete from application table
await supabase.from('guide_applications').delete().eq('id', appId);
```

#### New Consolidated Approach:
```typescript
// For GUIDES:
// Just update the profile status (data already in guides table)
await supabase
  .from('profiles')
  .update({
    application_status: action === 'approve' ? 'approved' : 'rejected',
    application_reviewed_at: new Date().toISOString(),
    application_reviewed_by: adminUserId,
    rejection_reason: action === 'reject' ? reason : null
  })
  .eq('id', profileId);

// Unban the user if approved
if (action === 'approve') {
  await supabase.auth.admin.updateUserById(profileId, {
    ban_duration: 'none'
  });
}

// For AGENCIES/DMCs/TRANSPORT:
// Update the agencies table directly
await supabase
  .from('agencies')
  .update({
    application_status: action === 'approve' ? 'approved' : 'rejected',
    application_reviewed_at: new Date().toISOString(),
    application_reviewed_by: adminUserId,
    rejection_reason: action === 'reject' ? reason : null
  })
  .eq('id', agencyId);
```

**Benefits**:
- No data movement between tables
- Faster (single UPDATE vs INSERT + DELETE)
- No risk of data loss
- Preserves application history in `application_data`

---

## Testing Checklist

After completing remaining updates, test:

### Admin Functions:
- [ ] Admin can view pending guide applications
- [ ] Admin can view pending agency/DMC/transport applications
- [ ] Admin can approve guide application → profile becomes active
- [ ] Admin can reject guide application → profile status = rejected
- [ ] Admin can approve agency/DMC/transport → shows in directory
- [ ] Admin can reject agency/DMC/transport

### Public Directories:
- [ ] Guide directory shows only approved guides
- [ ] Agency directory shows only approved agencies
- [ ] DMC directory shows only approved DMCs
- [ ] Transport directory shows only approved transport
- [ ] Pending applications do NOT show in directories

### Sign-Up Flows:
- [ ] Guide sign-up creates profile + guide with pending status
- [ ] Agency sign-up creates agency with pending status (type='agency')
- [ ] DMC sign-up creates agency with pending status (type='dmc')
- [ ] Transport sign-up creates agency with pending status (type='transport')
- [ ] All sign-ups send email notifications
- [ ] Thank you page displays correctly

### User Experience:
- [ ] Approved guides can log in
- [ ] Pending guides are banned (cannot log in)
- [ ] Rejected guides remain banned
- [ ] Applications preserve all original data in application_data

---

## Quick Reference: File Status

| File | Status | Notes |
|------|--------|-------|
| `app/[locale]/admin/applications/page.tsx` | ✅ Complete | Queries master tables |
| `lib/directory/queries.ts` | ✅ Complete | Filters by status |
| `app/[locale]/auth/sign-up/guide/actions.ts` | ✅ Complete | Uses profiles + guides |
| `app/[locale]/auth/sign-up/agency/actions.ts` | 🔄 Pending | Needs update to agencies table |
| `app/[locale]/auth/sign-up/dmc/actions.ts` | 🔄 Pending | Needs update to agencies table |
| `app/[locale]/auth/sign-up/transport/actions.ts` | 🔄 Pending | Needs update to agencies table |
| `app/api/admin/verification/route.ts` | 🔄 Pending | Critical - approval/rejection logic |

---

## Estimated Time Remaining

- **Agency Sign-Up**: 10-15 minutes
- **DMC Sign-Up**: 10-15 minutes
- **Transport Sign-Up**: 10-15 minutes
- **Admin Verification API**: 20-30 minutes
- **Testing**: 20-30 minutes

**Total**: ~1-1.5 hours

---

## Next Steps

### Option A: Complete All Remaining Now
1. Update agency/DMC/transport sign-up forms (30-45 min)
2. Update admin verification API (20-30 min)
3. Test everything (20-30 min)
4. Move to Phase 5 cleanup

### Option B: Critical Path Only
1. Update admin verification API (20-30 min) - **Most Important**
2. Test with existing data
3. Update sign-up forms later as needed

### Option C: Pause Here
1. Current state is functional:
   - Directories work (only show approved)
   - Admin can view applications
   - Guide sign-ups work with new structure
2. Can complete remaining in next session

---

## Recommendation

**Option B: Complete Admin Verification API**

**Why**:
- It's the most critical piece
- Enables approval of existing pending applications
- Only 20-30 minutes of work
- Can update sign-up forms incrementally after

**Then**:
- Test approval/rejection workflow
- Update sign-up forms one at a time as needed
- Less risky than big bang approach

Would you like to:
1. Continue with agency/DMC/transport sign-ups?
2. Skip to admin verification API (critical)?
3. Pause and test current state?
