# Quick Start Guide - Bulk Upload & Export Features

## 🚀 Quick Start (5 Minutes)

### Step 1: Bulk Upload Guides (2 min)

1. **Go to Admin Dashboard**
   - Navigate to `/en/admin`
   - Click "Bulk Upload" button

2. **Upload Your Excel File**
   - Select your prepared Excel file
   - Click "Upload"
   - Wait for success message

✅ **Result:** All guides created with completion links!

### Step 2: Export Database (1 min)

1. **Click "Export to Excel"** (green button in header)
2. **Download the file**
3. **Open in Excel**

✅ **Result:** You now have all completion links!

### Step 3: Share Links with Guides (2 min)

1. **Open the Excel file**
2. **Go to "Guides" worksheet**
3. **Find "Profile Completion Link" column**
4. **Copy and email links to guides**

Example email:
```
Subject: Complete Your Guide Profile

Hi [Name],

Please complete your guide profile by clicking this link:
[Profile Completion Link]

This link is unique to you and allows you to add your bio,
specialties, and other professional details.

Thanks!
```

✅ **Result:** Guides receive their links!

### Step 4: Guides Complete Profiles

Guides:
1. Click their unique link
2. Fill in the form
3. Submit
4. Done!

✅ **Result:** Profiles completed and visible!

## 📊 What's Included

### For Administrators

✅ **Bulk Upload**
- Upload Excel with multiple guides
- Automatic account creation
- Auto-generate completion links

✅ **Export to Excel**
- One-click database export
- All guides with links
- All organizations
- All profiles

### For Guides

✅ **Profile Completion**
- Unique link (no login needed)
- Simple form
- Immediate updates

## 🔧 Technical Details

### Files Changed

**New Files:**
- `lib/admin/generate-profile-token.ts` - Token generation
- `app/api/admin/export-database/route.ts` - Export API
- `components/admin/export-database-button.tsx` - Export button
- `app/[locale]/onboarding/complete-profile/page.tsx` - Completion page
- `components/onboarding/profile-completion-form.tsx` - Form component
- `app/api/onboarding/complete-profile/route.ts` - Update API

**Modified Files:**
- `app/api/admin/bulk-upload/route.ts` - Added token generation
- `app/[locale]/admin/page.tsx` - Added export button

### How It Works

1. **Token Generation:** Uses `crypto.randomBytes(32)` for secure 64-char tokens
2. **Link Storage:** Stored in `application_data.profile_completion_link`
3. **Export:** Fetches all data and generates Excel with ExcelJS
4. **Completion:** Token-based authentication, no login required

## 📖 Full Documentation

See [BULK_UPLOAD_PROFILE_LINKS_FEATURE.md](BULK_UPLOAD_PROFILE_LINKS_FEATURE.md) for complete documentation.

## ✅ Testing

1. **Upload 1 guide**
2. **Export database**
3. **Get completion link from Excel**
4. **Open link in browser**
5. **Fill form and submit**
6. **Verify profile updated**

## 🎉 You're Ready!

Start bulk uploading guides and let them complete their profiles independently!

**Questions?** Check the full documentation: [BULK_UPLOAD_PROFILE_LINKS_FEATURE.md](BULK_UPLOAD_PROFILE_LINKS_FEATURE.md)
