# Phase 5: Testing & Cleanup Guide

## Overview

Phase 5 is the final phase of the database consolidation project. It involves comprehensive testing and safe removal of deprecated tables.

**Status**: Ready to begin
**Prerequisites**: Phases 1-4 complete (✅ All done!)
**Estimated Time**: 1-2 hours

---

## Part A: Comprehensive Testing (~45 minutes)

Before deprecating any tables, we need to verify that all changes work correctly.

### 1. Sign-Up Form Testing (20 minutes)

#### Test Guide Sign-Up:
1. Navigate to `/en/auth/sign-up/guide`
2. Fill out the complete guide application form
3. Submit the application
4. **Expected Results**:
   - ✅ User account created in Supabase Auth (banned)
   - ✅ Record inserted into `profiles` table with `application_status='pending'`
   - ✅ Record inserted into `guides` table with `application_data` JSONB
   - ✅ "Application Received" email sent to applicant
   - ✅ "New Application" email sent to admin
   - ✅ User redirected to thanks page

**Verification SQL**:
```sql
-- Check guide application
SELECT
  p.id,
  p.full_name,
  p.application_status,
  p.application_submitted_at,
  g.headline,
  g.application_data->'locale' as submitted_locale
FROM profiles p
JOIN guides g ON g.profile_id = p.id
WHERE p.application_status = 'pending'
ORDER BY p.application_submitted_at DESC
LIMIT 5;
```

#### Test Agency Sign-Up:
1. Navigate to `/en/auth/sign-up/agency`
2. Fill out the complete agency application form
3. Submit the application
4. **Expected Results**:
   - ✅ User account created in Supabase Auth (banned)
   - ✅ Record inserted into `agencies` table with `type='agency'` and `application_status='pending'`
   - ✅ `application_data` JSONB preserved
   - ✅ Emails sent
   - ✅ User redirected to thanks page

**Verification SQL**:
```sql
-- Check agency application
SELECT
  id,
  name,
  type,
  application_status,
  application_submitted_at,
  application_data->'legal_company_name' as company_name
FROM agencies
WHERE application_status = 'pending'
AND type = 'agency'
ORDER BY application_submitted_at DESC
LIMIT 5;
```

#### Test DMC Sign-Up:
1. Navigate to `/en/auth/sign-up/dmc`
2. Fill out the DMC application form
3. Submit the application
4. **Expected Results**:
   - ✅ Record inserted into `agencies` table with `type='dmc'` and `application_status='pending'`
   - ✅ Redirected to Stripe payment link (or thanks page)

#### Test Transport Sign-Up:
1. Navigate to `/en/auth/sign-up/transport`
2. Fill out the transport application form
3. Submit the application
4. **Expected Results**:
   - ✅ Record inserted into `agencies` table with `type='transport'` and `application_status='pending'`
   - ✅ `fleet_data` JSONB populated

---

### 2. Admin Dashboard Testing (15 minutes)

#### View Pending Applications:
1. Login as admin
2. Navigate to `/en/admin/applications`
3. **Expected Results**:
   - ✅ Pending guide applications displayed
   - ✅ Pending agency applications displayed
   - ✅ Pending DMC applications displayed
   - ✅ Pending transport applications displayed
   - ✅ Applications grouped by type
   - ✅ Application details shown correctly

**Verification**:
- Check that the applications you just submitted appear in the admin dashboard
- Verify all fields display correctly
- Check that `application_data` is accessible

---

### 3. Approval Workflow Testing (20 minutes)

#### Test Guide Approval:
1. In admin dashboard, click "Approve" on a pending guide application
2. **Expected Results**:
   - ✅ `profiles.application_status` updated to 'approved'
   - ✅ `profiles.verified` set to true
   - ✅ `profiles.license_verified` set to true (if license uploaded)
   - ✅ `profiles.application_reviewed_at` populated
   - ✅ `profiles.application_reviewed_by` set to admin user ID
   - ✅ User account unbanned in Supabase Auth
   - ✅ "Application Approved" email sent to applicant

**Verification SQL**:
```sql
-- Check guide approval
SELECT
  p.id,
  p.full_name,
  p.application_status,
  p.verified,
  p.license_verified,
  p.application_reviewed_at,
  p.application_reviewed_by
FROM profiles p
WHERE p.application_status = 'approved'
AND p.role = 'guide'
ORDER BY p.application_reviewed_at DESC
LIMIT 5;
```

**Auth Verification**:
1. Try logging in with the approved guide's credentials
2. **Expected**: Login succeeds (user is unbanned)

