# Database Inventory & Analysis
## Guide Validator Platform - Supabase (Postgres 15)

Generated: 2025-10-18

---

## Table of Contents
1. [Core Tables](#core-tables)
2. [Application Tables](#application-tables)
3. [Feature Tables](#feature-tables)
4. [Compliance & Audit](#compliance-audit)
5. [Location Data](#location-data)
6. [Candidates for Review](#candidates-for-review)

---

## Core Tables

### `profiles`
**Purpose**: Central user profiles for all roles
**Expected Size**: High (main user table)
**Key Columns**: id (PK, UUID), role (text), full_name, email, country_code, verified, featured, deleted_at
**Indexes**: PK on id, likely on role, country_code
**FK Relationships**: Referenced by guides, agencies, agency_members, etc.
**Status**: ✅ **KEEP** - Core table

**Optimization Opportunities**:
- Index on `role` if not present (for role-based queries)
- Index on `verified` for directory listings
- Index on `deleted_at IS NULL` (partial index for active users)
- Consider `country_code` index for location filtering

---

### `guides`
**Purpose**: Guide-specific profile data
**Expected Size**: Medium
**Key Columns**: profile_id (PK, FK), headline, bio, specialties[], spoken_languages[], hourly_rate_cents, currency, years_experience, response_time_minutes
**FK**: profile_id → profiles.id
**Status**: ✅ **KEEP** - Core table

**Optimization Opportunities**:
- GIN index on `specialties` for array searches
- GIN index on `spoken_languages` for array searches
- Index on `currency` for rate filtering
- Composite index on (hourly_rate_cents, currency) for pricing queries

---

### `agencies`
**Purpose**: Agency/DMC profiles
**Expected Size**: Medium
**Key Columns**: id (PK, UUID), name, description, coverage_summary, country_code, verified, featured, website, languages[], specialties[]
**Status**: ✅ **KEEP** - Core table

**Optimization Opportunities**:
- GIN index on `languages` array
- GIN index on `specialties` array
- Index on `verified` and `featured` for directory queries
- Index on `country_code`

---

### `agency_members`
**Purpose**: Link table for agency staff
**Expected Size**: Small-Medium
**Key Columns**: id, agency_id, profile_id, role, permissions, joined_at
**FK**: agency_id → agencies.id, profile_id → profiles.id
**Status**: ✅ **KEEP** - Core table

**Optimization Opportunities**:
- Composite index on (agency_id, profile_id) UNIQUE
- Index on profile_id for reverse lookups

---

## Application Tables

### `guide_applications`
**Purpose**: Pending guide sign-ups
**Expected Size**: Small (cleared after approval)
**Key Columns**: id, locale, full_name, contact_email, status, created_at
**Status**: ✅ **KEEP** - Active feature

**Optimization Recommendations**:
- Index on `status` for admin dashboard
- Index on `created_at` for sorting
- Composite index on (status, created_at)
- **Archive old applications** (>90 days, status='approved'/'rejected')

---

### `agency_applications`
**Purpose**: Pending agency sign-ups
**Expected Size**: Small
**Status**: ✅ **KEEP** - Active feature
**Same optimizations as guide_applications**

---

### `dmc_applications`
**Purpose**: Pending DMC sign-ups
**Expected Size**: Small
**Status**: ✅ **KEEP** - Active feature
**Same optimizations as guide_applications**

---

### `transport_applications`
**Purpose**: Pending transport company sign-ups
**Expected Size**: Small
**Status**: ✅ **KEEP** - Active feature
**Same optimizations as guide_applications**

---

## Feature Tables

### `availability_slots`
**Purpose**: Guide/provider availability scheduling
**Expected Size**: Large (grows over time)
**Key Columns**: id, provider_id, provider_role, date, start_time, end_time, is_available, timezone
**Status**: ✅ **KEEP** - Core feature

**Critical Optimizations**:
- **REQUIRED**: Composite index on (provider_id, date, start_time)
- **REQUIRED**: Index on (date, is_available) for availability searches
- Partial index: `WHERE is_available = true AND date >= CURRENT_DATE`
- **Archival Strategy**: Delete slots older than 30 days (past unavailability)

---

### `availability_holds`
**Purpose**: Temporary holds on provider time
**Expected Size**: Medium (active holds only)
**Key Columns**: id, requester_id, provider_id, start_date, end_date, status, expires_at
**Status**: ✅ **KEEP** - Core feature

**Optimizations**:
- Index on `status` for active holds
- Index on `expires_at` for cleanup
- Composite index on (provider_id, status, start_date)
- **Cleanup**: Auto-delete expired holds (status='expired' AND expires_at < NOW() - INTERVAL '7 days')

---

### `conversations`
**Purpose**: Direct messaging between users
**Expected Size**: Medium-Large
**Key Columns**: id, created_at, updated_at, last_message_at
**Status**: ✅ **KEEP** - Core feature

**Optimizations**:
- Index on `last_message_at` for inbox sorting
- Index on `updated_at`

---

### `conversation_participants`
**Purpose**: Users in each conversation
**Expected Size**: Medium-Large (2x conversations typically)
**Key Columns**: conversation_id, user_id, last_read_at, joined_at
**Status**: ✅ **KEEP** - Core feature

**Optimizations**:
- **REQUIRED**: Composite index on (user_id, last_read_at) for unread counts
- Composite UNIQUE index on (conversation_id, user_id)

---

### `messages`
**Purpose**: Chat messages
**Expected Size**: Large (grows indefinitely)
**Key Columns**: id, conversation_id, sender_id, content, created_at, read_by[]
**Status**: ✅ **KEEP** - Core feature

**Critical Optimizations**:
- **REQUIRED**: Composite index on (conversation_id, created_at DESC)
- Index on sender_id for user message history
- **Archival Strategy**: Move messages >1 year old to archive table

---

### `message_attachments`
**Purpose**: File attachments in messages
**Expected Size**: Small-Medium
**Status**: ✅ **KEEP** - Core feature

**Optimizations**:
- Index on message_id
- Index on file_type for filtering

---

### `reviews`
**Purpose**: User reviews and ratings
**Expected Size**: Medium
**Key Columns**: id, reviewee_id, reviewer_id, reviewee_type, overall_rating, status, created_at
**Status**: ✅ **KEEP** - Core feature

**Optimizations**:
- **REQUIRED**: Composite index on (reviewee_id, status, created_at)
- Index on reviewer_id
- Index on (reviewee_type, status) for filtering
- Partial index: `WHERE status = 'published'` for public reviews

---

### `review_responses`
**Purpose**: Responses to reviews
**Expected Size**: Small-Medium
**Status**: ✅ **KEEP** - Core feature

**Optimizations**:
- Index on review_id (likely already FK-indexed)

---

### `jobs`
**Purpose**: Job postings
**Expected Size**: Medium
**Key Columns**: id, employer_id, employer_type, status, start_date, end_date, created_at
**Status**: ✅ **KEEP** - Core feature

**Optimizations**:
- Composite index on (status, start_date, created_at)
- Index on employer_id
- Partial index: `WHERE status = 'active' AND end_date >= CURRENT_DATE`

---

### `job_applications`
**Purpose**: Applications to jobs
**Expected Size**: Medium-Large
**Status**: ✅ **KEEP** - Core feature

**Optimizations**:
- Composite index on (job_id, status, created_at)
- Index on applicant_id

---

## Location Data

### `countries`
**Purpose**: Country reference data
**Expected Size**: ~250 rows (static)
**Key Columns**: code (PK, char(2)), name, region, flag_emoji
**Status**: ✅ **KEEP** - Core reference data

**Issues**:
- ⚠️ **ACTION REQUIRED**: Some FKs may use ISO3 (char(3)) instead of ISO2
- Need to standardize all country_code columns to char(2)

---

### `regions`
**Purpose**: Regions/states within countries
**Expected Size**: ~5000 rows
**Key Columns**: id (UUID), country_code, name, type, code
**Status**: ✅ **KEEP** - Core reference data

**Optimizations**:
- Index on country_code (should be FK)
- Composite index on (country_code, name) for searches

---

### `cities`
**Purpose**: City reference data
**Expected Size**: ~50,000+ rows
**Key Columns**: id (UUID), country_code, region_id, name, population, is_capital, is_major_city
**Status**: ✅ **KEEP** - Core reference data

**Optimizations**:
- Index on country_code
- Index on region_id
- Composite index on (country_code, is_major_city, population DESC)
- Consider full-text search index on name

---

### `national_parks`
**Purpose**: National parks and protected areas
**Expected Size**: ~5000-10000 rows
**Key Columns**: id (UUID), country_code, region_id, name, type, unesco_site
**Status**: ✅ **KEEP** - Core reference data

**Optimizations**:
- Index on country_code
- Index on region_id
- Index on unesco_site (if frequently queried)

---

### Location Link Tables

#### `guide_countries`, `guide_regions`, `guide_cities`
**Purpose**: Link guides to operating locations
**Status**: ⚠️ **REVIEW** - May be redundant if location_data JSONB is used

**Recommendation**:
- If applications now store location_data as JSONB, these may be unused
- Check if any queries still use these tables
- If not queried in 30 days: **CANDIDATE FOR REMOVAL**

---

## Compliance & Audit

### `audit_logs`
**Purpose**: Audit trail for sensitive operations
**Expected Size**: Large (grows indefinitely)
**Status**: ✅ **KEEP** - Compliance requirement

**Critical Optimizations**:
- **REQUIRED**: Composite index on (user_id, action, timestamp DESC)
- Index on (timestamp, action) for audit reports
- **Archival Strategy**: Move logs >1 year to archive/cold storage
- Consider partitioning by month

---

### `user_consents`
**Purpose**: GDPR consent tracking
**Expected Size**: Small-Medium
**Status**: ⚠️ **TABLE MAY NOT EXIST** - Returns 404

**Action**:
- Verify table exists
- If missing, create from GDPR migration
- If not needed, remove references from code

---

### `dsar_requests`
**Purpose**: Data subject access requests
**Expected Size**: Very Small
**Status**: ⚠️ **TABLE MAY NOT EXIST** - Returns 404

**Action**: Same as user_consents

---

### `contact_reveals`
**Purpose**: Track when protected contact info is revealed
**Expected Size**: Medium
**Status**: ✅ **KEEP** - Anti-scraping feature

**Optimizations**:
- Index on revealer_id
- Index on (profile_id, revealed_at DESC)
- Composite index on (revealer_id, profile_id) UNIQUE to prevent duplicates

---

### `abuse_reports`
**Purpose**: User-reported abuse/spam
**Expected Size**: Small
**Status**: ✅ **KEEP** - Moderation feature

**Optimizations**:
- Index on status
- Index on reported_entity_id
- Composite index on (status, created_at)

---

## Billing & Subscriptions

### `subscriptions`
**Purpose**: Active subscriptions (Stripe integration)
**Expected Size**: Medium
**Status**: ✅ **KEEP** - Core business logic

**Optimizations**:
- Index on user_id
- Index on status
- Composite index on (status, current_period_end) for renewal processing
- Index on stripe_subscription_id for webhook lookups

---

### `subscription_rate_limits`
**Purpose**: Usage limits per subscription tier
**Expected Size**: Very Small (config table)
**Status**: ✅ **KEEP** - Business logic

---

### `billing_events`
**Purpose**: Billing event log
**Expected Size**: Large
**Status**: ✅ **KEEP** - Billing audit

**Optimizations**:
- Index on user_id
- Index on (event_type, created_at)
- **Archival**: Move events >2 years to archive

---

## Credentials & Verification

### `guide_credentials`
**Purpose**: Guide license/certification storage
**Expected Size**: Small-Medium
**Status**: ✅ **KEEP** - Verification feature

**Optimizations**:
- Index on guide_id
- Index on status
- Composite index on (status, expires_at) for expiration alerts

---

### `country_licensing_rules`
**Purpose**: Rules for guide licensing by country
**Expected Size**: Very Small (~200 rows max)
**Status**: ✅ **KEEP** - Business logic

---

## Shadow/Test Tables

### Any tables with prefixes: `test_`, `tmp_`, `_backup`, `old_`
**Status**: 🗑️ **CANDIDATE FOR REMOVAL**

---

## Candidates for Review/Removal

| Table Name | Reason | Action |
|------------|--------|--------|
| `guide_countries` | May be redundant if location_data JSONB used | Check usage, consider removal |
| `guide_regions` | Same as above | Check usage, consider removal |
| `guide_cities` | Same as above | Check usage, consider removal |
| `user_consents` | Returns 404, may not exist | Create or remove code references |
| `dsar_requests` | Returns 404, may not exist | Create or remove code references |
| Any empty application tables | If no pending applications | Archive or truncate old data |
| Old migration artifacts | If exist | Drop after verification |

---

## Size Estimates (Before Running collect_stats.sql)

| Category | Estimated Tables | Expected Total Size |
|----------|------------------|---------------------|
| Core Profiles | 5 | 50-500 MB |
| Applications | 4 | 1-10 MB |
| Messaging | 3 | 100-1000 MB |
| Availability | 2 | 50-500 MB |
| Reviews | 2 | 10-100 MB |
| Jobs | 2 | 10-100 MB |
| Location Data | 4 | 10-50 MB |
| Audit/Compliance | 5 | 50-500 MB |
| Billing | 3 | 10-100 MB |
| **Total Estimate** | **30-40 tables** | **300 MB - 3 GB** |

---

## Next Steps

1. **Run `collect_stats.sql`** to get actual metrics
2. **Identify slow queries** with pg_stat_statements
3. **Apply index optimizations** from index_plan.sql
4. **Implement archival strategy** for old data
5. **Fix country code inconsistencies**
6. **Remove unused tables** after 30-day monitoring

---

## Scripts to Run

```bash
# 1. Collect stats
psql $SUPABASE_DB_URL -f db-optimization/collect_stats.sql > output/raw_stats.txt

# 2. Review slow queries
psql $SUPABASE_DB_URL -f db-optimization/slow_queries_analysis.sql

# 3. Apply schema hygiene checks
psql $SUPABASE_DB_URL -f db-optimization/schema_hygiene.sql

# 4. Review index plan
psql $SUPABASE_DB_URL -f db-optimization/index_plan.sql

# 5. Apply country code fix
# psql $SUPABASE_DB_URL -f db-optimization/country_codes_fix.sql
```
