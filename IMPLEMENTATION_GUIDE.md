# Complete Availability System - Implementation Guide

## 🎯 Quick Start

This guide will help you integrate the availability and hold system into your Guide Validator application.

## 📋 Prerequisites

- ✅ Database migration file created
- ✅ Components implemented
- ✅ Email notification system ready
- ✅ API endpoints created
- ✅ Documentation written

## 🚀 Step-by-Step Implementation

### Step 1: Apply Database Migration

**Method A: Via Supabase Dashboard (Recommended)**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20251001000008_availability_holds.sql`
5. Paste into the SQL editor
6. Click **Run**
7. Verify success: "Success. No rows returned"

**Method B: Via Command Line**

```bash
# If you have supabase CLI configured
supabase db push

# Or use psql directly
psql "postgresql://postgres:YOUR_PASSWORD@db.xxx.supabase.co:5432/postgres" \
  -f supabase/migrations/20251001000008_availability_holds.sql
```

**Verify Migration:**

```sql
-- Check table exists
SELECT * FROM availability_holds LIMIT 1;

-- Check functions exist
SELECT expire_pending_holds();
```

### Step 2: Configure Email Service

Choose your email provider and configure:

#### Option A: Resend (Recommended for Next.js)

```bash
npm install resend
```

Add to `.env.local`:
```env
RESEND_API_KEY=re_YourAPIKey
EMAIL_FROM=notifications@yourdomain.com
NEXT_PUBLIC_SITE_URL=http://localhost:3001  # or your production URL
```

Update `lib/notifications/hold-notifications.ts`:

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendHoldRequestNotification(data: HoldNotificationData) {
  // ... existing code ...

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM!,
      to: data.targetEmail,
      subject,
      html,
    });

    // Also store in database for in-app notifications
    await supabaseAdmin.from("notifications").insert({
      user_id: data.targetId,
      type: "hold_request",
      title: subject,
      message: `${data.requesterName} has requested a hold`,
      data: { hold_id: data.holdId },
    });

    return { success: true };
  } catch (error) {
    console.error("Error sending notification:", error);
    return { success: false, error };
  }
}
```

#### Option B: SendGrid

```bash
npm install @sendgrid/mail
```

```typescript
import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY!);

await sgMail.send({
  to: data.targetEmail,
  from: process.env.EMAIL_FROM!,
  subject,
  html,
});
```

### Step 3: Add Components to Pages

#### A. Update Availability Page

**File:** `app/[locale]/account/availability/page.tsx`

```typescript
import { EnhancedAvailabilityCalendar } from "@/components/account/availability/enhanced-availability-calendar";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function AvailabilityPage({ params }: { params: { locale: string } }) {
  const supabase = getSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${params.locale}/auth/sign-in`);
  }

  // Fetch slots
  const { data: slots } = await supabase
    .from("availability_slots")
    .select("*")
    .eq("owner_id", user.id)
    .order("starts_at");

  // Fetch holds
  const { data: holds } = await supabase
    .from("availability_holds")
    .select(`
      *,
      requester:profiles!availability_holds_requester_id_fkey(
        id,
        full_name,
        role
      )
    `)
    .eq("target_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Manage Availability</h1>

      <EnhancedAvailabilityCalendar
        locale={params.locale as any}
        userId={user.id}
        userRole={user.user_metadata.role}
        initialSlots={slots || []}
        initialHolds={holds || []}
      />
    </div>
  );
}
```

#### B. Add to Profile Pages

**Files:**
- `app/[locale]/profiles/guide/[id]/page.tsx`
- `app/[locale]/profiles/transport/[id]/page.tsx`

Add the import:
```typescript
import { RequestHoldButton } from "@/components/availability/request-hold-button";
```

Add the button near the profile header or actions section:
```typescript
// Inside your page component, after fetching current user
const { data: { user } } = await supabase.auth.getUser();

// In your JSX, add the button
<div className="flex gap-3">
  <RequestHoldButton
    targetId={profile.id}
    targetName={profile.full_name || profile.name}
    targetRole="guide" // or "transport"
    currentUserId={user?.id || ""}
    currentUserRole={user?.user_metadata?.role || ""}
    locale={params.locale}
  />

  {/* Other action buttons */}
