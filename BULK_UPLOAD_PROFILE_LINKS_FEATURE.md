# Bulk Upload with Profile Completion Links

## Overview

This feature allows administrators to bulk upload guide profiles and automatically generate unique profile completion links for each guide. These links allow guides to log in and complete their profiles independently.

## Features

### 1. Profile Completion Links

When you bulk upload guides:
- ✅ Each guide receives a **unique, secure token** (64-character hex string)
- ✅ A **profile completion link** is automatically generated and stored
- ✅ The link allows guides to **complete their profile** without admin assistance
- ✅ Links are stored in the guide's `application_data` field

**Link Format:**
```
https://your-domain.com/en/onboarding/complete-profile?token=abc123...xyz
```

### 2. Database Export to Excel

Administrators can now **export the entire database to Excel** with one click:
- ✅ All guides with their completion links
- ✅ All organizations (agencies, DMCs, transport companies)
- ✅ All profiles
- ✅ Organized in separate worksheets
- ✅ Includes all profile completion links

## How It Works

### For Administrators

#### Step 1: Bulk Upload Guides

1. Go to **Admin Dashboard** → **Bulk Upload**
2. Upload your Excel file with guide data
3. System automatically:
   - Creates auth user accounts
   - Creates profiles (with status "approved")
   - Creates guide records
   - **Generates unique profile completion token**
   - **Generates and stores completion link**

#### Step 2: Export Database

1. Go to **Admin Dashboard**
2. Click **"Export to Excel"** button (green button in header)
3. Download the Excel file
4. Open the file and find the **"Profile Completion Link"** column

#### Step 3: Share Links with Guides

You have several options:

**Option A: Email Manually**
- Copy each guide's completion link from the Excel export
- Email it to the guide with instructions

**Option B: Bulk Email (Future Enhancement)**
- Use a mail merge tool
- Send personalized emails to all guides

**Option C: Share via Admin Panel**
- View individual guide in admin panel
- Copy their completion link
- Share via preferred method

### For Guides

#### Step 1: Receive Completion Link

Guide receives an email with their unique link:
```
https://your-domain.com/en/onboarding/complete-profile?token=...
```

#### Step 2: Access Profile Completion Page

1. Click the link
2. No login required - token authenticates them
3. See their current profile information

#### Step 3: Complete Profile

Fill in:
- **Professional Headline** (required)
- **Bio / About You** (required)
- **Years of Experience** (required)
- **Specialties** (optional)
- **Languages Spoken** (required)
- **License Number** (optional)
- **License Authority** (optional)

#### Step 4: Submit

- Profile is immediately updated
- Redirected to their public profile page
- Profile now appears in directory (if approved)

## Technical Implementation

### Database Schema

**Profile Completion Data Storage:**
```json
{
  "application_data": {
    "profile_completion_token": "abc123...xyz",
    "profile_completion_link": "https://domain.com/en/onboarding/complete-profile?token=abc123...xyz",
    "contact_email": "guide@example.com",
    "contact_phone": "+1234567890",
    // ... other fields
  }
}
```

Stored in:
- `guides.application_data` (JSONB column)
- `agencies.application_data` (JSONB column)

### Files Created/Modified

#### New Files ✨

1. **[lib/admin/generate-profile-token.ts](lib/admin/generate-profile-token.ts)**
   - Token generation function
   - Link generation function

2. **[app/api/admin/export-database/route.ts](app/api/admin/export-database/route.ts)**
   - Database export API endpoint
   - Generates Excel with 3 worksheets

3. **[components/admin/export-database-button.tsx](components/admin/export-database-button.tsx)**
   - Export button component
   - Handles download

4. **[app/[locale]/onboarding/complete-profile/page.tsx](app/[locale]/onboarding/complete-profile/page.tsx)**
   - Profile completion page
   - Token validation
   - Form display

5. **[components/onboarding/profile-completion-form.tsx](components/onboarding/profile-completion-form.tsx)**
   - Profile completion form
   - Field validation
   - Submission handling

6. **[app/api/onboarding/complete-profile/route.ts](app/api/onboarding/complete-profile/route.ts)**
   - Profile update API
   - Token verification
   - Data validation

#### Modified Files 📝

1. **[app/api/admin/bulk-upload/route.ts](app/api/admin/bulk-upload/route.ts)**
   - Added token generation import
   - Generate token for each guide
   - Generate token for each organization
   - Store completion link in application_data

2. **[app/[locale]/admin/page.tsx](app/[locale]/admin/page.tsx)**
   - Added export button import
   - Added export button to header

## Security

### Token Security

✅ **Secure Random Generation**
- Uses Node.js `crypto.randomBytes(32)`
- 256-bit entropy
- 64 hexadecimal characters
- Cryptographically secure

✅ **Single-Use Recommended**
- Tokens can be marked as "used" (not implemented yet)
- Current implementation allows re-editing

✅ **No Auth Required**
- Token itself is the authentication
- No password needed for completion

### Recommendations

