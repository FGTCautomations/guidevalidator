# Complete Anti-Scraping Implementation

## Overview

This document describes the comprehensive anti-scraping protection system implemented across multiple layers of the Guide Validator application.

## Protection Layers

### 1. Middleware-Level Protection (Server-Side)

**Location:** `middleware.ts`

**Features:**
- ✅ Bot user agent detection
- ✅ IP-based rate limiting (100 requests/minute)
- ✅ Missing browser headers detection
- ✅ Logging of blocked requests

**How it works:**
```typescript
// Runs BEFORE any page renders
if (pathname.includes('/directory') || pathname.includes('/profile')) {
  // Check rate limit
  if (!checkRateLimit(ip, 100, 60000)) {
    return new NextResponse('Too Many Requests', { status: 429 });
  }

  // Check for bot patterns
  if (isSuspiciousRequest(request)) {
    return new NextResponse('Access Denied', { status: 403 });
  }
}
```

**Blocked user agents:**
- bot, crawler, spider, scraper
- curl, wget
- python, scrapy, beautifulsoup
- selenium, puppeteer, playwright
- headless, phantom
- mechanize, httpie
- node-fetch, axios, got, superagent, request

**Test Results:**
```
✅ Normal browser request: 200 OK
✅ Bot detection (curl): 403 Forbidden
✅ Bot detection (Python): 403 Forbidden
✅ Rate limiting (101 requests): 429 Too Many Requests
```

### 2. Database-Level Protection

**Location:** `supabase/migrations/`

**Features:**
- ✅ Contact reveal logging with IP and user agent
- ✅ Subscription-based rate limiting
- ✅ Admin bypass for unlimited access
- ✅ PostgreSQL functions for rate limit checks

**Rate Limits by Tier:**
- **Free Tier**: 10 reveals/day (default, no subscription)
- **Pro Tier**: 50 reveals/day (guide_premium, agency_pro, transport_growth)
- **DMC Tier**: 50 reveals/day (dmc_multimarket, dmc_enterprise)
- **Admin/Super Admin**: Unlimited

**Database Tables:**
```sql
-- Logs every contact reveal
contact_reveals (
  id, requester_id, target_profile_id, reveal_type,
  ip_address, user_agent, revealed_at
)

-- Admin-configurable settings
contact_reveal_settings (
  max_reveals_free, max_reveals_pro, max_reveals_dmc
)
```

**Functions:**
```sql
-- Check if user can reveal contact
check_contact_reveal_rate_limit(user_id uuid) → boolean

-- Get remaining reveals for user
get_remaining_contact_reveals(user_id uuid) → integer
```

### 3. Component-Level Protection

**Location:** `components/profile/`

**Components:**
- `contact-reveal-modal.tsx` - 2-step confirmation modal
- `protected-contact.tsx` - Wrapper for sensitive data
- `profile-watermark.tsx` - Dynamic watermark overlay

**Features:**
- ✅ 2-step confirmation process
- ✅ Checks rate limit before revealing
- ✅ Logs IP address and user agent
- ✅ Shows remaining reveals to user
- ✅ Prevents right-click and copy on revealed data
- ✅ Dynamic watermark with user email + timestamp

**Usage:**
```tsx
<ProtectedContact
  targetProfileId={profile.id}
  targetProfileName={profile.full_name}
  contactType="phone"
  contactValue={profile.phone}
/>
```

### 4. CSS-Level Protection

**Location:** `styles/anti-scraping.css`

**Features:**
- ✅ Disable text selection on contact info
- ✅ Print protection (hides sensitive data)
- ✅ Blur effect for unrevealed content
- ✅ Watermark on printed pages

**Styles:**
```css
/* Prevent text selection */
.contact-protected {
  user-select: none;
  -webkit-user-select: none;
}

/* Hide when printing */
@media print {
  .contact-protected {
    display: none !important;
  }

  body::before {
    content: "CONFIDENTIAL - Contact information hidden";
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-45deg);
    font-size: 4rem;
    color: rgba(0, 0, 0, 0.05);
  }
}

/* Blur unrevealed content */
.contact-blur {
  filter: blur(8px);
  cursor: pointer;
}
```

## Admin Interface

**Location:** `/[locale]/admin/settings/anti-scraping`

**Features:**
- View statistics (total reveals, reveals today)
- Configure rate limits for all tiers
- See current limits per tier
- Active protection features list
- Refresh statistics button

**Configurable Settings:**
- Free Tier limit (default: 10)
- Pro Tier limit (default: 50)
- DMC Tier limit (default: 50)

## Security Best Practices

### Current Implementation ✅

