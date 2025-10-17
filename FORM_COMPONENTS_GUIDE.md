# Application Form Components Guide

## Overview
This guide documents the reusable form components created for the Guide Validator application system.

## Components Created

### 1. TimezoneSelect
**Location:** `components/form/timezone-select.tsx`

**Purpose:** Dropdown selector for timezones with GMT offsets

**Props:**
```typescript
{
  value: string;           // Selected timezone value
  onChange: (value: string) => void;
  label: string;           // Field label
  required?: boolean;      // Whether field is required
  id?: string;            // Input ID
}
```

**Usage:**
```tsx
<TimezoneSelect
  value={formData.timezone}
  onChange={(value) => setFormData({ ...formData, timezone: value })}
  label="Primary Timezone"
  required
  id="timezone"
/>
```

---

### 2. WorkingHoursInput
**Location:** `components/form/working-hours-input.tsx`

**Purpose:** Day selection with time range inputs. Supports bulk time setting or individual day configuration.

**Props:**
```typescript
{
  value: WorkingHoursData;  // Object with day keys and hour data
  onChange: (value: WorkingHoursData) => void;
  label?: string;
}

// WorkingHoursData structure:
{
  monday: { enabled: boolean, startTime: string, endTime: string },
  tuesday: { enabled: boolean, startTime: string, endTime: string },
  // ... etc for each day
}
```

**Features:**
- Checkbox per day to enable/disable
- Individual time dropdowns per day (00:00 - 23:59)
- Bulk mode to set same hours for all selected days
- "Select All" / "Clear All" quick actions
- Visual color coding (green for enabled, gray for disabled)

**Usage:**
```tsx
<WorkingHoursInput
  value={formData.workingHours}
  onChange={(value) => setFormData({ ...formData, workingHours: value })}
  label="Working Hours"
/>
```

---

### 3. PlanSelector
**Location:** `components/form/plan-selector.tsx`

**Purpose:** Radio button selector for subscription plans filtered by user role

**Props:**
```typescript
{
  role: "guide" | "agency" | "dmc" | "transport";
  value: string;                    // Selected plan ID
  onChange: (planId: string) => void;
  label?: string;
  preselectedPlan?: string;         // Plan ID from pricing page URL
}
```

**Features:**
- Automatically filters plans by role
- Pre-selects plan if passed from pricing page
- Shows plan name, price, and description
- Visual selection with border highlighting
- Enterprise plan shows contact notice

**Plan IDs by Role:**
- **Guide:** `guide-free`, `guide-premium`, `guide-verification`
- **Agency:** `agency-basic`, `agency-pro`
- **DMC:** `dmc-core`, `dmc-multimarket`, `dmc-enterprise`
- **Transport:** `transport-subscription`, `transport-verified`, `transport-growth`

**Usage:**
```tsx
// Get plan from URL: ?plan=agency-pro
const searchParams = useSearchParams();
const preselectedPlan = searchParams.get('plan');

<PlanSelector
  role="agency"
  value={formData.subscriptionPlan}
  onChange={(planId) => setFormData({ ...formData, subscriptionPlan: planId })}
  preselectedPlan={preselectedPlan}
/>
```

---

### 4. CustomLanguageInput
**Location:** `components/form/custom-language-input.tsx`

**Purpose:** Multi-select checkbox grid for languages with ability to add custom languages

**Props:**
```typescript
{
  value: string[];                  // Array of selected languages
  onChange: (languages: string[]) => void;
  label?: string;
  availableLanguages?: string[];    // Override default language list
}
```

**Features:**
- Checkbox grid of 30+ common languages
- Selected languages shown as removable chips
- "+ Add a language not listed" button
- Free-text input for custom languages
- Validation: at least one language required

**Usage:**
```tsx
<CustomLanguageInput
  value={formData.languages}
  onChange={(languages) => setFormData({ ...formData, languages })}
  label="Languages Spoken"
/>
```

---

### 5. LoginCredentialsInput
**Location:** `components/form/login-credentials-input.tsx`

**Purpose:** Secure email/password collection for account creation (activated on approval)

**Props:**
```typescript
{
  email: string;
  password: string;
  confirmPassword: string;
  onEmailChange: (email: string) => void;
  onPasswordChange: (password: string) => void;
  onConfirmPasswordChange: (confirmPassword: string) => void;
}
```

