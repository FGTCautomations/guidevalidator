# Availability Holds System - Implementation Complete

## Overview

The availability holds system allows agencies, DMCs, and transport companies to request temporary holds on guide or transport company availability. Holds expire automatically after 48 hours if not responded to.

## Database Schema

### Table: `availability_holds`

Location: `supabase/migrations/20251005150000_availability_holds_system.sql`

**Columns:**
- `id` (uuid, PK) - Unique identifier
- `holdee_id` (uuid) - ID of the guide or transport being held
- `holdee_type` (text) - Type: 'guide' or 'transport'
- `requester_id` (uuid) - ID of the requesting organization
- `requester_type` (text) - Type: 'agency', 'dmc', or 'transport'
- `start_date` (date) - Hold start date
- `end_date` (date) - Hold end date
- `status` (text) - 'pending', 'accepted', 'declined', 'expired', 'cancelled'
- `request_message` (text) - Optional message from requester
- `response_message` (text) - Optional response from holdee
- `created_at` (timestamptz) - Creation timestamp
- `updated_at` (timestamptz) - Last update timestamp
- `expires_at` (timestamptz) - Auto-expiry timestamp (created_at + 48 hours)
- `responded_at` (timestamptz) - Response timestamp
- `metadata` (jsonb) - Additional data

**Key Features:**
- Auto-expiry after 48 hours via `expire_pending_holds()` function
- Conflict detection trigger (`check_hold_conflicts()`) prevents overlapping accepted holds
- Audit logging trigger (`log_hold_actions()`) tracks all hold actions
- RLS policies for proper access control

**Views:**
- `active_holds` - Shows all pending/accepted holds with holdee and requester names

## API Endpoints

### POST `/api/holds`
Create a new availability hold request

**Request Body:**
```json
{
  "holdeeId": "uuid",
  "holdeeType": "guide" | "transport",
  "startDate": "2025-10-10",
  "endDate": "2025-10-15",
  "requestMessage": "Optional message"
}
```

**Response:**
```json
{
  "success": true,
  "hold": { /* hold object */ },
  "message": "Hold request created successfully"
}
```

**Authorization:** Requires user to be agency/dmc/transport with organization_id

**Email Notification:** Sends hold request email to holdee

### GET `/api/holds?type=received|sent`
Get holds for current user

**Query Parameters:**
- `type`: "received" (holds on user's availability) or "sent" (holds requested by user's org)

**Response:**
```json
{
  "holds": [/* array of holds with requester and holdee info */]
}
```

### POST `/api/holds/[id]/respond`
Respond to a hold request (accept/decline)

**Request Body:**
```json
{
  "action": "accepted" | "declined",
  "responseMessage": "Optional response message"
}
```

**Response:**
```json
{
  "success": true,
  "hold": { /* updated hold object */ },
  "message": "Hold accepted successfully"
}
```

**Authorization:** Requires user to be the holdee

**Side Effects:**
- If accepted: Creates blocked availability slots for the date range
- Sends email notification to requester
- Logs action to audit_logs

## Email Notifications

Location: `lib/email/resend.ts`

### `sendHoldRequestedEmail()`
Sent when a hold is requested
- **To:** Holdee
- **Subject:** "New Availability Hold Request from [Requester Name]"
- **Content:** Start/end dates, expires timestamp, optional message, link to respond

### `sendHoldAcceptedEmail()`
Sent when a hold is accepted
- **To:** Requester
- **Subject:** "Hold Accepted by [Holdee Name]"
- **Content:** Dates, optional response message, confirmation

### `sendHoldDeclinedEmail()`
Sent when a hold is declined
- **To:** Requester
- **Subject:** "Hold Declined by [Holdee Name]"
- **Content:** Dates, optional response message, suggestion to contact directly

## UI Components

### Enhanced Calendar Component
Location: `components/account/availability/availability-calendar-enhanced.tsx`

**Features:**
- **Drag-to-create:** Click and drag across dates to create availability slots
- **Hold display:** Shows pending (light blue) and accepted (dark blue) holds
- **Hold details:** Displays requester name, dates, message, and expiry time
- **Accept/Decline actions:** Buttons to respond to pending holds
- **Auto-refresh:** Fetches holds when month changes
- **Visual indicators:** Different colors for available, unavailable, blocked, requests, and holds

**Usage:**
```tsx
<AvailabilityCalendarEnhanced
  locale={locale}
  userId={userId}
  userRole="guide" // or "transport"
  initialSlots={slots}
  pendingRequests={requests}
  initialHolds={holds}
/>
```

### Request Hold Button
Location: `components/availability/request-hold-button.tsx`

**Features:**
- Button to open hold request modal
- Date range selection (start/end dates)
- Optional message field
- Validation (end date must be after start date)
- Info box explaining hold process
- Success/error messaging