1. **Multi-layer protection**: Middleware → Database → Component → CSS
2. **IP-based rate limiting**: 100 requests/minute per IP
3. **Bot detection**: User agent and header analysis
4. **Logging**: All reveals logged with IP and user agent
5. **Subscription-based limits**: Different tiers for different users
6. **Admin control**: Configurable limits via admin panel
7. **Client-side protection**: Text selection and print protection

### Production Recommendations 🚀

1. **Use Redis for rate limiting**: In-memory Map won't work across multiple server instances
   ```bash
   npm install ioredis
   ```

2. **Add CAPTCHA for suspicious activity**: When bot detection triggers, show CAPTCHA instead of immediate block
   ```bash
   npm install @hcaptcha/react-hcaptcha
   ```

3. **Implement honeypot fields**: Add hidden form fields to catch bots
   ```tsx
   <input type="text" name="website" style={{display: 'none'}} />
   ```

4. **Add more sophisticated fingerprinting**: Track screen resolution, timezone, canvas fingerprint

5. **Use CDN with DDoS protection**: Cloudflare, AWS CloudFront with WAF

6. **Monitor and alert**: Set up alerts for unusual activity patterns

7. **Regular security audits**: Review logs for bypass attempts

## Testing the Protection

### Test Bot Detection
```bash
curl http://localhost:3001/en/directory
# Expected: 403 Forbidden
```

### Test Rate Limiting
```bash
# Run test suite
node test-anti-scraping.js
```

### Test Contact Reveal
1. Sign in as a regular user
2. Go to a profile page
3. Click to reveal contact
4. Confirm twice
5. Check database for logged reveal

### Test Admin Panel
1. Sign in as admin
2. Navigate to `/en/admin/settings/anti-scraping`
3. Modify rate limits
4. Save and verify changes

## Monitoring

### Key Metrics to Track

1. **Bot blocks**: Count of 403 responses
2. **Rate limit hits**: Count of 429 responses
3. **Contact reveals**: Total and per-day trends
4. **Failed reveals**: Users hitting their limits
5. **Suspicious patterns**: Same IP, multiple accounts

### Database Queries

```sql
-- Reveals in last 24 hours
SELECT COUNT(*) FROM contact_reveals
WHERE revealed_at > NOW() - INTERVAL '24 hours';

-- Top requesters
SELECT requester_id, COUNT(*) as reveal_count
FROM contact_reveals
WHERE revealed_at > NOW() - INTERVAL '7 days'
GROUP BY requester_id
ORDER BY reveal_count DESC
LIMIT 10;

-- Suspicious IPs (multiple reveals from same IP)
SELECT ip_address, COUNT(DISTINCT requester_id) as user_count
FROM contact_reveals
WHERE revealed_at > NOW() - INTERVAL '24 hours'
GROUP BY ip_address
HAVING COUNT(DISTINCT requester_id) > 5;
```

## Bypassing for Legitimate Use Cases

### SEO Crawlers (Google, Bing)
If you need to allow legitimate search engine crawlers:

```typescript
// In middleware.ts
const ALLOWED_BOTS = ['googlebot', 'bingbot', 'slurp']; // Yahoo

function isSuspiciousRequest(req: NextRequest): boolean {
  const userAgent = req.headers.get('user-agent')?.toLowerCase() || '';

  // Allow legitimate SEO bots
  if (ALLOWED_BOTS.some(bot => userAgent.includes(bot))) {
    return false;
  }

  // ... rest of checks
}
```

### API Access
For legitimate API users, implement API keys:

```typescript
// Check for API key before rate limiting
const apiKey = req.headers.get('x-api-key');
if (apiKey && await validateApiKey(apiKey)) {
  // Skip bot detection and use different rate limits
  return intlResponse;
}
```

## Summary

The anti-scraping system provides **comprehensive protection** across multiple layers:

1. **Middleware** blocks bots and rate limits at server level
2. **Database** enforces subscription-based reveal limits
3. **Components** require 2-step confirmation with logging
4. **CSS** prevents copying and printing

This makes it extremely difficult for scrapers to bulk extract contact information while maintaining a smooth experience for legitimate users.

## Test Results Summary

✅ **All critical tests passing:**
- Bot detection: ✅ PASSED (curl and Python blocked)
- Rate limiting: ✅ PASSED (101st request blocked)
- Normal browser: ✅ PASSED (legitimate users work)
- Contact reveal flow: ✅ PASSED (2-step modal works)
- Admin panel: ✅ PASSED (settings configurable)
- Database logging: ✅ PASSED (all reveals logged)
- CSS protection: ✅ PASSED (selection disabled, print hidden)
