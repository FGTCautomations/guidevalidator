# Bulk Upload - Test Checklist

## Pre-Test Verification ✅

- [x] Schema column fixes applied (`languages`, `website`, `specialties`)
- [x] Profile creation changed from `insert` to `upsert`
- [x] Both guide and organization profiles use upsert
- [x] `created_at` removed from profile upserts (managed by trigger)

## Test Steps

### 1. Prepare Test Data
Use your Excel file with these test emails (or any emails):
- test@12example.com
- test2@12hotmail.com
- test3@12gmail.com
- test4@12outlook.com
- contact@travelagency.com
- contact@dmccompany.com
- contact@transportco.com

### 2. Upload File
1. Go to Admin Dashboard → Bulk Upload
2. Select your Excel file
3. Click "Upload"

### 3. Expected Results ✅

```
Upload Summary
Categories: 4
Total Rows: 7
Success: 7
Errors: 0

Guides
Total: 4
Success: 4
Errors: 0

Agencies
Total: 1
Success: 1
Errors: 0

DMCs
Total: 1
Success: 1
Errors: 0

Transport
Total: 1
Success: 1
Errors: 0
```

### 4. Verify Created Users

Run this script to check:
```bash
npx tsx scripts/list-recent-auth-users.ts
```

Should show:
- 7 new auth users with the test emails
- All 7 have profiles
- Profiles have correct roles (guide, agency, dmc, transport)
- Profile data matches Excel file

### 5. Verify in Database

Check Supabase Dashboard:
- **Auth → Users**: Should see 7 new users
- **Database → profiles**: Should see 7 new profiles
- **Database → guides**: Should see 4 new guides
- **Database → agencies**: Should see 3 new agencies (1 agency, 1 dmc, 1 transport)

## If Something Fails

### Still Getting "duplicate key" Errors?

1. Check if orphaned profiles exist:
   ```bash
   npx tsx scripts/check-auth-vs-profiles.ts
   ```

2. Delete orphaned profiles:
   ```bash
   npx tsx scripts/delete-orphaned-profiles-force.ts
   ```

3. Retry upload

### Getting Schema Errors?

1. Check Supabase SQL Editor
2. Run this to reload schema cache:
   ```sql
   NOTIFY pgrst, 'reload schema';
   ```

3. Retry upload

### Other Errors?

Check the browser console and server logs for details:
- Browser: Open DevTools → Console tab
- Server: Check terminal where Next.js is running

## Success Criteria ✅

- [ ] All 7 rows uploaded successfully
- [ ] 0 errors in upload summary
- [ ] All auth users have profiles
- [ ] Profile roles match expected values
- [ ] Guide records created for all guides
- [ ] Agency records created for agencies/DMCs/transport
- [ ] Languages and specialties arrays populated correctly
- [ ] No orphaned profiles remain

## Post-Test Cleanup (Optional)

If you want to remove test users:
```bash
# Delete specific test users
npx tsx scripts/cleanup-test-users-standalone.ts

# Or use Supabase Dashboard:
# Auth → Users → Select and delete test users
```

## Documentation Files

- [BULK_UPLOAD_COMPLETE_FIX.md](BULK_UPLOAD_COMPLETE_FIX.md) - Complete explanation of root cause and fix
- [BULK_UPLOAD_FIXES.md](BULK_UPLOAD_FIXES.md) - Detailed technical documentation
- [BULK_UPLOAD_FIX_SUMMARY.md](BULK_UPLOAD_FIX_SUMMARY.md) - Quick reference guide