**Features:**
- Email validation (HTML5 email type)
- Password visibility toggle
- Password strength indicator (weak/medium/strong)
- Confirm password matching validation
- Visual feedback for password match/mismatch
- Notice that account activates on approval

**Validation Rules:**
- Email: valid email format required
- Password: minimum 8 characters, strong password recommended
- Passwords must match

**Usage:**
```tsx
<LoginCredentialsInput
  email={formData.email}
  password={formData.password}
  confirmPassword={formData.confirmPassword}
  onEmailChange={(email) => setFormData({ ...formData, email })}
  onPasswordChange={(password) => setFormData({ ...formData, password })}
  onConfirmPasswordChange={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
/>
```

---

## Integration Guide

### Step 1: Update Application Forms

Each application form needs to be updated to include these components. Forms to update:
- `components/auth/applications/guide-sign-up-form.tsx`
- `components/auth/applications/agency-sign-up-form.tsx` (if exists)
- `components/auth/applications/dmc-sign-up-form.tsx` (if exists)
- `components/auth/applications/transport-sign-up-form.tsx` (if exists)

### Step 2: Add Fields to Form State

```tsx
const [formData, setFormData] = useState({
  // Existing fields...

  // New fields
  email: "",
  password: "",
  confirmPassword: "",
  timezone: "",
  availabilityTimezone: "",
  workingHours: {
    monday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    tuesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    wednesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    thursday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    friday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    saturday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    sunday: { enabled: false, startTime: "09:00", endTime: "17:00" },
  },
  subscriptionPlan: "",
  languages: [],
});
```

### Step 3: Update Pricing Page Links

Modify pricing page to pass plan parameter:

**Current:**
```tsx
href: withLocale("/[locale]/auth/sign-up/agency")
```

**Updated:**
```tsx
href: withLocale("/[locale]/auth/sign-up/agency?plan=agency-pro")
```

### Step 4: Handle Avatar from Uploads

When processing logo/profile picture uploads, save the URL to the `avatar_url` field:

```tsx
// After uploading logo or profile picture
const { data: uploadData } = await supabase.storage
  .from('profiles')
  .upload(`${userId}/logo.png`, file);

// Update profile with avatar
await supabase
  .from('profiles')
  .update({ avatar_url: uploadData.path })
  .eq('id', userId);
```

### Step 5: Create User Account on Application Submission

Update the application submission handler to create Supabase auth user:

```tsx
// In application form submission
const { data: authData, error: authError } = await supabase.auth.signUp({
  email: formData.email,
  password: formData.password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/confirm`,
    data: {
      role: 'guide', // or agency, dmc, transport
      pending_approval: true,
    }
  }
});

if (authError) {
  // Handle error
}

// Store application data with user ID
const applicationData = {
  user_id: authData.user?.id,
  subscription_plan: formData.subscriptionPlan,
  timezone: formData.timezone,
  availability_timezone: formData.availabilityTimezone,
  working_hours: JSON.stringify(formData.workingHours),
  languages: formData.languages,
  status: 'pending',
  // ... other application fields
};
```

### Step 6: Database Schema Updates

Ensure these fields exist in your tables:

**profiles table:**
```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS availability_timezone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS working_hours JSONB;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

**applications table (if separate):**
```sql
-- Same fields as above if you store in a separate applications table
```

---

## Workflow: From Application to Active Account

1. **User fills application** → Enters all details including login credentials
2. **Account created** → Supabase auth user created with `pending_approval: true`
3. **Account disabled** → User cannot login yet
4. **Admin reviews** → Admin reviews application in admin panel
5. **Approval** → Admin approves application
6. **Account activated** → `pending_approval` flag removed, user can now login
7. **Welcome email sent** → User receives email with login instructions

---

## Testing Checklist

- [ ] Timezone dropdown shows all timezones and saves correctly
- [ ] Working hours can be set per day individually
- [ ] Bulk mode sets same hours for all selected days
- [ ] Plan selector shows correct plans for each role
- [ ] Plan pre-selection works when coming from pricing page
- [ ] Languages can be selected and custom languages added
- [ ] Email validation works
- [ ] Password strength indicator updates correctly
- [ ] Password match validation works
- [ ] Account created but login disabled until approval
- [ ] Avatar set from uploaded logo/profile picture
- [ ] All data saves correctly to database

---

## Next Steps

1. Integrate components into existing application forms
2. Update database schema with new fields
3. Modify admin approval workflow to activate accounts
4. Test complete application-to-approval-to-login flow
5. Add email notifications for approval status
