# Upgrade to Professional Email Templates with React Email

## Current Status
- ✅ Resend is configured and working
- ✅ Basic HTML emails are being sent
- ⚠️ Emails need better design and branding

## Installation Steps

### 1. Install React Email packages
```bash
npm install react-email @react-email/components -E
npm install -D @types/react @types/react-dom
```

### 2. Add email preview script to package.json
```json
{
  "scripts": {
    "email:dev": "email dev",
    "email:export": "email export"
  }
}
```

### 3. Run preview server
```bash
npm run email:dev
```
This opens http://localhost:3000 to preview all your email templates live!

### 4. Add your logo
Upload your logo to `public/logo.png` or use a CDN URL in the template.

## Using the New Template

Update `lib/email/resend.ts`:

```typescript
import { render } from '@react-email/components';
import ApplicationApprovedEmail from '@/emails/application-approved';

export async function sendApplicationApprovedEmail(payload: ApplicationNotificationPayload & { loginLink?: string }): Promise<SendResult> {
  const loginLink = payload.loginLink || authLink(payload.locale);

  // Render React Email template to HTML
  const html = render(
    ApplicationApprovedEmail({
      applicantName: payload.applicantName,
      applicationType: payload.applicationType,
      loginLink,
    })
  );

  // Plain text fallback
  const text = `Hi ${payload.applicantName},\n\nGreat news! Your ${normaliseRole(payload.applicationType)} application has been approved.\n\nSign in: ${loginLink}\n\nBest regards,\nThe Guide Validator Team`;

  return sendEmail({
    to: payload.applicantEmail,
    subject: `Your ${normaliseRole(payload.applicationType)} application has been approved! 🎉`,
    html,
    text,
  });
}
```

## Why React Email?

### Benefits:
✅ **Beautiful templates** - Professional design out of the box
✅ **Responsive** - Works on all email clients (Gmail, Outlook, Apple Mail)
✅ **Logo support** - Easy to add your branding
✅ **Live preview** - See changes instantly
✅ **Type-safe** - TypeScript support
✅ **Reusable components** - Build once, use everywhere

### What you get:
- Professional header with your logo
- Eye-catching CTA buttons
- Branded color scheme (green for approvals, red for declines)
- Info boxes for important details
- Mobile-responsive layout
- Footer with links

## Templates to Create

1. ✅ **Application Approved** (already created)
2. **Application Declined**
3. **Application Received**
4. **Verification Approved**
5. **New Review Notification**
6. **Hold Request Received**

## Example: Preview in Browser

Run `npm run email:dev` and you'll see:
- All your email templates listed
- Live preview as you edit
- Test with different data
- Copy HTML for testing

## Best Practices

1. **Always provide plain text fallback** for accessibility
2. **Use absolute URLs** for images (not relative paths)
3. **Test in multiple clients** (Gmail, Outlook, Apple Mail)
4. **Keep it simple** - Complex CSS breaks in some clients
5. **Use inline styles** - React Email handles this automatically

## Cost
- React Email: **FREE** (open source)
- Resend pricing:
  - Free: 3,000 emails/month
  - Pro: $20/month for 50,000 emails
  - Currently using: **FREE tier**

## Next Steps

1. Run `npm install react-email @react-email/components -E`
2. Test with `npm run email:dev`
3. Update resend.ts to use React Email templates
4. Create templates for other email types
5. Add your logo to public/logo.png

---

**Need help?**
- React Email docs: https://react.email/docs/introduction
- Resend + React Email guide: https://resend.com/docs/send-with-react
- Example templates: https://react.email/examples
