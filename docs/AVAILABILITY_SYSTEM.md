# Availability & Hold System Documentation

## Overview

The availability system allows guides and transport providers to manage their availability, and agencies/DMCs to place holds on that availability. The system includes drag-to-create slots, automatic expiry, and email notifications.

## Features

### For Guides & Transport Providers

1. **Drag-to-Create Availability**
   - Click and drag across calendar days to mark availability
   - Toggle between "Available" and "Unavailable" modes
   - Visual feedback during dragging with highlighted selection
   - Creates availability slots spanning multiple days

2. **Manual Slot Management**
   - Click on any day to view/edit slots
   - Update slot status (available/unavailable/blocked)
   - Delete slots as needed
   - View detailed time ranges

3. **Hold Management**
   - Receive hold requests from agencies/DMCs
   - See pending holds on calendar (purple)
   - Accept or decline holds within 48 hours
   - View hold details (dates, requester, message, job reference)
   - Accepted holds automatically block calendar

4. **Email Notifications**
   - Notified when hold is requested
   - See who requested and when it expires
   - Direct link to respond

### For Agencies & DMCs

1. **Request Holds**
   - Browse guide/transport profiles
   - Click "Request Hold" button
   - Select date range and add message
   - Optional job reference for tracking
   - System checks for overlaps (warns but allows)

2. **Track Hold Status**
   - View all sent hold requests
   - See pending, accepted, declined, and expired holds
   - Receive email notifications on status changes
   - 48-hour response window

3. **Email Notifications**
   - Notified when hold is accepted
   - Notified when hold is declined
   - Notified when hold expires (no response)

## Database Schema

### `availability_slots`

Stores guide/transport availability windows.

```sql
CREATE TABLE availability_slots (
  id uuid PRIMARY KEY,
  owner_id uuid REFERENCES profiles(id),
  owner_role text CHECK (owner_role IN ('guide', 'transport')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text CHECK (status IN ('available', 'blocked', 'unavailable')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Statuses:**
- `available` - Guide is available for bookings
- `blocked` - Time is held/booked (from accepted holds)
- `unavailable` - Guide is not available

### `availability_holds`

Stores hold requests from agencies/DMCs.

```sql
CREATE TABLE availability_holds (
  id uuid PRIMARY KEY,
  requester_id uuid REFERENCES profiles(id),
  requester_role text CHECK (requester_role IN ('agency', 'dmc')),
  target_id uuid REFERENCES profiles(id),
  target_role text CHECK (target_role IN ('guide', 'transport')),
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'cancelled')),
  message text,
  job_reference text,
  expires_at timestamptz DEFAULT (now() + interval '48 hours'),
  responded_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
```

**Statuses:**
- `pending` - Awaiting response (auto-expires in 48h)
- `accepted` - Guide accepted (creates blocked slot)
- `declined` - Guide declined
- `expired` - No response within 48 hours
- `cancelled` - Requester cancelled before response

## Key Functions

### Auto-Expiry

```sql
CREATE FUNCTION expire_pending_holds()
RETURNS void AS $$
BEGIN
  UPDATE availability_holds
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending' AND expires_at < now();
END;
$$ LANGUAGE plpgsql;
```

**Scheduling:**
- Called every minute by frontend auto-refresh
- Should be scheduled via cron job in production
- Updates all expired pending holds

### Overlap Detection

```sql
CREATE FUNCTION check_hold_overlap(
  p_target_id uuid,
  p_starts_at timestamptz,
  p_ends_at timestamptz
)
RETURNS boolean;
```

**Usage:**
- Check before creating hold request
- Warns user if overlap exists
- Allows proceeding (guide can still decline)

### Auto-Block on Accept

```sql
CREATE TRIGGER create_availability_block_on_accept
AFTER UPDATE ON availability_holds
FOR EACH ROW
WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
EXECUTE FUNCTION create_block_on_hold_accept();
```

**Behavior:**
- Automatically creates `blocked` slot when hold accepted
- Uses same dates as the hold
- Prevents double-booking

## Components

### `EnhancedAvailabilityCalendar`

**Location:** `components/account/availability/enhanced-availability-calendar.tsx`

**Features:**
- Monthly calendar view
- Drag-to-create availability slots
- Visual status indicators
- Hold management interface
- Accept/decline actions
- Auto-refresh for expiry

**Props:**
```typescript
{
  locale: SupportedLocale;
  userId: string;
  userRole: "guide" | "transport";
  initialSlots: AvailabilitySlot[];
  initialHolds: AvailabilityHold[];
}
```

**Usage:**
```tsx
<EnhancedAvailabilityCalendar
  locale="en"
  userId={user.id}
  userRole={user.role}
  initialSlots={slots}
  initialHolds={holds}
