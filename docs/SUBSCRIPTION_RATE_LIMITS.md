# Subscription-Based Rate Limiting

## Overview

The anti-scraping system now includes subscription-aware rate limiting with three tiers:

1. **Free Tier** - Default 10 reveals/day
2. **Pro Tier** - Default 50 reveals/day (for premium subscriptions)
3. **DMC Tier** - Default 50 reveals/day (for enterprise DMC subscriptions)

## Rate Limit Tiers

### Free Tier (10/day default)
Applied to users who:
- Have no active subscription
- Have free-tier subscriptions
- `guide_free`, `agency_basic`, `dmc_core`, `transport_subscription`

### Pro Tier (50/day default)
Applied to users with premium subscriptions:
- `guide_premium` - Guide Premium Profile
- `agency_pro` - Agency Pro Subscription
- `transport_growth` - Transport Growth Pack

### DMC Tier (50/day default)
Applied to enterprise DMC users:
- `dmc_multimarket` - DMC Multi-Market
- `dmc_enterprise` - DMC Enterprise Partnership

### Admin Tier (Unlimited)
Users with `admin` or `super_admin` role have unlimited reveals.

## Database Schema

### contact_reveal_settings Table

```sql
Column Name          | Type      | Default | Description
---------------------|-----------|---------|-------------
id                   | uuid      | -       | Primary key
max_reveals_free     | integer   | 10      | Free tier limit
max_reveals_pro      | integer   | 50      | Pro tier limit
max_reveals_dmc      | integer   | 50      | DMC tier limit
max_reveals_per_day  | integer   | 10      | Legacy (kept for compatibility)
updated_at           | timestamp | now()   | Last updated
updated_by           | uuid      | null    | Admin who updated
```

## Functions

### check_contact_reveal_rate_limit(user_id)

Returns `boolean` - whether user can make another reveal.

Logic:
1. Check if user is admin → return `true`
2. Get user's active subscription tier
3. Determine max reveals based on tier
4. Count reveals in last 24 hours
5. Return `reveals < max_reveals`

### get_remaining_contact_reveals(user_id)

Returns `integer` - number of reveals remaining today.

Logic:
1. Check if user is admin → return `999999`
2. Get user's active subscription tier
3. Determine max reveals based on tier
4. Count reveals in last 24 hours
5. Return `max(0, max_reveals - reveal_count)`

## Admin Configuration

Access: `/[locale]/admin/settings/anti-scraping`

The admin can configure all three tiers independently:

```typescript
// Example settings
{
  max_reveals_free: 10,   // Free tier users
  max_reveals_pro: 50,    // Pro subscription users
  max_reveals_dmc: 50,    // DMC multi-market users
}
```

## Implementation Details

### Subscription Detection

The system checks the `billing_subscriptions` table for active subscriptions:

```sql
SELECT tier FROM billing_subscriptions
WHERE profile_id = user_id
  AND status = 'active'
ORDER BY created_at DESC
LIMIT 1
```

### Rate Limit Application

When a user attempts to reveal contact information:

1. **Frontend Modal** - Shows remaining reveals
2. **Backend Check** - Validates rate limit via RPC
3. **Database Log** - Records reveal if approved
4. **Update Count** - New reveal counts toward limit

### Subscription Tier Mapping

| Subscription Code    | Display Name               | Rate Limit Tier |
|---------------------|----------------------------|-----------------|
| guide_free          | Free Plan                  | Free (10)       |
| guide_premium       | Premium Profile            | Pro (50)        |
| agency_basic        | Basic Subscription         | Free (10)       |
| agency_pro          | Pro Subscription           | Pro (50)        |
| dmc_core            | Regional DMC               | Free (10)       |
| dmc_multimarket     | Multi-market DMC           | DMC (50)        |
| dmc_enterprise      | Enterprise Partnership     | DMC (50)        |
| transport_subscription | Fleet Subscription      | Free (10)       |
| transport_growth    | Growth Pack                | Pro (50)        |

## Testing

### Test Scenarios

1. **Free User (No Subscription)**
   - Should have 10 reveals/day
   - Modal shows "10 remaining"

2. **Pro User (guide_premium)**
   - Should have 50 reveals/day
   - Modal shows "50 remaining"

3. **DMC User (dmc_multimarket)**
   - Should have 50 reveals/day
   - Modal shows "50 remaining"

4. **Admin User**
   - Unlimited reveals
   - Modal shows "999999 remaining"

5. **Rate Limit Exceeded**
   - Error: "You have reached your daily limit"
   - Cannot proceed to step 2 of modal

### Testing Rate Limits

```sql
-- Check user's tier
SELECT p.id, p.role, bs.tier, bs.status
FROM profiles p
LEFT JOIN billing_subscriptions bs ON bs.profile_id = p.id AND bs.status = 'active'
WHERE p.id = '<user_id>';

-- Check remaining reveals
SELECT get_remaining_contact_reveals('<user_id>');

-- Check if can reveal
SELECT check_contact_reveal_rate_limit('<user_id>');

-- View recent reveals
SELECT COUNT(*), requester_id
FROM contact_reveals
WHERE revealed_at > now() - interval '24 hours'
GROUP BY requester_id
ORDER BY count DESC;
```

## Upgrade Flow

When a user upgrades their subscription:

1. New subscription record created in `billing_subscriptions`
2. Status set to `active`
3. Rate limit functions automatically detect new tier
4. User immediately gets higher limit (no cache refresh needed)

## Migration Applied

- ✅ `20251001000007_subscription_rate_limits.sql`
- Added three new columns to `contact_reveal_settings`
- Updated rate limit functions to check subscriptions
- Backwards compatible with existing `max_reveals_per_day`

## Benefits

1. **Incentivizes Upgrades** - Free users see limited reveals
2. **Flexible Configuration** - Admin can adjust all tiers
3. **Automatic Application** - No manual tier assignment needed
4. **Real-time Updates** - Changes apply immediately
5. **Enterprise Support** - DMC users get higher limits
6. **Fair Usage** - Prevents abuse while allowing legitimate use

## Future Enhancements

- Per-organization limits (for enterprise)
- Time-based limits (monthly instead of daily)
- Rollover unused reveals
- Purchase additional reveals
- Email notifications at 80% usage
