# Phase 2: Complete User Flows - Implementation Plan

## Overview

**Goal**: Fix all incomplete user flows identified in the flow analysis, focusing on job applications, profile completion, bookings, and reviews.

**Timeline**: 8-10 weeks
**Priority**: HIGH - Critical for platform functionality

**Dependencies**: Phase 1 (Subscriptions) should be completed first

---

## Phase 2.1: Job Application System (Week 1-3) ⚡ CRITICAL

### Current State
- Jobs can be posted by Agencies/DMCs
- Guides can VIEW jobs but **cannot apply**
- No application management dashboard
- Complete dead-end for the jobs feature

### Task 2.1.1: Build Job Application Form (Week 1)

**File to Create**: `app/[locale]/jobs/[jobId]/apply/page.tsx`

```typescript
export default async function JobApplicationPage({
  params
}: {
  params: { locale: string; jobId: string }
}) {
  // 1. Verify user is logged in
  // 2. Verify user is a guide
  // 3. Fetch job details
  // 4. Check if already applied
  // 5. Render application form
}
```

**Component**: `components/jobs/application-form.tsx`

**Form Fields**:
```typescript
{
  jobId: string;
  applicantId: string;
  coverLetter: string; // Required, 200-1000 chars
  proposedRate?: number; // Optional if job specifies rate
  currency?: string;
  availabilityConfirmed: boolean; // Checkbox
  portfolio?: string[]; // Links to previous work
  yearsExperience: number;
  relevantCertifications?: string;
  references?: string; // Contact info for 2 references
}
```

**UI Requirements**:
- Show job details at top (read-only)
- Rich text editor for cover letter
- File upload for portfolio attachments
- Clear CTA: "Submit Application"
- Loading states
- Success confirmation page

### Task 2.1.2: Database Schema for Applications

**Migration**: `supabase/migrations/XXXXXX_create_job_applications.sql`

```sql
CREATE TABLE IF NOT EXISTS public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'reviewing', 'shortlisted', 'accepted', 'rejected', 'withdrawn')
  ),
  cover_letter TEXT NOT NULL,
  proposed_rate_cents INTEGER,
  currency CHAR(3) DEFAULT 'EUR',
  availability_confirmed BOOLEAN NOT NULL DEFAULT false,
  portfolio_links JSONB DEFAULT '[]'::jsonb,
  years_experience INTEGER,
  certifications TEXT,
  references TEXT,
  viewed_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  decision_notes TEXT, -- Internal notes from job poster
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id) -- Can't apply twice to same job
);

CREATE INDEX idx_job_applications_job_id ON public.job_applications(job_id);
CREATE INDEX idx_job_applications_applicant_id ON public.job_applications(applicant_id);
CREATE INDEX idx_job_applications_status ON public.job_applications(status);
CREATE INDEX idx_job_applications_created_at ON public.job_applications(created_at DESC);

-- RLS Policies
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;

-- Applicants can view their own applications
CREATE POLICY "Applicants can view own applications"
ON public.job_applications FOR SELECT
USING (auth.uid() = applicant_id);

-- Applicants can create applications
CREATE POLICY "Applicants can create applications"
ON public.job_applications FOR INSERT
WITH CHECK (auth.uid() = applicant_id);

-- Applicants can withdraw their applications
CREATE POLICY "Applicants can update own applications"
ON public.job_applications FOR UPDATE
USING (auth.uid() = applicant_id AND status IN ('pending', 'reviewing'));

-- Job posters can view applications for their jobs
CREATE POLICY "Job posters can view applications for their jobs"
ON public.job_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_applications.job_id
    AND jobs.poster_id = auth.uid()
  )
);

-- Job posters can update application status
CREATE POLICY "Job posters can update application status"
ON public.job_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.jobs
    WHERE jobs.id = job_applications.job_id
    AND jobs.poster_id = auth.uid()
  )
);
```

### Task 2.1.3: Application Submission API

**API Route**: `app/api/jobs/[jobId]/apply/route.ts`

```typescript
export async function POST(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  // 1. Verify authentication
  // 2. Verify user is a guide
  // 3. Verify job exists and is open
  // 4. Check subscription (may require premium)
  // 5. Check if already applied
  // 6. Create application record
  // 7. Send notification email to job poster
  // 8. Return success
}
```

**Validation**:
- Cover letter: 200-1000 characters
- Rate proposal: reasonable range
- Availability must be checked
- Can't apply to expired jobs
- Can't apply if status is 'filled' or 'closed'