/>
```

### `RequestHoldModal`

**Location:** `components/availability/request-hold-modal.tsx`

**Features:**
- Date range picker
- Message and job reference fields
- Overlap detection
- Validation (dates, future only, etc.)
- Success confirmation

**Props:**
```typescript
{
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  targetRole: "guide" | "transport";
  requesterId: string;
  requesterRole: "agency" | "dmc";
  onSuccess?: () => void;
}
```

### `RequestHoldButton`

**Location:** `components/availability/request-hold-button.tsx`

**Features:**
- Shows only for agencies/DMCs
- Hides if viewing own profile
- Opens request modal
- Styled call-to-action button

**Usage on Profile Pages:**
```tsx
<RequestHoldButton
  targetId={profile.id}
  targetName={profile.name}
  targetRole={profile.role}
  currentUserId={currentUser.id}
  currentUserRole={currentUser.role}
  locale={locale}
/>
```

## Email Notifications

### Notification Types

1. **Hold Request** (`hold_request`)
   - Sent to: Target (guide/transport)
   - When: Hold is created
   - Contains: Requester info, dates, message, expiry time
   - CTA: "View & Respond to Hold"

2. **Hold Accepted** (`hold_accepted`)
   - Sent to: Requester (agency/DMC)
   - When: Target accepts hold
   - Contains: Confirmation, dates, next steps
   - CTA: "Message {target}"

3. **Hold Declined** (`hold_declined`)
   - Sent to: Requester (agency/DMC)
   - When: Target declines hold
   - Contains: Declined notice, alternative actions
   - CTA: "Browse Other Guides"

4. **Hold Expired** (`hold_expired`)
   - Sent to: Requester (agency/DMC)
   - When: 48 hours pass without response
   - Contains: Expiry notice, next steps
   - CTA: "Find Other Guides"

### Email Service Integration

The system is designed to work with email services like:
- **Resend** (recommended for Next.js)
- SendGrid
- Amazon SES
- Mailgun

**Configuration:**

1. Install email service SDK:
```bash
npm install resend
```

2. Set environment variables:
```env
RESEND_API_KEY=re_...
EMAIL_FROM=notifications@guidevalidator.com
```

3. Update `lib/notifications/hold-notifications.ts`:
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendHoldRequestNotification(data) {
  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: data.targetEmail,
    subject: 'New Availability Hold Request',
    html: '...'
  });
}
```

### Webhook Setup (Optional)

For production, set up a webhook to trigger notifications:

1. Create Supabase edge function or use Next.js API route
2. Configure database trigger to call webhook
3. Process notifications asynchronously

**Example Trigger:**
```sql
CREATE FUNCTION notify_hold_status_change()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://yoursite.com/api/notifications/hold-status',
    body := json_build_object(
      'holdId', NEW.id,
      'status', NEW.status
    )::text
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hold_status_notification
AFTER INSERT OR UPDATE ON availability_holds
FOR EACH ROW
EXECUTE FUNCTION notify_hold_status_change();
```

## User Flows

### Guide Creates Availability

1. Navigate to `/account/availability`
2. Select "Mark Available" or "Mark Unavailable" mode
3. Click and drag across days
4. Release to create slots
5. Slots appear on calendar with color coding

### Agency Requests Hold

1. Browse directory and find guide
2. Click "Request Hold" button
3. Fill in date range, message, job reference
4. Submit request
5. Receive confirmation
6. Guide receives email notification

### Guide Responds to Hold

1. Receive email notification
2. Click link to calendar
3. See hold on calendar (purple)
4. Click day to view details
5. Click "Accept" or "Decline"
6. Confirmation shown
7. If accepted, time is blocked
8. Requester receives email notification

### Hold Expires

1. 48 hours pass without response
2. Cron job runs `expire_pending_holds()`
3. Status changes to `expired`
4. Requester receives email notification
5. Hold removed from calendar

## RLS Policies

### Availability Slots

