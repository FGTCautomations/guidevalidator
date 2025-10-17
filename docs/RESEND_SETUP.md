# Resend Email Setup Guide

This guide will walk you through setting up Resend for email notifications in the Guide Validator platform.

## What is Resend?

Resend is a modern email API service that makes it easy to send transactional emails. It's used in Guide Validator to send:
- Application confirmation emails to applicants
- New application notifications to administrators
- Application approval/decline notifications
- Profile creation confirmations
- Booking request notifications

## Step-by-Step Setup

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Click "Sign Up" or "Get Started"
3. Sign up with your email (you can use your work email or personal email)
4. Verify your email address

### 2. Get Your API Key

1. Once logged in, go to your [Resend Dashboard](https://resend.com/dashboard)
2. Click on "API Keys" in the left sidebar
3. Click "Create API Key"
4. Give it a name like "Guide Validator Production" or "Guide Validator Development"
5. Select permissions:
   - **Sending access**: Full access
   - **Domain access**: Full access (if you'll verify a domain)
6. Click "Create"
7. **IMPORTANT**: Copy the API key immediately - you won't be able to see it again!
8. The API key will look something like: `re_123abc456def789ghi012jkl345mno678`

### 3. Verify Your Sending Domain (Recommended for Production)

To send emails from your own domain (info@guidevalidator.com), you need to verify it:

#### Option A: Verify Domain (Recommended for Production)

1. In Resend Dashboard, go to "Domains"
2. Click "Add Domain"
3. Enter your domain: `guidevalidator.com`
4. Resend will provide DNS records you need to add:
   - **SPF Record** (TXT record)
   - **DKIM Record** (TXT record)
   - **DMARC Record** (TXT record) - optional but recommended

5. Add these records to your DNS provider (e.g., Cloudflare, GoDaddy, Namecheap):
   - Log in to your DNS provider
   - Find the DNS management section
   - Add each TXT record exactly as Resend specifies
   - Wait 15-60 minutes for DNS propagation

6. Return to Resend and click "Verify Domain"
7. Once verified, you can send from any email address at your domain

#### Option B: Use Resend's Test Domain (For Development)

For testing/development, you can use Resend's built-in domain:
- No verification needed
- Can send emails immediately
- Emails will come from `onboarding@resend.dev`
- **Not recommended for production** as it may be marked as spam

### 4. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# Resend Configuration
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=info@guidevalidator.com
RESEND_FROM_NAME=Guide Validator Team
```

**Important Notes:**
- Replace `re_your_actual_api_key_here` with your actual API key from step 2
- If you haven't verified your domain yet, use: `RESEND_FROM_EMAIL=onboarding@resend.dev` for testing
- Once your domain is verified, change it to: `RESEND_FROM_EMAIL=info@guidevalidator.com`
- The `RESEND_FROM_NAME` is what recipients will see as the sender name

### 5. Test Your Setup

After adding the environment variables, restart your development server:

```bash
npm run dev
```

Then test by:
1. Submitting a new guide/agency/DMC/transport application through the signup form
2. Check that you receive:
   - Confirmation email to the applicant
   - Notification email to info@guidevalidator.com (or the admin email)

### 6. Verify Email Delivery

Check the following:
- **Spam folder**: Make sure emails aren't going to spam
- **Resend Dashboard**: Check "Logs" section to see email delivery status
- **Email content**: Verify formatting and links work correctly

## Email Types Configured

The platform sends the following emails:

| Email Type | Recipient | Trigger |
|-----------|-----------|---------|
| Application Received | Applicant | When application is submitted |
| New Application Alert | info@guidevalidator.com | When application is submitted |
| Application Approved | Applicant | When admin approves application |
| Application Declined | Applicant | When admin declines application |
| Profile Created | User | When profile is created by admin |
| Profile Updated | User | When admin updates user profile |
| Profile Deleted | User | When admin deletes user profile |

## Troubleshooting

### Emails Not Sending

1. **Check API Key**: Make sure `RESEND_API_KEY` is set correctly in `.env.local`
2. **Restart Server**: Environment variables require server restart
3. **Check Logs**: Look for errors in your terminal/console
4. **Verify Domain**: If using custom domain, ensure it's verified in Resend
5. **Check Resend Dashboard**: Go to Logs to see delivery status

### Emails Going to Spam

1. **Verify Domain**: Custom verified domains have better deliverability
2. **Set up SPF/DKIM**: Ensure all DNS records are added correctly
3. **Add DMARC**: Configure DMARC policy for your domain
4. **Warm Up Domain**: Start with low volume and gradually increase
5. **Content**: Avoid spam trigger words, maintain good text/image ratio

### Domain Not Verifying

1. **Wait Time**: DNS changes can take up to 48 hours (usually 15-60 minutes)
2. **Record Format**: Ensure TXT records are entered exactly as shown
3. **No CNAME Flattening**: Some DNS providers don't support required record types
4. **Multiple Records**: Make sure you added ALL required records
5. **Contact Support**: Reach out to Resend support if issues persist

## Pricing

Resend pricing (as of 2024):
- **Free Tier**: 100 emails/day, 3,000 emails/month
- **Paid Plans**: Start at $20/month for 50,000 emails/month

For production use with expected volume, consider upgrading to a paid plan.

## Best Practices

1. **Separate Keys**: Use different API keys for development and production
2. **Monitor Usage**: Check Resend dashboard regularly for delivery metrics
3. **Rate Limiting**: Resend has rate limits; batch large sends if needed
4. **Test Emails**: Always test in development before deploying to production
5. **Unsubscribe**: Include unsubscribe links for marketing emails (not needed for transactional)
6. **Error Handling**: Application continues even if email fails (graceful degradation)

## Security Notes

- **Never commit API keys**: Keep `.env.local` in `.gitignore`
- **Rotate keys**: If leaked, immediately revoke and create new keys
- **Environment Variables**: Use platform secrets (Vercel, Railway, etc.) for production
- **HTTPS Only**: Emails should only be sent from HTTPS endpoints

## Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Support**: support@resend.com
- **Discord Community**: https://discord.gg/resend

## Quick Reference

```bash
# .env.local configuration
RESEND_API_KEY=re_your_key_here
RESEND_FROM_EMAIL=info@guidevalidator.com
RESEND_FROM_NAME=Guide Validator Team
```

## Verification Checklist

- [ ] Resend account created
- [ ] API key generated and copied
- [ ] Domain added to Resend (if using custom domain)
- [ ] DNS records added (SPF, DKIM, DMARC)
- [ ] Domain verified in Resend dashboard
- [ ] Environment variables added to `.env.local`
- [ ] Development server restarted
- [ ] Test email sent successfully
- [ ] Email received (check inbox and spam)
- [ ] Admin notification received
- [ ] Production environment variables configured (when deploying)

---

*Last updated: September 2025*