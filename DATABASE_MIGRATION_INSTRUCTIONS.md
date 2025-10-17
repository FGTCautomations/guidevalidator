# Database Migration Instructions

## ⚠️ Required: Apply Database Changes

Your application forms are fully implemented, but the database schema needs to be updated to support the new fields.

## Quick Steps:

### 1. Open Supabase SQL Editor
👉 https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/sql/new

### 2. Copy & Paste the SQL
Open the file `APPLY_THIS_MIGRATION.sql` in this directory and copy all the SQL.

### 3. Run the SQL
Click "Run" in the Supabase SQL Editor.

### 4. Verify Success
You should see "Success. No rows returned" - this is correct!

### 5. Refresh Your App
The application forms will now work correctly.

---

## What This Migration Does:

### Adds credential storage fields:
- `login_email` - Email for account login
- `login_password_ciphertext` - Encrypted password
- `login_password_iv` - Encryption IV
- `login_password_tag` - Encryption tag

### Adds new account creation fields:
- `user_id` - Link to auth.users table
- `timezone` - Primary timezone
- `availability_timezone` - Timezone for working hours
- `working_hours` - JSONB with schedule per day
- `avatar_url` - Profile photo URL

### Applies to these tables:
- ✅ `guide_applications`
- ✅ `agency_applications`
- ✅ `dmc_applications`
- ✅ `transport_applications`
- ✅ `guides` (for approved profiles)

### Creates indexes:
- Performance indexes on `user_id` columns

---

## Alternative: Use Supabase CLI

If you prefer using the CLI:

```bash
cd supabase/migrations
# Ensure you're connected to your project
supabase db push
```

---

## After Migration:

Once applied, all 4 application forms will work with:
- ✅ Account creation during application
- ✅ Timezone selection
- ✅ Working hours configuration
- ✅ Subscription plan selection
- ✅ Custom language input
- ✅ Account activation on approval

The complete workflow will be:
1. User fills application → Creates auth account with `pending_approval: true`
2. User cannot login yet
3. Admin approves → Account activated
4. User can now login with their credentials
