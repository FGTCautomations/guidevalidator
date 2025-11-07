# Profile Completion Form - Complete Feature Parity

## Overview

The profile completion form now has **complete feature parity** with the original guide sign-up form. All sections and fields are identical.

## All Sections Included

### 1. Personal Information
- Full legal name
- Date of birth
- Nationality (country dropdown)
- Phone / WhatsApp
- City of residence

### 2. Official License
- License number
- Issuing authority
- Upload official guide license (optional if already uploaded)
- Upload ID / passport copy (optional if already uploaded)

### 3. Specialisations & Expertise
- Languages spoken (CustomLanguageInput component)
- Tour types / specialisations (checkboxes)
- Areas of expertise or themes (checkboxes)
- Operating Locations (MultiCountryLocationSelectorDB)

### 4. Profile & Portfolio
- Profile photo upload (optional if already uploaded)
- Short introduction
- Years of guiding experience
- Experience summary
- Sample itineraries (title | link per line)
- Photos or videos (title | link per line)

### 5. Availability & Contact
- Primary timezone
- Availability timezone
- Working hours (day-by-day schedule with WorkingHoursInput)
- Availability notes
- Contact methods (channel | value per line)

### 6. Subscription & Billing
- Billing notes

## Files Updated

### 1. [components/onboarding/profile-completion-form.tsx](components/onboarding/profile-completion-form.tsx)
- Complete rewrite to include all sections
- Uses same UI components as sign-up form
- Handles file uploads via FormData
- 650+ lines of comprehensive form code

### 2. [app/[locale]/onboarding/complete-profile/page.tsx](app/[locale]/onboarding/complete-profile/page.tsx)
- Added countries prop by fetching from database
- Passes countries to ProfileCompletionForm component

### 3. [app/api/onboarding/complete-profile/route.ts](app/api/onboarding/complete-profile/route.ts)
- Changed from JSON to FormData handling
- Added file upload support for:
  - Profile photo → `profile-photos` bucket
  - License proof → `guide-documents` bucket
  - ID document → `guide-documents` bucket
- Updates both `guides` and `profiles` tables
- Parses structured data (itineraries, media, contact methods)
- Stores file URLs in database

## Data Flow

1. **Form Submission**: User fills out all fields and uploads files
2. **FormData**: Form data sent as multipart/form-data to API
3. **Token Verification**: API verifies profile completion token
4. **File Uploads**: Files uploaded to Supabase Storage buckets
5. **Database Updates**:
   - `guides` table: All profile/portfolio/availability data
   - `profiles` table: Personal information (name, DOB, nationality, phone, city, avatar)
6. **Success**: User redirected to their profile page

## Key Features

- **Complete Parity**: Every field from sign-up form is present
- **File Uploads**: Supports profile photo and document uploads
- **File Storage**: Uses Supabase Storage buckets (profile-photos, guide-documents)
- **Reusable Components**: Uses same form components as sign-up
- **Structured Data**: Parses pipe-delimited text into JSON structures
- **Token Security**: Validates token before allowing updates
- **Multi-Table Updates**: Updates both guides and profiles tables

## Field Mappings

### Guides Table
```typescript
{
  professional_intro,
  years_experience,
  experience_summary,
  sample_itineraries: JSON,
  media_gallery: JSON,
  timezone,
  availability_timezone,
  working_hours: JSON,
  availability_notes,
  contact_methods: JSON,
  spoken_languages: array,
  specialties: array,
  expertise_areas: array,
  location_data: JSON,
  license_number,
  license_authority,
  license_proof_url,  // If file uploaded
  id_document_url,    // If file uploaded
  profile_photo_url,  // If file uploaded
}
```

### Profiles Table
```typescript
{
  full_name,
  date_of_birth,
  country_code,
  phone,
  city,
  avatar_url,  // If profile photo uploaded
}
```

## Storage Buckets Used

1. **profile-photos**: Profile photos
   - File naming: `{guideId}_profile_{timestamp}.{ext}`

2. **guide-documents**: License proofs and ID documents
   - License: `{guideId}_license_{timestamp}.{ext}`
   - ID: `{guideId}_id_{timestamp}.{ext}`

## Usage

When a guide receives a profile completion link:

```
https://yoursite.com/en/onboarding/complete-profile?token={64-char-hex-token}
```

They will see a comprehensive form with all fields matching the original sign-up experience, allowing them to complete their entire profile in one go.

## Notes

- File uploads are **optional** (in case files were already uploaded during bulk upload or manual creation)
- All required fields are marked with red asterisks (*)
- Token remains valid after submission (can re-edit if needed)
- Form auto-redirects to profile page after 2 seconds on success
- Uses same styling and UX as original sign-up forms