### Task 2.1.4: Applications Management Dashboard (Week 2)

**Page**: `app/[locale]/account/jobs/applications/page.tsx`

**For Guides (Applicants)**:
- List all applications submitted
- Filter by status (pending, reviewing, accepted, rejected)
- View job details
- Withdraw application (if pending)
- Track response time

**UI Components**:
```
components/jobs/applicant-applications-list.tsx
components/jobs/application-status-badge.tsx
components/jobs/withdraw-application-dialog.tsx
```

### Task 2.1.5: Application Review Dashboard (Week 2-3)

**Page**: `app/[locale]/account/jobs/[jobId]/applicants/page.tsx`

**For Job Posters (Agencies/DMCs)**:
- View all applications for a specific job
- Filter/sort:
  - Status (pending, shortlisted, etc.)
  - Date applied
  - Years of experience
  - Proposed rate
- Actions:
  - View full application
  - Shortlist
  - Accept
  - Reject
  - Send message to applicant
- Bulk actions:
  - Reject all pending
  - Export to CSV

**UI Components**:
```
components/jobs/applications-dashboard.tsx
components/jobs/application-card.tsx
components/jobs/application-detail-modal.tsx
components/jobs/application-actions.tsx
components/jobs/bulk-actions-toolbar.tsx
```

### Task 2.1.6: Email Notifications for Applications

**Templates to Create**:

1. **Application Submitted** (to applicant):
```
Subject: Your application to [Job Title] has been submitted
Body:
- Confirmation of submission
- What happens next
- Expected response time
- Link to view application
```

2. **New Application Received** (to job poster):
```
Subject: New application for [Job Title]
Body:
- Applicant name
- Summary of qualifications
- Link to review application
- CTA to view dashboard
```

3. **Application Status Updated** (to applicant):
```
Subject: Update on your application to [Job Title]
Body:
- Status change (shortlisted, accepted, rejected)
- Message from poster (if any)
- Next steps
```

**Files**:
```
lib/email/templates/job-application-submitted.ts
lib/email/templates/job-application-received.ts
lib/email/templates/job-application-status-updated.ts
lib/email/send-job-email.ts
```

### Task 2.1.7: Add "Apply" Button to Job Listings

**Modifications**:
- `components/jobs/job-card.tsx` - Add "Apply Now" button
- `app/[locale]/jobs/[jobId]/page.tsx` - Add prominent "Apply" CTA
- Show "Applied" badge if user already applied
- Disable if job is closed/filled
- Redirect to login if not authenticated

---

## Phase 2.2: Profile Completion & Onboarding (Week 4-5)

### Task 2.2.1: Unified Profile Completion Flow

**Goal**: Make ALL users (not just bulk uploads) go through profile completion

**Current Issue**:
- Bulk uploads get completion links
- Regular sign-ups don't
- Inconsistent experience

**Solution**: After approval, EVERYONE gets completion link

**Updates Needed**:

1. **Modify Admin Approval**:
```typescript
// app/api/admin/applications/approve/route.ts
export async function POST(request: Request) {
  // ...existing approval logic...

  // Generate profile completion token
  const token = generateProfileCompletionToken();

  // Store in guides/agencies application_data
  await supabase
    .from('guides')
    .update({
      application_data: {
        ...existingData,
        profile_completion_token: token,
        profile_completion_link: generateProfileCompletionLink(token, 'en')
      }
    })
    .eq('profile_id', userId);

  // Send welcome email with completion link
  await sendWelcomeEmail(user, token);
}
```

2. **Profile Completeness Checker**:

**File**: `lib/profile/completeness.ts`

```typescript
export function checkProfileCompleteness(profile: Profile) {
  const required = {
    guide: [
      'full_name',
      'date_of_birth',
      'nationality',
      'phone',
      'city',
      'license_number',
      'license_authority',
      'languages',
      'specialties',
      'location_data',
      'professional_intro',
      'years_experience',
      'timezone'
    ],
    agency: [
      'name',
      'registration_number',
      'country_code',
      'contact_phone',
      'languages',
      'description'
    ],
    // ... other roles
  };

  const roleFields = required[profile.role] || [];
  const completed = roleFields.filter(field => profile[field] != null).length;
  const total = roleFields.length;
  const percentage = Math.round((completed / total) * 100);

  return {
    percentage,
    completed,
    total,
    missing: roleFields.filter(field => profile[field] == null),
    isComplete: percentage === 100
  };
}
```

3. **Profile Completion Progress UI**:

**Component**: `components/account/profile-completion-progress.tsx`

```typescript
export function ProfileCompletionProgress({ profile }: { profile: Profile }) {
  const completion = checkProfileCompleteness(profile);

  return (
    <div className="border rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3>Profile Completeness</h3>
        <span className="text-2xl font-bold">{completion.percentage}%</span>
      </div>
      <ProgressBar value={completion.percentage} />
      {completion.missing.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-600 mb-2">Missing fields:</p>
          <ul className="text-sm">
            {completion.missing.map(field => (
              <li key={field}>• {fieldLabels[field]}</li>
            ))}
          </ul>
          <Button className="mt-4" href="/account/profile/edit">
            Complete Profile
          </Button>
        </div>
      )}
    </div>
  );
}
```

### Task 2.2.2: Onboarding Wizard

**Goal**: Step-by-step guided setup for new users

**Page**: `app/[locale]/onboarding/wizard/page.tsx`

**Steps**:
1. Welcome & Overview
2. Personal Information
3. Professional Details
4. Verification Documents (for guides)
5. Locations & Availability
6. Subscription Setup (if paid plan)
7. Review & Submit

**Components**:
```
components/onboarding/wizard-container.tsx
components/onboarding/step-indicator.tsx
components/onboarding/step-personal-info.tsx
components/onboarding/step-professional-details.tsx
components/onboarding/step-verification.tsx
components/onboarding/step-locations.tsx
components/onboarding/step-subscription.tsx
components/onboarding/step-review.tsx
```

**Features**:
- Progress bar showing current step
- Save draft at any step
- Skip optional steps
- Validate before proceeding
- Final review before submission

### Task 2.2.3: Account Dashboard with Status

**Update**: `app/[locale]/account/page.tsx`

**Add Status Card**:
```typescript
<DashboardCard>
  <AccountStatus profile={profile} />
</DashboardCard>
```

**Account Status Component** shows:
```
✓ Application Submitted
✓ Application Approved
⏳ Complete Profile (60% done) ← Click to complete
  Profile Live in Directory
  First Review Received
```

**Visual States**:
- ✓ Green checkmark for completed
- ⏳ Yellow spinner for in-progress
- ○ Gray circle for not started
- ✗ Red X for issues

---

## Phase 2.3: Booking & Hold Management (Week 6-7)

### Task 2.3.1: Structured Booking Request System

**Current**: Just messaging
**New**: Formal booking request workflow

**Database Schema**:

```sql
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES public.profiles(id),
  provider_id UUID NOT NULL REFERENCES public.profiles(id),
  provider_type TEXT NOT NULL CHECK (provider_type IN ('guide', 'agency', 'dmc', 'transport')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'declined', 'cancelled', 'completed')
  ),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  group_size INTEGER,
  services_needed TEXT NOT NULL,
  budget_cents INTEGER,
  currency CHAR(3) DEFAULT 'EUR',
  special_requirements TEXT,
  contact_preferences TEXT,
  provider_response TEXT,
  confirmed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_requests_requester ON public.booking_requests(requester_id);
CREATE INDEX idx_booking_requests_provider ON public.booking_requests(provider_id);
CREATE INDEX idx_booking_requests_status ON public.booking_requests(status);
```

### Task 2.3.2: Booking Request Form

**Component**: `components/bookings/request-form.tsx`

**Fields**:
- Date range (start/end)
- Number of people
- Services needed (textarea)
- Budget range
- Special requirements
- Preferred contact method

**Page**: `app/[locale]/bookings/request/[profileId]/page.tsx`

### Task 2.3.3: Bookings Dashboard

**Page**: `app/[locale]/account/bookings/page.tsx`

**Tabs**:
- **Pending Requests** (awaiting response)
- **Confirmed Bookings**
- **Past Bookings**
- **Cancelled**

**Actions**:
- View details
- Accept/Decline (for providers)
- Cancel booking
- Mark as completed
- Leave review (after completion)

### Task 2.3.4: Calendar Integration for Holds

**Update**: Availability calendar to block dates for confirmed bookings

**Features**:
- Visual indication of holds vs bookings
- Automatic blocking when booking confirmed
- Release dates if booking cancelled
- Prevent double-booking

---

## Phase 2.4: Review System Automation (Week 8)

### Task 2.4.1: Automated Review Requests

**Trigger**: When booking marked as "completed"

**Email Template**: `lib/email/templates/review-request.ts`