</div>
```

### Step 4: Set Up Auto-Expiry Cron Job

#### Option A: Vercel Cron (if using Vercel)

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-holds",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

Create the cron endpoint: `app/api/cron/expire-holds/route.ts`

```typescript
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { processHoldNotifications } from "@/lib/notifications/hold-notifications";

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // Expire old holds
    await supabase.rpc("expire_pending_holds");

    // Send notifications for recently expired holds
    await processHoldNotifications();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Cron job error:", error);
    return NextResponse.json({ success: false, error }, { status: 500 });
  }
}
```

#### Option B: External Cron Service

Use a service like **cron-job.org**:

1. Sign up at https://cron-job.org
2. Create new cron job
3. URL: `https://yoursite.com/api/cron/expire-holds`
4. Schedule: Every 10 minutes (`*/10 * * * *`)
5. Add header: `Authorization: Bearer YOUR_CRON_SECRET`

### Step 5: Add Environment Variables

Update your `.env.local`:

```env
# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Email Service (choose one)
RESEND_API_KEY=re_...
# OR
SENDGRID_API_KEY=SG...
# OR
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...

# Email Configuration
EMAIL_FROM=notifications@yourdomain.com

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3001

# Cron Secret (generate with: openssl rand -base64 32)
CRON_SECRET=your_random_secret_here
```

### Step 6: Test the System

#### A. Test Database Functions

Open Supabase SQL Editor and run:

```sql
-- Test expire function
SELECT expire_pending_holds();

-- Test overlap detection
SELECT check_hold_overlap(
  'target-user-uuid'::uuid,
  '2025-01-15 10:00:00'::timestamptz,
  '2025-01-15 16:00:00'::timestamptz
);

-- Test hold stats
SELECT * FROM get_hold_stats('user-uuid'::uuid);
```

#### B. Test Calendar Interface

1. Navigate to `http://localhost:3001/en/account/availability`
2. Try drag-to-create:
   - Select "Mark Available" mode
   - Click and drag across several days
   - Release and verify slots created
3. Try mode switching between Available/Unavailable
4. Click on a day to view details
5. Verify slots can be updated and deleted

#### C. Test Hold Request

1. Sign in as an agency or DMC account
2. Navigate to a guide profile
3. Click "Request Hold" button
4. Fill in the form:
   - Select date range (future dates)
   - Add optional message
   - Add optional job reference
5. Submit and verify success message
6. Check database: `SELECT * FROM availability_holds ORDER BY created_at DESC LIMIT 1;`

#### D. Test Hold Response

1. Sign in as the guide account
2. Navigate to availability calendar
3. Verify hold appears (purple indicator)
4. Click the day with the hold
5. Click "Accept Hold"
6. Verify:
   - Hold status changed to `accepted`
   - Blocked slot created
   - Calendar shows blocked time (gray)

#### E. Test Email Notifications

1. Request a hold (as agency)
2. Check inbox of target guide
3. Verify email received with:
   - Requester details
   - Date range
   - Message
   - Link to calendar
   - 48h expiry warning

4. Accept the hold (as guide)
5. Check inbox of agency
6. Verify acceptance email received

#### F. Test Auto-Expiry

**Manual Test:**

```sql
-- Create a hold that's already expired
INSERT INTO availability_holds (
  requester_id,
  requester_role,
  target_id,
  target_role,
  starts_at,
  ends_at,
  status,
  expires_at
) VALUES (
  'requester-uuid',
  'agency',
  'target-uuid',
  'guide',
  NOW() + INTERVAL '1 day',
  NOW() + INTERVAL '2 days',
  'pending',
  NOW() - INTERVAL '1 hour'  -- Already expired
);

-- Run expire function
SELECT expire_pending_holds();

-- Check it changed to expired
SELECT * FROM availability_holds WHERE status = 'expired';
```

### Step 7: Deploy to Production

#### A. Update Production Environment Variables

In your hosting platform (Vercel, Railway, etc.):

```env
NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
RESEND_API_KEY=...
EMAIL_FROM=notifications@yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
CRON_SECRET=...
```

#### B. Configure Email Domain

For Resend/SendGrid:
1. Add your domain
2. Add DNS records (SPF, DKIM, DMARC)
3. Verify domain
4. Update `EMAIL_FROM` to use verified domain

#### C. Deploy

```bash
# Build and test locally first
npm run build
npm start

# Then deploy
git add .
git commit -m "Add availability and hold system"
git push

# Or deploy directly
vercel deploy --prod
```

#### D. Verify Production

1. Test hold request flow end-to-end
2. Verify emails are sent
3. Check cron job runs (Vercel Dashboard → Deployments → Functions → Cron)
4. Monitor database for expired holds
5. Check error logs

## 📊 Monitoring & Maintenance