#### Test Agency Approval:
1. In admin dashboard, click "Approve" on a pending agency application
2. **Expected Results**:
   - ✅ `agencies.application_status` updated to 'approved'
   - ✅ `agencies.verified` set to true
   - ✅ `agencies.application_reviewed_at` populated
   - ✅ `agencies.application_reviewed_by` set to admin user ID
   - ✅ "Application Approved" email sent

**Verification SQL**:
```sql
-- Check agency approval
SELECT
  id,
  name,
  type,
  application_status,
  verified,
  application_reviewed_at,
  application_reviewed_by
FROM agencies
WHERE application_status = 'approved'
ORDER BY application_reviewed_at DESC
LIMIT 5;
```

#### Test Rejection:
1. In admin dashboard, click "Reject" on a pending application
2. Add rejection notes
3. **Expected Results**:
   - ✅ `application_status` updated to 'rejected'
   - ✅ `rejection_reason` populated with notes
   - ✅ `application_reviewed_at` populated
   - ✅ User account remains banned
   - ✅ "Application Rejected" email sent

---

### 4. Directory Listing Testing (10 minutes)

#### Test Guide Directory:
1. Navigate to `/en/guides` (public directory)
2. **Expected Results**:
   - ✅ Only approved guides displayed
   - ✅ Pending guides NOT displayed
   - ✅ Rejected guides NOT displayed
   - ✅ Guide profiles load correctly
   - ✅ All guide data displays properly

**Verification SQL**:
```sql
-- This query should match what appears in the directory
SELECT
  g.profile_id,
  p.full_name,
  g.headline,
  p.application_status,
  p.verified
FROM guides g
JOIN profiles p ON p.id = g.profile_id
WHERE p.application_status = 'approved'
ORDER BY p.verified DESC, p.created_at DESC
LIMIT 20;
```

#### Test Agency/DMC/Transport Directories:
1. Navigate to `/en/agencies`, `/en/dmcs`, `/en/transport`
2. **Expected Results**:
   - ✅ Only approved entities displayed
   - ✅ Correct filtering by `type` field
   - ✅ Pending entities NOT displayed

**Verification SQL**:
```sql
-- Check agency directory
SELECT id, name, type, application_status, verified
FROM agencies
WHERE application_status = 'approved'
AND type = 'agency'
ORDER BY featured DESC, created_at DESC
LIMIT 20;

-- Check DMC directory
SELECT id, name, type, application_status, verified
FROM agencies
WHERE application_status = 'approved'
AND type = 'dmc'
ORDER BY featured DESC, created_at DESC
LIMIT 20;

-- Check transport directory
SELECT id, name, type, application_status, verified
FROM agencies
WHERE application_status = 'approved'
AND type = 'transport'
ORDER BY featured DESC, created_at DESC
LIMIT 20;
```

---

### 5. Profile Page Testing (10 minutes)

#### Test Guide Profile Page:
1. Click on an approved guide in the directory
2. **Expected Results**:
   - ✅ Profile page loads correctly
   - ✅ All guide information displays
   - ✅ No errors in console
   - ✅ Can view reviews/ratings
   - ✅ Can book/contact guide

#### Test Agency/DMC/Transport Profile Pages:
1. Click on approved agencies/DMCs/transport companies
2. **Expected Results**:
   - ✅ Profile pages load correctly
   - ✅ All information displays properly

---

## Part B: Table Deprecation (~10 minutes)

**IMPORTANT**: Only proceed after ALL tests pass!

### Step 1: Run Phase 5a (Rename Tables)

This is a **REVERSIBLE** operation. Tables are renamed to `_deprecated_*` prefix.

```bash
node db-consolidation/phase5a_deprecate_tables.js
```

**What it does**:
- Renames 15 tables to `_deprecated_*` prefix
- Shows table sizes and row counts
- Gives you 5 seconds to cancel
- Commits changes in a transaction

**Tables affected**:
- `guide_applications` → `_deprecated_guide_applications`
- `agency_applications` → `_deprecated_agency_applications`
- `dmc_applications` → `_deprecated_dmc_applications`
- `transport_applications` → `_deprecated_transport_applications`
- `guide_cities` → `_deprecated_guide_cities`
- ... (11 location junction tables)

**To reverse (if needed)**:
```sql
ALTER TABLE _deprecated_guide_applications RENAME TO guide_applications;
```

---

### Step 2: Monitor for 7+ Days

**DO NOT proceed to Step 3 until you've monitored for at least 7 days!**

During this period:
- ✅ Watch for any errors in logs
- ✅ Check that all features work correctly
- ✅ Monitor Sentry/error tracking
- ✅ Ask users for feedback
- ✅ Test all critical workflows

