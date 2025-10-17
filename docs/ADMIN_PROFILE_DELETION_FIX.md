# Admin Profile Deletion Fix

## Issue
The admin panel profile deletion feature was not working because the database was missing a DELETE policy for the `profiles` table. This prevented admins from deleting user profiles even though the application code attempted to perform the deletion.

## Root Cause
The Row Level Security (RLS) policies for the `profiles` table included:
- SELECT policy (`profiles_select_self_or_admin`)
- INSERT policy (`profiles_insert_self_or_admin`)
- UPDATE policy (`profiles_update_self_or_admin`)

But **no DELETE policy** was defined, which blocked all deletion attempts regardless of user role.

## Solution
Added a new migration file: `20251007000000_add_profiles_delete_policy.sql`

This migration creates a DELETE policy that allows only admins and super_admins to delete user profiles:

```sql
SELECT public.ensure_policy(
  'public','profiles','profiles_delete_admin_only',
  $SQL$ CREATE POLICY "profiles_delete_admin_only" ON public.profiles
        FOR DELETE
        USING ( public.is_admin() ) $SQL$
);
```

## How It Works

### Admin Delete Function Flow
1. **Authorization Check** ([admin.ts:266-286](app/_actions/admin.ts#L266-L286))
   - Verifies the current user is an admin or super_admin
   - Prevents users from deleting themselves
   - Validates the user ID

2. **Profile Retrieval** ([admin.ts:291-295](app/_actions/admin.ts#L291-L295))
   - Fetches profile data for email notification

3. **Auth User Check** ([admin.ts:301-313](app/_actions/admin.ts#L301-L313))
   - Checks if an auth record exists for the user
   - Retrieves the user's email address

4. **Profile Deletion** ([admin.ts:315-318](app/_actions/admin.ts#L315-L318))
   - Deletes the profile from the `profiles` table
   - **Now works correctly** with the new DELETE policy
   - Cascades to related tables (payments, subscriptions, etc.)

5. **Auth Deletion** ([admin.ts:320-325](app/_actions/admin.ts#L320-L325))
   - Deletes the auth user if it exists
   - Uses service role client for auth admin operations

6. **Notification** ([admin.ts:327-347](app/_actions/admin.ts#L327-L347))
   - Sends deletion notification email to the user
   - Logs any email failures

7. **Cache Invalidation** ([admin.ts:349-350](app/_actions/admin.ts#L349-L350))
   - Revalidates admin pages to reflect changes

### UI Integration
The delete functionality is exposed through two locations in the admin panel:

1. **User Detail Page Header** ([users/[id]/page.tsx:134-146](app/[locale]/admin/users/[id]/page.tsx#L134-L146))
   - Quick delete button next to user's name

2. **User Actions Section** ([users/[id]/page.tsx:344-356](app/[locale]/admin/users/[id]/page.tsx#L344-L356))
   - Delete button in the dedicated actions section

Both use the `AdminDeleteUserForm` component ([delete-user-form.tsx](components/admin/delete-user-form.tsx)) which:
- Shows confirmation UI
- Handles form submission with loading states
- Redirects to admin home on success
- Displays error messages on failure

## Cascade Deletion Rules
Related data is handled through database foreign key constraints:

### Automatically Cascaded (ON DELETE CASCADE)
- `payments.profile_id` → Deletes all user payments
- `subscriptions.profile_id` → Deletes all user subscriptions
- `job_responses.responder_id` → Deletes job responses
- `availability_schedules.owner_id` → Deletes availability schedules
- `availability_requests.requester_id` and `target_id` → Deletes availability requests

### Set to NULL (ON DELETE SET NULL)
- `transport_media.owner_profile_id` → Sets owner to NULL but keeps the media record

### No Cascade (Manual Cleanup Required)
Profile-specific data in separate tables (e.g., `guides`, `agencies`) should be handled separately if needed, though most are linked through the profile ID and may have their own cascade rules.

## Migration Applied
The migration has been successfully applied to the database using:
```bash
npx tsx scripts/apply-profiles-delete-policy.mjs
```

## Testing the Fix
To verify the delete function works:

1. Log in as an admin or super_admin
2. Navigate to `/[locale]/admin/users/[user-id]`
3. Click the delete button
4. Confirm the deletion
5. Verify:
   - User is redirected to `/[locale]/admin`
   - Profile is removed from the database
   - Auth user is deleted
   - Related records are cascaded appropriately
   - Deletion email is sent (if configured)

## Security Notes
- Only users with `role = 'admin'` or `role = 'super_admin'` can delete profiles
- Users cannot delete their own accounts through this endpoint
- All deletions are permanent and cannot be undone
- GDPR compliance: Consider implementing soft deletion with `deleted_at` timestamp for data retention requirements (see [gdpr_ccpa_compliance.sql](supabase/migrations/20251006000000_gdpr_ccpa_compliance.sql))

## Related Files
- Migration: [20251007000000_add_profiles_delete_policy.sql](supabase/migrations/20251007000000_add_profiles_delete_policy.sql)
- Admin Actions: [app/_actions/admin.ts](app/_actions/admin.ts)
- Delete Form Component: [components/admin/delete-user-form.tsx](components/admin/delete-user-form.tsx)
- Admin User Detail Page: [app/[locale]/admin/users/[id]/page.tsx](app/[locale]/admin/users/[id]/page.tsx)
- Migration Script: [scripts/apply-profiles-delete-policy.mjs](scripts/apply-profiles-delete-policy.mjs)