**Usage:**
```tsx
<RequestHoldButton
  holdeeId={guideId}
  holdeeType="guide"
  holdeeName={guideName}
  canRequestHold={userIsAgency}
/>
```

## Integration Points

### Profile Pages
Add the RequestHoldButton component to guide and transport profile pages:

```tsx
// In app/[locale]/profiles/guide/[id]/page.tsx
import { RequestHoldButton } from "@/components/availability/request-hold-button";

// Check if current user can request holds
const canRequestHold = user && ["agency", "dmc", "transport"].includes(currentUserRole);

// Add button near the top of the profile
<RequestHoldButton
  holdeeId={profile.id}
  holdeeType="guide"
  holdeeName={profile.full_name}
  canRequestHold={canRequestHold}
/>
```

### Availability Calendar Page
Use the enhanced calendar in availability management:

```tsx
// In app/[locale]/account/availability/page.tsx
import { AvailabilityCalendarEnhanced } from "@/components/account/availability/availability-calendar-enhanced";

// Fetch holds
const { data: holds } = await supabase
  .from("availability_holds")
  .select(`*, requester:agencies!availability_holds_requester_id_fkey(name)`)
  .eq("holdee_id", user.id)
  .in("status", ["pending", "accepted"]);

<AvailabilityCalendarEnhanced
  locale={locale}
  userId={user.id}
  userRole={profile.role}
  initialSlots={slots}
  pendingRequests={requests}
  initialHolds={holds}
/>
```

## Security & Access Control

### RLS Policies

1. **Holdees can view their holds**
   - Guides and transport can see holds on their availability

2. **Requesters can view their holds**
   - Agency/DMC/transport users can see holds created by their organization

3. **Agencies can create holds**
   - Users with agency/dmc/transport role and organization_id can create holds

4. **Holdees can respond**
   - Only the holdee can accept/decline their pending holds
   - Can only change status to 'accepted' or 'declined'
   - Must set responded_at timestamp

5. **Requesters can cancel**
   - Requesters can cancel their own pending holds

6. **Admins can manage all**
   - Admin and super_admin can view and manage all holds

### Validation

- Dates validated (end >= start)
- Conflict checking prevents overlapping accepted holds
- Expiry checking prevents responding to expired holds
- Foreign key enforcement ensures valid holdee/requester IDs

## Auto-Expiry System

**Function:** `expire_pending_holds()`

Marks pending holds as 'expired' if expires_at < now()

**Recommended Setup:**
Create a cron job or scheduled task to run this function periodically:

```sql
-- Run every hour
SELECT cron.schedule(
  'expire-pending-holds',
  '0 * * * *',
  'SELECT expire_pending_holds();'
);
```

## Testing Checklist

- [ ] Agency can create hold on guide availability
- [ ] Guide receives email notification
- [ ] Hold appears in guide's calendar (blue highlight)
- [ ] Guide can accept hold from calendar
- [ ] Accepting hold creates blocked slots
- [ ] Agency receives acceptance email
- [ ] Guide can decline hold
- [ ] Agency receives decline email
- [ ] Hold expires after 48 hours if not responded to
- [ ] Cannot accept overlapping holds
- [ ] Cannot create hold on dates with existing accepted hold
- [ ] Audit logs capture all hold actions
- [ ] RLS policies prevent unauthorized access
- [ ] Transport company can have holds on their availability
- [ ] DMCs can request holds

## Future Enhancements

1. **Hold extensions:** Allow extending expiry time
2. **Bulk holds:** Request holds on multiple guides at once
3. **Conditional holds:** "Accept if X is also available"
4. **Hold calendar view:** Separate view showing all holds
5. **Hold analytics:** Track accept/decline rates
6. **SMS notifications:** Add SMS alerts for urgent holds
7. **Hold notes:** Internal notes visible only to organization
8. **Hold templates:** Save common hold request patterns
9. **Priority holds:** VIP requesters get longer expiry times
10. **Hold deposits:** Require payment to confirm hold

## Files Created/Modified

### New Files:
- `supabase/migrations/20251005150000_availability_holds_system.sql`
- `scripts/apply-holds-migration.ts`
- `components/account/availability/availability-calendar-enhanced.tsx`
- `app/api/holds/route.ts`
- `app/api/holds/[id]/respond/route.ts`
- `AVAILABILITY_HOLDS_SYSTEM.md`

### Modified Files:
- `lib/email/resend.ts` - Added 3 hold notification functions

## Environment Variables

No additional environment variables required. Uses existing:
- `RESEND_API_KEY` - For sending emails
- `RESEND_FROM_EMAIL` - Sender email address
- `NEXT_PUBLIC_APP_URL` - Base URL for email links

## Database Migration Applied

✅ Migration `20251005150000_availability_holds_system.sql` has been applied successfully

**Verification:**
```bash
npx tsx scripts/apply-holds-migration.ts
```

Output: "✅ Availability holds system is ready!"
