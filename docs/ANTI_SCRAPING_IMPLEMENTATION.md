# Anti-Scraping Implementation Guide

This document explains how to implement the anti-scraping measures in profile pages.

## Features Implemented

1. **2-Step Contact Reveal Modal** - Users must confirm twice before accessing contact info
2. **Text Selection Protection** - CSS prevents copying of sensitive data
3. **Print Protection** - Sensitive data hidden when printing
4. **Dynamic Watermarks** - User email + timestamp overlays
5. **Subscription-Based Rate Limiting** - Three tiers: Free (10/day), Pro (50/day), DMC (50/day)
6. **Activity Logging** - All reveals logged with IP and user agent

> 📘 **See also:** [SUBSCRIPTION_RATE_LIMITS.md](./SUBSCRIPTION_RATE_LIMITS.md) for detailed information about subscription tiers.

## Database Setup

The migrations have been created and applied:
- `20251001000005_contact_reveals.sql` - Initial table structure
- `20251001000006_enhance_contact_reveals.sql` - Enhanced features

Tables created:
- `contact_reveals` - Logs all contact information reveals
- `contact_reveal_settings` - Admin-configurable rate limits

Functions created:
- `check_contact_reveal_rate_limit(user_id)` - Returns boolean
- `get_remaining_contact_reveals(user_id)` - Returns integer

## Components

### 1. ProtectedContact Component

Wraps any contact information field.

**Usage:**
\`\`\`tsx
import { ProtectedContact } from "@/components/profile/protected-contact";

// In your profile page:
<ProtectedContact
  targetProfileId={profile.id}
  targetProfileName={profile.full_name}
  contactType="email"
  contactValue={profile.email}
/>

<ProtectedContact
  targetProfileId={profile.id}
  targetProfileName={profile.full_name}
  contactType="phone"
  contactValue={profile.phone}
/>

<ProtectedContact
  targetProfileId={profile.id}
  targetProfileName={profile.full_name}
  contactType="website"
  contactValue={profile.website}
/>
\`\`\`

### 2. ProfileWatermark Component

Adds watermarks to the entire page.

**Usage:**
\`\`\`tsx
import { ProfileWatermark } from "@/components/profile/profile-watermark";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      {user && <ProfileWatermark userEmail={user.email!} />}
      {/* Rest of your page */}
    </>
  );
}
\`\`\`

### 3. ContactRevealModal Component

Automatically used by ProtectedContact - no need to import separately.

## CSS Integration

Add the anti-scraping CSS to your layout:

**In `app/layout.tsx` or `app/[locale]/layout.tsx`:**
\`\`\`tsx
import "@/styles/anti-scraping.css";
\`\`\`

## Admin Settings

Admins can configure rate limits at:
\`/[locale]/admin/settings/anti-scraping\`

Features:
- View total reveals and daily statistics
- Adjust max reveals per day per user
- See all active protection features
- Admins are exempt from rate limits

## Complete Profile Page Example

\`\`\`tsx
import { createClient } from "@/lib/supabase/server";
import { ProtectedContact } from "@/components/profile/protected-contact";
import { ProfileWatermark } from "@/components/profile/profile-watermark";
import { notFound } from "next/navigation";

type ProfilePageProps = {
  params: { locale: string; id: string };
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const supabase = createClient();

  // Get current user for watermark
  const { data: { user } } = await supabase.auth.getUser();

  // Get profile data
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error || !profile) {
    notFound();
  }

  return (
    <>
      {/* Add watermark overlay */}
      {user && <ProfileWatermark userEmail={user.email!} />}

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">{profile.full_name}</h1>

        {/* Profile information */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <p>{profile.bio}</p>
        </section>

        {/* Protected contact section */}
        <section className="rounded-lg border border-foreground/10 bg-white p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/60 mb-2">
                Email
              </label>
              <ProtectedContact
                targetProfileId={profile.id}
                targetProfileName={profile.full_name}
                contactType="email"
                contactValue={profile.email}
              />
            </div>

            {profile.phone && (
              <div>
                <label className="block text-sm font-medium text-foreground/60 mb-2">
                  Phone
                </label>
                <ProtectedContact
                  targetProfileId={profile.id}
                  targetProfileName={profile.full_name}
                  contactType="phone"
                  contactValue={profile.phone}
                />
              </div>
            )}

            {profile.website && (
              <div>
                <label className="block text-sm font-medium text-foreground/60 mb-2">
                  Website
                </label>
                <ProtectedContact
                  targetProfileId={profile.id}
                  targetProfileName={profile.full_name}
                  contactType="website"
                  contactValue={profile.website}
                />
              </div>
            )}
          </div>

          <div className="mt-6 rounded-lg bg-yellow-50 p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Note:</strong> Contact information reveals are limited and logged.
              Please use responsibly for legitimate business inquiries only.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
\`\`\`

## CSS Classes Reference

Use these classes for additional protection:

- \`.contact-protected\` - Disables text selection
- \`.print-hidden\` - Hides element when printing
- \`.contact-blur\` - Blurs content until clicked
- \`.rate-limit-warning\` - Styles for rate limit warnings
- \`.security-badge\` - Security indicator badge

## Testing Checklist

- [ ] Contact info starts blurred/hidden
- [ ] Modal appears with 2 steps when clicking
- [ ] Rate limit is enforced (test with multiple reveals)
- [ ] Watermarks appear on page
- [ ] Text selection disabled on revealed contacts
- [ ] Print preview hides sensitive data
- [ ] Right-click disabled on protected elements
- [ ] Reveals are logged in database
- [ ] Admin can view/change settings
- [ ] Admin has unlimited reveals

## Security Notes

1. **Client-side protection** - These measures deter casual scrapers but determined attackers can bypass client-side protections
2. **Server-side enforcement** - Rate limiting is enforced server-side via RLS policies
3. **Logging** - All reveals are permanently logged for audit trail
4. **IP tracking** - IP addresses are stored for abuse detection
5. **Admin monitoring** - Admins should regularly review reveal patterns

## Rate Limit Bypass for Testing

Admins automatically bypass rate limits. To test as a regular user:
1. Create a test non-admin account
2. Try to reveal more than the limit
3. Should see "rate limit exceeded" error

## Future Enhancements

Potential additions:
- Email notifications for suspicious activity
- Captcha before contact reveal
- Honeypot fields to catch bots
- Browser fingerprinting
- ML-based anomaly detection
- Screenshot detection API
