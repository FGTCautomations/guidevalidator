# Admin Users Management System

## Overview

A comprehensive admin panel for managing all users in the Guide Validator platform, including guides, agencies, DMCs, and transport providers.

## Features Added

### 1. Complete Users Management Page
**Location**: `/[locale]/admin/users`

**Features**:
- View ALL users (not just pending applications)
- Detailed information display for each user
- Search and filter functionality
- Tab-based navigation (Guides, Agencies, DMCs, Transport)
- Statistics dashboard (Total, Pending, Approved, Rejected)

### 2. Comprehensive User Information Display

**For Guides**:
- ✅ Full name, email, avatar
- ✅ Headline and bio
- ✅ Verification status (verified, license verified)
- ✅ Application status (pending, approved, rejected)
- ✅ License number and authority
- ✅ Years of experience
- ✅ Specialties and expertise areas
- ✅ Languages spoken
- ✅ Hourly rate
- ✅ Application dates (submitted, reviewed)
- ✅ Rejection reason (if applicable)

**For Agencies/DMCs/Transport**:
- ✅ Company name, logo, email
- ✅ Type (agency, DMC, transport)
- ✅ Verification and application status
- ✅ Registration country
- ✅ Website, phone
- ✅ Description
- ✅ Services offered
- ✅ Languages supported
- ✅ Certifications
- ✅ Application dates
- ✅ Rejection reason (if applicable)

### 3. User Actions

Each user card includes action buttons:

#### ✏️ Edit (Coming Soon)
- Will allow editing user information
- Route: `/[locale]/admin/users/[userId]/edit`

#### ❄️ Freeze Account
- Temporarily ban user from logging in
- Requires admin to provide a reason
- User account is banned in Supabase Auth
- Freeze reason stored in `rejection_reason` field
- Completely reversible

#### 🔓 Unfreeze Account (For frozen accounts)
- Remove the ban from user account
- User can login again
- Clears freeze reason

#### 🗑️ Delete Account (PERMANENT)
- **PERMANENTLY** delete user account
- Requires double confirmation
- Admin must type "DELETE [username]" to confirm
- Deletes all user data:
  - Guide/Agency record from database
  - Profile record (for guides)
  - User from Supabase Auth
- Cannot be undone!

#### 👁️ View Profile
- Opens user's public profile in new tab
- Allows admin to see what users see

### 4. Search and Filter Functionality

**Search**:
- Search by name or email
- Real-time filtering

**Filter**:
- Filter by application status:
  - All Status
  - Pending
  - Approved
  - Rejected

### 5. Statistics Dashboard

Four stat cards showing:
1. **Total** - Total users in selected tab
2. **Pending** - Users with pending applications
3. **Approved** - Approved users
4. **Rejected** - Rejected users

## API Routes Created

### 1. Freeze Account
**Endpoint**: `POST /api/admin/users/freeze`

**Body**:
```json
{
  "userId": "uuid",
  "userType": "guides" | "agencies" | "dmcs" | "transport",
  "reason": "Reason for freezing"
}
```

**What it does**:
- Bans user in Supabase Auth (876000h = ~100 years)
- Updates `rejection_reason` with freeze info
- Prevents user from logging in

**Permissions**: Admin or Super Admin only

---

### 2. Unfreeze Account
**Endpoint**: `POST /api/admin/users/unfreeze`

**Body**:
```json
{
  "userId": "uuid",
  "userType": "guides" | "agencies" | "dmcs" | "transport"
}
```

**What it does**:
- Removes ban from Supabase Auth
- Clears freeze reason
- User can login again

**Permissions**: Admin or Super Admin only

---

### 3. Delete Account
**Endpoint**: `POST /api/admin/users/delete`

**Body**:
```json
{
  "userId": "uuid",
  "userType": "guides" | "agencies" | "dmcs" | "transport"
}
```

**What it does**:
- **PERMANENTLY** deletes user data
- Removes from guides/agencies table
- Removes from profiles table (for guides)
- Deletes from Supabase Auth
- Cannot be undone!

**Permissions**: Admin or Super Admin only

---

## Files Created

### Pages:
1. `app/[locale]/admin/users/page.tsx` - Main users management page

### Components:
2. `components/admin/users-manager.tsx` - Users management component (800+ lines)

### API Routes:
3. `app/api/admin/users/freeze/route.ts` - Freeze account API
4. `app/api/admin/users/unfreeze/route.ts` - Unfreeze account API
5. `app/api/admin/users/delete/route.ts` - Delete account API

---

## Usage

### Access the Users Management Page

1. Login as admin or super admin
2. Navigate to: `http://localhost:3002/en/admin/users`
3. Select tab: Guides, Agencies, DMCs, or Transport

### View User Details

1. Find a user in the list
2. Click "Show More Details ▼" to expand full information
3. Click "Show Less ▲" to collapse

### Freeze a User Account

1. Click "❄️ Freeze" button on user card
2. Enter reason for freezing
3. Confirm action
4. User will be banned and unable to login

### Unfreeze a User Account