**Timing**:
- Send immediately after completion
- Reminder after 3 days if not submitted
- Final reminder after 7 days

### Task 2.4.2: Review Management Dashboard

**Page**: `app/[locale]/admin/reviews/manage/page.tsx`

**Features**:
- View all reviews
- Flag inappropriate reviews
- Approve/reject (if moderation enabled)
- Respond to reviews (as platform admin)
- Handle disputes

---

## Phase 2.5: Contact Form Integration (Week 9)

### Task 2.5.1: Contact Form Workflow

**Current**: Form submits, nothing happens
**New**: Creates inquiry record, routes to appropriate team

**Database**:
```sql
CREATE TABLE IF NOT EXISTS public.contact_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_type TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed')),
  assigned_to UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Inquiry Types**:
- Hiring a guide
- Post a job
- Pricing questions
- Technical support
- Partnership inquiry
- Other

### Task 2.5.2: Admin Inquiry Dashboard

**Page**: `app/[locale]/admin/inquiries/page.tsx`

**Features**:
- View all inquiries
- Filter by type/status
- Assign to team member
- Respond directly
- Mark as resolved
- Track response time

---

## Deliverables Checklist

### Week 1-3: Job Applications ✅
- [ ] Job application form created
- [ ] Database schema deployed
- [ ] Application submission API working
- [ ] Applicant dashboard built
- [ ] Application review dashboard built
- [ ] Email notifications sending
- [ ] "Apply" buttons added to jobs

### Week 4-5: Onboarding ✅
- [ ] Profile completion flow unified
- [ ] Completion progress UI added
- [ ] Onboarding wizard created
- [ ] Account dashboard shows status
- [ ] Post-approval emails sending

### Week 6-7: Bookings ✅
- [ ] Booking request system built
- [ ] Bookings dashboard created
- [ ] Calendar integration working
- [ ] Email notifications for bookings

### Week 8: Reviews ✅
- [ ] Automated review requests
- [ ] Review management dashboard
- [ ] Dispute handling process

### Week 9: Contact Form ✅
- [ ] Contact inquiries tracked
- [ ] Admin inquiry dashboard
- [ ] Response workflow

---

## Success Metrics

After Phase 2:

1. **Job Applications**:
   - 100% of jobs have "Apply" button
   - Application submissions tracked
   - 90%+ of applications receive response within 7 days

2. **Profile Completion**:
   - All new users receive completion link
   - Average profile completeness: 85%+
   - Onboarding completion rate: 70%+

3. **Bookings**:
   - Structured booking requests vs ad-hoc messages: 80%+
   - Calendar sync accuracy: 100%
   - Booking confirmation rate: 60%+

4. **Reviews**:
   - Review request sent after 100% of completions
   - Review submission rate: 40%+
   - Response time to reviews: <2 days

---

## Files Summary

### New Files (~50)
```
Job Applications:
- app/[locale]/jobs/[jobId]/apply/page.tsx
- components/jobs/application-form.tsx
- app/api/jobs/[jobId]/apply/route.ts
- app/[locale]/account/jobs/applications/page.tsx
- app/[locale]/account/jobs/[jobId]/applicants/page.tsx
- components/jobs/* (10+ components)
- lib/email/templates/* (3 templates)
- supabase/migrations/*_create_job_applications.sql

Onboarding:
- app/[locale]/onboarding/wizard/page.tsx
- components/onboarding/* (7 components)
- lib/profile/completeness.ts
- components/account/profile-completion-progress.tsx

Bookings:
- components/bookings/request-form.tsx
- app/[locale]/bookings/request/[profileId]/page.tsx
- app/[locale]/account/bookings/page.tsx
- supabase/migrations/*_create_booking_requests.sql

Reviews:
- app/[locale]/admin/reviews/manage/page.tsx
- lib/email/templates/review-request.ts

Contact:
- supabase/migrations/*_create_contact_inquiries.sql
- app/[locale]/admin/inquiries/page.tsx
```

### Modified Files (~15)
```
- components/jobs/job-card.tsx
- app/[locale]/jobs/[jobId]/page.tsx
- app/[locale]/account/page.tsx
- app/api/admin/applications/approve/route.ts
- components/profile/interactive-availability-calendar.tsx
```

---

## Next Steps After Phase 2

With core flows complete, focus on:
- **Phase 3**: Advanced Features (analytics, reporting, API)
- **Phase 4**: Performance & Scale (caching, optimization)
- **Phase 5**: Marketing & Growth (SEO, referrals, partnerships)
