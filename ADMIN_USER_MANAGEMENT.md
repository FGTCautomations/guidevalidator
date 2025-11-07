# Admin User Management Implementation

## Overview
The admin panel now provides comprehensive user management capabilities on individual user profile pages, including viewing all application data, freezing/unfreezing accounts, and deleting users.

## Features Implemented

### 1. View All Application Data
- **Component**: `ApplicationDataDisplay` ([components/admin/application-data-display.tsx](components/admin/application-data-display.tsx))
- Displays all fields from application forms (guide, agency, DMC, transport)
- Expandable view: shows first 10 fields by default, with option to view all
- Formats different data types appropriately:
  - Booleans: "Yes" / "No"
  - Arrays: Comma-separated list
  - Objects: JSON formatted
- Filters out system fields (id, created_at, updated_at, profile_id)
- Converts snake_case keys to Title Case for display

### 2. Freeze/Unfreeze Accounts
- **Components**:
  - `FreezeUserForm` ([components/admin/freeze-user-form.tsx](components/admin/freeze-user-form.tsx))
  - `UnfreezeUserForm` ([components/admin/unfreeze-user-form.tsx](components/admin/unfreeze-user-form.tsx))
- **API Routes**:
  - POST `/api/admin/users/freeze` ([app/api/admin/users/freeze/route.ts](app/api/admin/users/freeze/route.ts))
  - POST `/api/admin/users/unfreeze` ([app/api/admin/users/unfreeze/route.ts](app/api/admin/users/unfreeze/route.ts))

#### Freeze Implementation
- Uses Supabase Auth's ban functionality with 876000h duration (~100 years)
- Stores reason in `rejection_reason` field with "FROZEN:" prefix
- Includes freeze date and admin ID in reason
- Modal requires admin to provide a reason before freezing

#### Unfreeze Implementation
- Removes ban from Supabase Auth
- Clears `rejection_reason` if it starts with "FROZEN:"
- Simple confirmation dialog (no reason required)

### 3. Delete Accounts
- **API Route**: POST `/api/admin/users/delete` ([app/api/admin/users/delete/route.ts](app/api/admin/users/delete/route.ts))
- Permanently deletes user from both database and Supabase Auth
- Confirmation dialog with warning message
- Redirects to admin dashboard after successful deletion

### 4. Account Status Display
The user detail page now shows:
- **Account Status**: "❄️ Frozen" or "✅ Active"
- **Application Status**: "Approved" / "Pending" / "Rejected" (with color coding)
- **Freeze/Rejection Reason**: Displayed in red box if present
- **Conditional Actions**: Shows freeze or unfreeze button based on current status

## User Interface

### Location
Individual user profile page: `/[locale]/admin/users/[id]`

### Layout
The page has two main sections:

1. **Left Column** (Profile Section):
   - User information
   - Edit profile form (existing)
   - Guide/Organization segments forms (existing)
   - **Application Data Display** (NEW)
   - Subscriptions list
   - Payments list

2. **Right Column** (Actions Section - NEW):
   - Account status display
   - Freeze or Unfreeze button (conditional)
   - Delete account button

## Technical Details

### Database Schema
No new tables or columns were added. Uses existing fields:
- `profiles.rejection_reason` - Stores freeze reason with "FROZEN:" prefix
- Supabase Auth `banned_until` - Tracks frozen status
- `guides.application_data` - JSONB field with guide application data
- `agencies.application_data` - JSONB field with agency/DMC/transport data

### Data Fetching
Enhanced `fetchAdminUserDetail` in [lib/admin/queries.ts](lib/admin/queries.ts):
```typescript
export type AdminUserDetail = {
  id: string;
  email: string | null;
  isFrozen: boolean; // NEW
  profile: {
    // ... existing fields
    applicationStatus: string | null;
    applicationSubmittedAt: string | null;
    applicationReviewedAt: string | null;
    rejectionReason: string | null;
  };
  applicationData: any | null; // NEW
  guideData: any | null; // NEW
  agencyData: any | null; // NEW
  subscriptions: Array<...>;
  payments: Array<...>;
  totalIncomeCents: number;
};
```

### Security
- All admin actions require authentication
- Only users with "admin" or "super_admin" role can access
- Freeze/delete operations use Supabase Service Client for admin privileges
- Each operation validates user permissions before executing

## Usage

### To Freeze an Account:
1. Navigate to user's profile page: `/en/admin/users/[user-id]`
2. In the "Account Actions" section, click "❄️ Freeze Account"
3. Enter a reason in the modal dialog
4. Click "Freeze Account"
5. User will immediately be unable to login

### To Unfreeze an Account:
1. Navigate to frozen user's profile page
2. In the "Account Actions" section, click "🔓 Unfreeze Account"
3. Confirm in the dialog
4. User will immediately be able to login again

### To Delete an Account:
1. Navigate to user's profile page
2. In the "Account Actions" section, click the delete button
3. Confirm the permanent deletion
4. User and all associated data will be removed

## Testing

Test the implementation by:
1. Starting dev server: `npm run dev`
2. Login as admin user
3. Navigate to `/en/admin` to see users list
4. Click on a user to view their profile
5. Test freeze/unfreeze/delete actions
6. Verify all application data is visible in the expandable section

## Notes

- Freeze uses a 100-year ban duration to effectively prevent login
- The `rejection_reason` field serves dual purpose: application rejection AND freeze reason
- Prefixing with "FROZEN:" distinguishes freeze reasons from rejection reasons
- All changes refresh the page automatically to show updated status
- Application data is merged from multiple sources (guides table, agencies table, application_data JSONB)