- Owners can view/edit/delete their own slots
- All authenticated users can view others' available slots
- Blocked/unavailable slots only visible to owner
- Admins can view all slots

### Availability Holds

- Requesters can view their own holds
- Targets can view holds placed on them
- Requesters can cancel pending holds
- Targets can accept/decline holds
- Admins can view all holds

## Testing

### Manual Testing Checklist

**Drag-to-Create:**
- [ ] Drag creates slots spanning multiple days
- [ ] Visual preview shows during drag
- [ ] Mode switching works (available/unavailable)
- [ ] Release creates actual slots in database

**Hold Request:**
- [ ] Modal opens from profile page
- [ ] Date validation works (future only, end > start)
- [ ] Overlap detection warns user
- [ ] Success creates database entry
- [ ] Email sent to target

**Hold Response:**
- [ ] Accept creates blocked slot
- [ ] Decline removes hold
- [ ] Email sent to requester
- [ ] Calendar updates immediately

**Auto-Expiry:**
- [ ] Holds expire after 48 hours
- [ ] Status changes to `expired`
- [ ] Email sent to requester
- [ ] Removed from calendar

### API Testing

```bash
# Test hold request notification
curl -X POST http://localhost:3000/api/notifications/hold-status \
  -H "Content-Type: application/json" \
  -d '{"holdId": "uuid-here", "type": "request"}'

# Test hold accepted notification
curl -X POST http://localhost:3000/api/notifications/hold-status \
  -H "Content-Type: application/json" \
  -d '{"holdId": "uuid-here", "type": "accepted"}'
```

## Production Deployment

### Required Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email Service (example: Resend)
RESEND_API_KEY=re_...
EMAIL_FROM=notifications@guidevalidator.com

# Site URL
NEXT_PUBLIC_SITE_URL=https://guidevalidator.com
```

### Cron Jobs

Set up cron jobs to run periodically:

1. **Expire Pending Holds** (every 5-10 minutes)
```bash
*/10 * * * * curl -X POST https://yoursite.com/api/cron/expire-holds
```

2. **Send Pending Notifications** (every 5 minutes)
```bash
*/5 * * * * curl -X POST https://yoursite.com/api/cron/send-notifications
```

### Database Migrations

1. Apply migration:
```bash
supabase migration up
```

2. Verify tables created:
```sql
SELECT * FROM availability_holds LIMIT 1;
```

3. Test functions:
```sql
SELECT expire_pending_holds();
SELECT check_hold_overlap(
  'target-uuid',
  '2025-01-01 00:00:00',
  '2025-01-02 00:00:00'
);
```

## Troubleshooting

### Holds Not Expiring

**Issue:** Pending holds stay pending past 48 hours

**Solutions:**
- Check if cron job is running
- Manually call `SELECT expire_pending_holds();`
- Verify `expires_at` is set correctly
- Check server timezone settings

### Email Not Sending

**Issue:** Users not receiving notifications

**Solutions:**
- Verify email service API key is valid
- Check spam/junk folders
- Review API logs for errors
- Test email service directly
- Verify `EMAIL_FROM` domain is verified

### Overlapping Holds

**Issue:** Multiple holds on same dates

**Solutions:**
- This is allowed by design (guide can decline)
- Overlap detection only warns, doesn't block
- Guide sees all holds and can accept one
- Consider adding strict blocking if needed

### Calendar Not Updating

**Issue:** Changes don't appear on calendar

**Solutions:**
- Check browser console for errors
- Verify RLS policies allow access
- Clear browser cache
- Check network tab for failed requests
- Manually refresh page

## Future Enhancements

1. **Partial Day Availability**
   - Allow hour-based slots instead of full days
   - More granular availability control

2. **Recurring Availability**
   - Set weekly patterns (e.g., "Available every Mon-Fri")
   - Batch create slots

3. **Hold Priority/Bidding**
   - Allow guides to prioritize holds
   - Let multiple agencies bid for same dates

4. **Calendar Sync**
   - Export to Google Calendar, Outlook
   - Two-way sync for updates

5. **Advanced Analytics**
   - Hold acceptance rate
   - Popular date ranges
   - Booking conversion metrics

6. **Mobile App**
   - Native mobile calendar
   - Push notifications
   - Quick accept/decline

## Support

For issues or questions:
- Check logs in Supabase dashboard
- Review RLS policies if access denied
- Test database functions directly
- Contact support with hold ID for specific issues