1. Find frozen user (check rejection_reason starts with "FROZEN:")
2. Click "🔓 Unfreeze" button
3. Confirm action
4. User can login again

### Delete a User Account (PERMANENT!)

1. Click "🗑️ Delete" button on user card
2. Confirm first warning
3. Type "DELETE [username]" exactly as shown
4. User account permanently deleted

### Search Users

1. Use search box at top of page
2. Type name or email
3. Results filter in real-time

### Filter by Status

1. Use dropdown next to search
2. Select: All Status, Pending, Approved, or Rejected
3. List updates automatically

---

## Security Features

### Authentication Required
- Only logged-in users can access admin pages
- Redirects to login if not authenticated

### Authorization Required
- Only users with role "admin" or "super_admin" can access
- Returns 403 Forbidden for non-admin users

### Audit Trail
- All actions logged to console with:
  - Admin user ID
  - Target user ID
  - Action performed
  - Timestamp
  - Reason (for freeze)

### Confirmation Dialogs
- Freeze: Requires reason + confirmation
- Delete: Requires TWO confirmations + typing username

---

## User Experience

### Expandable Cards
- Collapsed by default (shows summary)
- Click to expand full details
- Keeps page clean and scannable

### Color-Coded Status
- **Yellow**: Pending
- **Green**: Approved
- **Red**: Rejected
- **Blue**: Verified

### Quick Actions
- All actions accessible from user card
- No need to navigate to separate pages

### Real-Time Feedback
- Alert on success
- Alert on error
- Page reload to show updates

---

## Future Enhancements

### 1. Edit User Information
Create edit pages for:
- `/[locale]/admin/users/[userId]/edit`
- Allow editing all user fields
- Validate changes
- Log modifications

### 2. Bulk Actions
- Select multiple users
- Freeze/unfreeze/delete multiple at once
- Export user data to CSV

### 3. Advanced Filters
- Filter by:
  - Date range
  - Country
  - Verification status
  - Last login date
- Sort by various fields

### 4. Email Notifications
- Send email when account frozen
- Send email when account unfrozen
- Send email when account deleted

### 5. Activity Log
- Track all admin actions
- Show who did what and when
- Filterable and searchable

### 6. User Notes
- Allow admins to add private notes to user profiles
- Track communication history
- Flag users for review

---

## Technical Notes

### Database Changes

**No schema changes required!** The system uses existing fields:

- `rejection_reason` - Used to store freeze reason (prefixed with "FROZEN:")
- `application_status` - Already exists for workflow
- `verified` - Already exists for verification status

### Supabase Auth Integration

**Ban Duration**:
- Freeze: `ban_duration: "876000h"` (~100 years)
- Unfreeze: `ban_duration: "none"`
- Uses Supabase Admin API (`auth.admin.updateUserById`)

**User Deletion**:
- Uses `auth.admin.deleteUser(userId)`
- Deletes auth record permanently

### Cascading Deletes

Database foreign keys handle cascading:
- Deleting guide also deletes: reviews, bookings, availability, etc.
- Deleting agency also deletes: members, reviews, bookings, etc.
- Database constraints ensure referential integrity

---

## Testing Checklist

### Freeze Account:
- [ ] Can freeze guide account
- [ ] Can freeze agency account
- [ ] Can freeze DMC account
- [ ] Can freeze transport account
- [ ] Frozen user cannot login
- [ ] Freeze reason appears in UI
- [ ] Freeze action logged

### Unfreeze Account:
- [ ] Can unfreeze guide account
- [ ] Can unfreeze agency account
- [ ] Can unfreeze DMC account
- [ ] Can unfreeze transport account
- [ ] Unfrozen user can login
- [ ] Freeze reason cleared
- [ ] Unfreeze action logged

### Delete Account:
- [ ] Can delete guide account
- [ ] Can delete agency account
- [ ] Can delete DMC account
- [ ] Can delete transport account
- [ ] User removed from database
- [ ] Auth account deleted
- [ ] Confirmation prompts work
- [ ] Delete action logged

### UI/UX:
- [ ] Search works correctly
- [ ] Filter works correctly
- [ ] Statistics accurate
- [ ] Cards expand/collapse
- [ ] Actions disabled during loading
- [ ] Error messages clear
- [ ] Success messages clear
- [ ] Page reload shows changes

---

## Troubleshooting

### Issue: "Unauthorized" error
**Solution**: Make sure you're logged in as admin or super_admin

### Issue: "Failed to freeze account"
**Solution**: Check that Supabase service role key is configured in `.env.local`

### Issue: User still appears after delete
**Solution**: Refresh the page - it should disappear

### Issue: Cannot unfreeze account
**Solution**: Check that `rejection_reason` starts with "FROZEN:" prefix

---

## Links

- **Users Management Page**: `/[locale]/admin/users`
- **Applications Page**: `/[locale]/admin/applications` (for pending only)
- **API Documentation**: See API Routes section above

---

**Created**: 2025-10-18
**Status**: ✅ Complete and functional
**Compilation**: ✅ No errors
**Dev Server**: ✅ Running on port 3002