**If issues are found**:
1. Identify which table is needed
2. Rename it back: `ALTER TABLE _deprecated_X RENAME TO X;`
3. Fix the code that references it
4. Update consolidation plan

---

### Step 3: Run Phase 5b (Drop Tables) - PERMANENT!

**ONLY after 7+ days of monitoring with NO issues!**

**REQUIREMENTS**:
- [ ] Full database backup taken
- [ ] Backup verified (can restore successfully)
- [ ] All team members notified
- [ ] 7+ days passed since Phase 5a
- [ ] No errors found during monitoring

```bash
node db-consolidation/phase5b_drop_tables.js
```

**What it does**:
- Lists all `_deprecated_*` tables
- Shows sizes and row counts
- Requires **TRIPLE CONFIRMATION**
- Permanently drops tables (CASCADE)
- Cannot be reversed!

**Confirmation prompts**:
1. Type "I HAVE A BACKUP"
2. Type the number of tables to drop
3. Type "DELETE PERMANENTLY"
4. Type "COMMIT" to finalize

---

## Part C: Post-Cleanup Tasks (~15 minutes)

### 1. Reclaim Disk Space
```sql
VACUUM ANALYZE;
```

### 2. Verify Table Count
```sql
SELECT COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema = 'public';
```

**Expected**: ~56 tables (down from 82)

### 3. Update Documentation
- [ ] Update database schema documentation
- [ ] Update API documentation
- [ ] Update developer onboarding guides
- [ ] Update backup/restore procedures

### 4. Final Verification
- [ ] Run all tests again
- [ ] Check production logs
- [ ] Verify no errors
- [ ] Confirm all features work

---

## Testing Checklist Summary

### Sign-Ups:
- [ ] Guide sign-up creates profile + guide with pending status
- [ ] Agency sign-up creates agency with type='agency' and pending status
- [ ] DMC sign-up creates agency with type='dmc' and pending status
- [ ] Transport sign-up creates agency with type='transport' and pending status
- [ ] Users are banned until approved
- [ ] Emails sent correctly

### Admin:
- [ ] Pending applications appear in dashboard
- [ ] Applications display correctly
- [ ] Approval updates status (not move data)
- [ ] Rejection updates status with notes
- [ ] Approved users unbanned

### Directories:
- [ ] Only approved entities show in directories
- [ ] Pending entities hidden
- [ ] Rejected entities hidden
- [ ] Filtering by type works correctly

### Profiles:
- [ ] Profile pages load correctly
- [ ] All data displays properly
- [ ] Reviews/ratings work
- [ ] Booking/contact works

---

## Rollback Procedures

### If Phase 5a needs rollback (tables renamed):
```sql
-- Rename tables back
ALTER TABLE _deprecated_guide_applications RENAME TO guide_applications;
ALTER TABLE _deprecated_agency_applications RENAME TO agency_applications;
-- ... etc
```

### If Phase 5b is run (tables dropped):
- **Cannot rollback!** Tables are permanently deleted
- Restore from backup
- This is why we wait 7+ days after Phase 5a

---

## Success Criteria

Phase 5 is complete when:
- ✅ All tests pass
- ✅ Tables deprecated (Phase 5a run)
- ✅ 7+ days monitored with no issues
- ✅ Tables permanently dropped (Phase 5b run)
- ✅ Documentation updated
- ✅ Team notified

---

## Timeline

**Day 0**: Run Phase 5a (rename tables) - 10 minutes
**Days 1-7**: Monitor application - ongoing
**Day 7+**: Run Phase 5b (drop tables) if no issues - 10 minutes
**Day 7+**: Update documentation - 15 minutes

**Total**: ~45 minutes active work + 7 days monitoring

---

## Risk Assessment

**Phase 5a (Rename)**: ⚠️ Low Risk
- Reversible operation
- Tables preserved with new names
- Can rename back if needed

**Phase 5b (Drop)**: ⚠️⚠️ High Risk
- **PERMANENT AND IRREVERSIBLE**
- Data loss if run prematurely
- Requires backup to recover

**Mitigation**:
- Comprehensive testing before deprecation
- 7-day monitoring period
- Triple confirmation required
- Full backup mandatory

---

## Contact

If you encounter any issues during Phase 5:
1. **DO NOT PROCEED** with Phase 5b
2. Document the error/issue
3. Check which table is being referenced
4. Rename the table back if needed
5. Update the consolidation plan

---

**Status**: Phase 5 ready to begin
**Next Step**: Start with comprehensive testing (Part A)