### Database Queries for Monitoring

```sql
-- Active holds
SELECT COUNT(*) FROM availability_holds WHERE status = 'pending';

-- Holds expiring soon (next 24h)
SELECT * FROM availability_holds
WHERE status = 'pending'
AND expires_at < NOW() + INTERVAL '24 hours'
ORDER BY expires_at;

-- Hold statistics
SELECT
  status,
  COUNT(*) as count
FROM availability_holds
GROUP BY status;

-- Recent activity
SELECT
  h.*,
  r.full_name as requester_name,
  t.full_name as target_name
FROM availability_holds h
JOIN profiles r ON h.requester_id = r.id
JOIN profiles t ON h.target_id = t.id
WHERE h.created_at > NOW() - INTERVAL '7 days'
ORDER BY h.created_at DESC;
```

### Logs to Monitor

- Cron job execution logs
- Email sending errors
- Database RLS denials
- Failed hold requests
- Expired hold notifications

## 🐛 Troubleshooting

### Issue: Holds Not Expiring

**Symptoms:** Pending holds past 48 hours still showing as pending

**Solutions:**
1. Check if cron job is running:
   ```bash
   curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
     https://yoursite.com/api/cron/expire-holds
   ```

2. Manually run expire function:
   ```sql
   SELECT expire_pending_holds();
   ```

3. Check `expires_at` timestamps:
   ```sql
   SELECT id, status, expires_at, NOW()
   FROM availability_holds
   WHERE status = 'pending';
   ```

### Issue: Emails Not Sending

**Symptoms:** No email notifications received

**Solutions:**
1. Check API key is valid
2. Verify domain is verified
3. Check spam folder
4. View email service logs (Resend/SendGrid dashboard)
5. Test email service directly:
   ```typescript
   await resend.emails.send({
     from: 'notifications@yourdomain.com',
     to: 'your@email.com',
     subject: 'Test',
     html: '<p>Test email</p>'
   });
   ```

### Issue: Can't Create Hold

**Symptoms:** "Access denied" or RLS error

**Solutions:**
1. Verify user is agency or DMC:
   ```sql
   SELECT id, role FROM profiles WHERE id = 'user-uuid';
   ```

2. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'availability_holds';
   ```

3. Test policy manually:
   ```sql
   SET LOCAL ROLE authenticated;
   SET LOCAL request.jwt.claim.sub TO 'user-uuid';
   SELECT * FROM availability_holds;
   ```

### Issue: Drag-to-Create Not Working

**Symptoms:** Dragging doesn't select days

**Solutions:**
1. Check browser console for errors
2. Verify JavaScript is enabled
3. Test on different browser
4. Check CSS classes are applied
5. Verify `onMouseDown`, `onMouseEnter`, `onMouseUp` events fire

## 📈 Performance Optimization

### Database Indexes

Already created in migration:
- `idx_holds_requester` - Fast lookups by requester
- `idx_holds_target` - Fast lookups by target
- `idx_holds_status` - Fast filtering by status
- `idx_holds_dates` - Fast date range queries
- `idx_holds_expiry` - Fast expiry checks

### Query Optimization

Use these optimized queries in production:

```sql
-- Get user's holds with requester info (single query)
SELECT
  h.*,
  json_build_object(
    'id', p.id,
    'full_name', p.full_name,
    'role', p.role
  ) as requester
FROM availability_holds h
LEFT JOIN profiles p ON h.requester_id = p.id
WHERE h.target_id = 'user-uuid'
ORDER BY h.created_at DESC;
```

### Caching

Consider caching for:
- User's availability slots (refresh on change)
- Hold statistics (refresh every 5 minutes)
- Profile data (refresh every hour)

## 🎉 Success!

Your availability and hold system is now fully implemented! Users can:

- ✅ Drag to create availability slots
- ✅ Request holds on guide availability
- ✅ Accept/decline holds
- ✅ Receive email notifications
- ✅ Auto-expire holds after 48 hours
- ✅ View calendar with color-coded status

## 📚 Additional Resources

- Full Documentation: `docs/AVAILABILITY_SYSTEM.md`
- Quick Reference: `AVAILABILITY_SYSTEM_SUMMARY.md`
- Database Migration: `supabase/migrations/20251001000008_availability_holds.sql`
- Component Examples: `components/account/availability/` and `components/availability/`

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review database logs in Supabase dashboard
3. Check application logs in hosting platform
4. Verify RLS policies are applied
5. Test database functions manually

Happy coding! 🚀
