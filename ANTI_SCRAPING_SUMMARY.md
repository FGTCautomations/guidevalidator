# Anti-Scraping Protection System

## 🛡️ Overview

Comprehensive multi-layer anti-scraping protection to prevent unauthorized bulk extraction of contact information from profile pages.

## ✅ Features Implemented

### 1. Middleware Bot Detection & Rate Limiting
- **Blocks automated tools**: curl, wget, Python requests, Scrapy, Selenium, etc.
- **Rate limiting**: 100 requests/minute per IP
- **Returns**: 403 for bots, 429 for rate limit violations
- **Protected paths**: `/directory/*` and `/profile/*`

### 2. Database-Level Protection
- **Contact reveal logging**: Every reveal logged with IP + user agent
- **Subscription-based limits**:
  - Free: 10 reveals/day
  - Pro: 50 reveals/day
  - DMC: 50 reveals/day
  - Admin: Unlimited
- **PostgreSQL functions**: Automatic rate limit enforcement

### 3. Component-Level Protection
- **2-step confirmation modal**: Users must confirm twice
- **Rate limit checking**: Pre-check before reveal
- **Dynamic watermarks**: User email + timestamp overlay
- **Right-click disabled**: Prevents easy copying

### 4. CSS-Level Protection
- **Text selection disabled**: Can't highlight and copy
- **Print protection**: Contact info hidden when printing
- **Blur effect**: Unrevealed content appears blurred

## 📊 Test Results

```
✅ Bot Detection (curl):          403 Forbidden
✅ Bot Detection (Python):        403 Forbidden
✅ Rate Limiting (101 requests):  429 Too Many Requests
✅ Normal Browser:                200 OK
✅ 2-Step Reveal Flow:            Working
✅ Admin Configuration:           Working
```

## 🔧 Admin Control

Navigate to: `/admin/settings/anti-scraping`

**Configure:**
- Free tier rate limit
- Pro tier rate limit
- DMC tier rate limit

**View:**
- Total reveals (all time)
- Reveals today (last 24h)
- Current limits per tier

## 📁 Key Files

```
middleware.ts                                  # Bot detection & rate limiting
supabase/migrations/*_contact_reveals.sql      # Database tables & functions
components/profile/contact-reveal-modal.tsx    # 2-step confirmation
components/profile/protected-contact.tsx       # Contact wrapper component
styles/anti-scraping.css                       # Selection & print protection
app/[locale]/admin/settings/anti-scraping/     # Admin interface
```

## 🧪 Testing

```bash
# Run test suite
node test-anti-scraping.js

# Manual test with curl (should be blocked)
curl http://localhost:3001/en/directory
# Expected: 403 Forbidden
```

## 🚀 Production Recommendations

1. **Use Redis** for distributed rate limiting across multiple servers
2. **Add CAPTCHA** for suspicious activity instead of immediate block
3. **Implement honeypot fields** in forms to catch bots
4. **Use CDN with WAF** (Cloudflare, AWS CloudFront)
5. **Monitor logs** for bypass attempts and unusual patterns

## 📖 Documentation

See `docs/ANTI_SCRAPING_COMPLETE.md` for detailed implementation guide.
