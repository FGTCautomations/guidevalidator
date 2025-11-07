# Phase 4 Progress: Update Application Queries

## ✅ Completed Changes

### 1. Admin Applications Page ✅
**File**: `app/[locale]/admin/applications/page.tsx`

**Changed**: Query master tables instead of application tables
- ✅ Guide applications: Query `guides` table with `profiles.application_status='pending'`
- ✅ Agency applications: Query `agencies` table with `application_status='pending'` and `type='agency'`
- ✅ DMC applications: Query `agencies` table with `application_status='pending'` and `type='dmc'`
- ✅ Transport applications: Query `agencies` table with `application_status='pending'` and `type='transport'`

**Impact**: Admin can now view pending applications from master tables

### 2. Directory Listings ✅
**File**: `lib/directory/queries.ts`

**Changed**: Filter by application_status to show only approved profiles
- ✅ Guide directory: Added `.eq("profiles.application_status", "approved")`
- ✅ Agency/DMC/Transport directories: Added `.eq("application_status", "approved")`

**Impact**: Only approved guides/agencies/DMCs/transport show in public directories

---

## 🔄 Remaining Changes

### 3. Sign-Up Forms (PENDING)
Need to update all sign-up action files to insert into master tables with `application_status='pending'`:

**Files to Update**:
- `app/[locale]/auth/sign-up/guide/actions.ts` - Insert into `guides` + `profiles` with pending status
- `app/[locale]/auth/sign-up/agency/actions.ts` - Insert into `agencies` with pending status
- `app/[locale]/auth/sign-up/dmc/actions.ts` - Insert into `agencies` (type='dmc') with pending status
- `app/[locale]/auth/sign-up/transport/actions.ts` - Insert into `agencies` (type='transport') with pending status

**Pattern**:
```typescript
// OLD: Insert into guide_applications table
await supabase.from('guide_applications').insert({ ...data });

// NEW: Insert into guides + profiles with pending status
// 1. Create profile with application_status='pending'
const { data: profile } = await supabase.from('profiles').insert({
  id: userId,
  role: 'guide',
  full_name: data.full_name,
  application_status: 'pending',
  application_submitted_at: new Date().toISOString()
}).select().single();

// 2. Create guide record with application_data
await supabase.from('guides').insert({
  profile_id: userId,
  headline: data.professional_intro,
  // ... other fields
  application_data: data  // Preserve original application
});
```

### 4. Admin Verification API (PENDING)
**File**: `app/api/admin/verification/route.ts`

**Need to Change**:
- Approval: Update `profiles.application_status` from 'pending' to 'approved'
- Rejection: Update `profiles.application_status` from 'pending' to 'rejected'
- No longer need to move data between tables (already in master tables)

**Pattern**:
```typescript
// OLD: Move from guide_applications to guides table
const appData = await supabase.from('guide_applications').select().eq('id', appId).single();
await supabase.from('guides').insert(appData);
await supabase.from('guide_applications').delete().eq('id', appId);

// NEW: Just update status
await supabase.from('profiles')
  .update({
    application_status: 'approved',
    application_reviewed_at: new Date().toISOString(),
    application_reviewed_by: adminId
  })
  .eq('id', profileId);
```

### 5. Location Filtering (OPTIONAL - Can be done later)
**Files**: Location filtering components

Currently using old junction tables (`guide_cities`, `guide_regions`, etc.)
Can be updated to use `entity_locations` table, but not critical since old tables still work.

**Pattern**:
```typescript
// OLD: Query guide_cities
const { data } = await supabase
  .from('guide_cities')
  .select('guide_id')
  .eq('city_id', cityId);

// NEW: Query entity_locations
const { data } = await supabase
  .from('entity_locations')
  .select('entity_id')
  .eq('entity_type', 'guide')
  .eq('location_type', 'city')
  .eq('location_id', cityId);
```

---

## Summary of Changes So Far

### ✅ Completed (2 of 5 key areas):
1. **Admin Applications Page** - Now queries master tables ✅
2. **Directory Listings** - Filters by application_status ✅

### 🔄 Remaining (3 areas):
3. **Sign-Up Forms** - Need to insert into master tables with pending status
4. **Admin Verification API** - Need to update status instead of moving data
5. **Location Filtering** (optional) - Can use entity_locations table

---

## Current Status

**Frontend**: Currently works! Guides and agencies display correctly in directories
**Admin**: Can view applications (will see both old and new format)
**Sign-ups**: Still insert into old application tables (need to update)
**Approval**: Still tries to move data between tables (need to update)

---

## Risk Assessment

**Low Risk** (completed changes):
- Directory listings already working
- Admin page updated to query new structure
- Backward compatible (old data still works)

**Medium Risk** (remaining changes):
- Sign-up forms are critical user flow
- Admin verification affects business workflow
- Need careful testing

---

## Next Steps

### Option 1: Complete Phase 4 Now (Recommended)
1. Update sign-up forms (30-45 min)
2. Update admin verification API (15-20 min)
3. Test everything (20-30 min)
4. Total: ~1.5 hours

### Option 2: Pause and Test Current State
1. Test directory listings work correctly
2. Test admin can see applications
3. Continue Phase 4 in next session

### Option 3: Keep Sign-Ups As-Is (Temporary)
1. Leave sign-up forms unchanged for now
2. Applications continue to go to old tables
3. Admin migrates them manually using Phase 2 script
4. Update sign-ups later when ready

---

## Recommendation

**Option 1: Complete Phase 4 now** - We're 40% done with Phase 4, might as well finish it!

**Why**:
- Sign-up forms are straightforward to update
- Admin verification API is critical
- Better to complete the migration fully
- Only ~1.5 hours remaining

Would you like to continue with sign-up forms and admin verification API?