🔒 **For Production:**
1. Add token expiration (e.g., 30 days)
2. Mark tokens as "used" after first completion
3. Add rate limiting to completion endpoint
4. Log all profile completion activities
5. Send notification to admin when profile completed

## Excel Export Structure

### Worksheet 1: Guides

| Column | Description |
|--------|-------------|
| Email | Guide's auth email |
| Full Name | Guide's name |
| Country Code | ISO country code |
| Contact Email | Business contact email |
| Contact Phone | Business phone |
| Timezone | Timezone |
| Headline | Professional headline |
| Bio | Biography |
| Years Experience | Years of experience |
| Specialties | Comma-separated specialties |
| Languages | Comma-separated languages |
| License Number | License number |
| License Authority | License authority |
| Hourly Rate (cents) | Rate in cents |
| Currency | Currency code |
| Gender | Gender |
| Has Liability Insurance | Yes/No |
| Response Time (minutes) | Response time |
| Status | Application status |
| **Profile Completion Link** | 🔗 **Unique link for guide** |
| Created At | Creation timestamp |

### Worksheet 2: Organizations

| Column | Description |
|--------|-------------|
| Email | Organization's auth email |
| Type | agency/dmc/transport |
| Name | Organization name |
| Country Code | ISO country code |
| Contact Email | Business contact email |
| Contact Phone | Business phone |
| Timezone | Timezone |
| Website | Website URL |
| Description | Description |
| Registration Number | Registration number |
| VAT ID | VAT ID |
| Languages | Comma-separated languages |
| Specialties | Comma-separated specialties |
| Coverage Summary | Coverage summary (DMCs) |
| Verified | Yes/No |
| Featured | Yes/No |
| Status | Application status |
| **Profile Completion Link** | 🔗 **Unique link for org** |
| Created At | Creation timestamp |

### Worksheet 3: All Profiles

Summary of all profiles with basic information.

## Usage Examples

### Example 1: Bulk Upload 100 Guides

```bash
# 1. Prepare Excel file with 100 guides
# 2. Upload via admin panel
# 3. All 100 guides created with completion links
# 4. Export database to get all links
# 5. Email links to guides using mail merge
# 6. Guides complete their profiles independently
```

### Example 2: Single Guide Completion

```bash
# 1. Admin exports database
# 2. Find guide's completion link in Excel
# 3. Email link to guide: "Complete your profile here: [link]"
# 4. Guide clicks link, fills form, submits
# 5. Profile immediately updated and visible
```

### Example 3: Re-send Completion Link

```bash
# 1. Go to Admin → Users → [Guide Name]
# 2. View guide's application_data
# 3. Copy profile_completion_link
# 4. Send to guide again
```

## API Endpoints

### POST /api/admin/export-database

**Authentication:** Admin only

**Response:**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="guide-validator-database-export-2025-01-20T10-30-45.xlsx"
```

**Excel file with 3 worksheets**

### GET /[locale]/onboarding/complete-profile?token={token}

**Authentication:** Token-based (no login required)

**Shows:**
- Profile completion form for guides
- Current profile data
- Editable fields

### POST /api/onboarding/complete-profile

**Body:**
```json
{
  "token": "abc123...xyz",
  "guideId": "uuid",
  "profileId": "uuid",
  "headline": "Expert Berlin Guide",
  "bio": "I've been...",
  "years_experience": 10,
  "specialties": ["history", "food"],
  "spoken_languages": ["english", "german"],
  "license_number": "TG-12345",
  "license_authority": "German Tourism Board"
}
```

**Response:**
```json
{
  "success": true
}
```

## Future Enhancements

### Planned Features

1. **Email Integration**
   - Automatic email sending after bulk upload
   - Email templates
   - Email tracking

2. **Token Expiration**
   - Set expiration date (e.g., 30 days)
   - Auto-generate new tokens if expired
   - Admin notification of expired tokens

3. **Progress Tracking**
   - Dashboard showing completion status
   - % of guides who completed profiles
   - Reminder system for incomplete profiles

4. **Advanced Features**
   - File upload for profile photos
   - Location selection
   - Portfolio/gallery upload
   - Calendar integration

5. **Organization Profiles**
   - Complete organization profile form
   - Logo upload
   - Team member management

## Troubleshooting

### Issue: Link doesn't work

**Solution:**
1. Check if token is valid (64 hex characters)
2. Verify guide exists in database
3. Check if `application_data` contains token
4. Ensure `NEXT_PUBLIC_SITE_URL` is set correctly

### Issue: Export button not appearing

**Solution:**
1. Check if user is admin/super_admin
2. Clear browser cache
3. Check browser console for errors
4. Verify export button component is imported

### Issue: Profile not updating

**Solution:**
1. Check browser console for errors
2. Verify token matches in database
3. Check guide_id is correct
4. Verify all required fields are filled

## Summary

This feature provides a **complete workflow** for:
1. ✅ Bulk creating guide profiles
2. ✅ Generating unique completion links
3. ✅ Exporting all data with links
4. ✅ Allowing guides to self-complete profiles
5. ✅ Admin oversight and management

**Result:** Scalable onboarding for hundreds or thousands of guides with minimal admin effort! 🎉
