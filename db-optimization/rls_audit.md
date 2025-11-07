# Row Level Security (RLS) Policy Audit
## Guide Validator Platform

Generated: 2025-10-18

---

## Executive Summary

This document audits all Row Level Security (RLS) policies on the Guide Validator platform to ensure:
1. **Security**: No unauthorized access to data
2. **Performance**: Policies don't cause query slowdowns
3. **Correctness**: Policies align with application authorization logic
4. **Maintainability**: No overlapping, redundant, or always-true policies

---

## RLS Overview

**What is RLS?**
Row Level Security is PostgreSQL's mechanism to restrict which rows users can access based on policy rules. Supabase uses RLS extensively to secure data at the database level.

**Current Status**: Run `collect_stats.sql` Section 6 to get actual policy list.

---

## Expected Policy Categories

### 1. Public Read Policies
**Purpose**: Allow anyone to read publicly visible data

**Expected Tables**:
- `countries`, `regions`, `cities`, `national_parks` (reference data)
- `profiles` (WHERE `deleted_at IS NULL` AND role-based visibility)
- `guides`, `agencies` (WHERE parent profile is public)
- `reviews` (WHERE `status = 'published'`)
- `jobs` (WHERE `status = 'active'` AND `end_date >= CURRENT_DATE`)

**Security Check**:
- ✅ Must NOT expose private fields (email, phone, credentials)
- ✅ Must respect `deleted_at` soft deletes
- ✅ Must respect status fields (published, active, verified)

**Example Safe Policy**:
```sql
CREATE POLICY "Public profiles viewable by all"
ON profiles FOR SELECT
USING (deleted_at IS NULL);
```

**Example UNSAFE Policy** (DO NOT USE):
```sql
-- BAD: Exposes all profiles including private fields
CREATE POLICY "All profiles public"
ON profiles FOR SELECT
USING (true);
```

---

### 2. Authenticated User Policies
**Purpose**: Allow logged-in users to read/write their own data

**Expected Tables**:
- `profiles` (users can UPDATE their own profile)
- `messages` (users can INSERT/SELECT messages they participate in)
- `conversation_participants` (users see their own conversations)
- `availability_slots` (providers manage their own availability)
- `reviews` (users can write reviews and see reviews about them)
- `job_applications` (applicants see their own applications)
- `subscriptions` (users see their own subscription)

**Security Check**:
- ✅ Must use `auth.uid()` to match current user
- ✅ Must validate ownership via FK chains
- ✅ No privilege escalation (user cannot modify others' data)

**Example Safe Policy**:
```sql
-- Users can update their own profile
CREATE POLICY "Users update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);
```

**Example with FK Chain**:
```sql
-- Guides can manage their own availability
CREATE POLICY "Providers manage own availability"
ON availability_slots FOR ALL
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());
```

---

### 3. Role-Based Access Policies
**Purpose**: Grant access based on user role

**Expected Tables**:
- `guides` (only guides can INSERT/UPDATE)
- `agencies` (only agencies/DMCs/transport can INSERT/UPDATE)
- `agency_members` (agency admins manage members)
- `jobs` (employers can manage their job postings)

**Security Check**:
- ✅ Validate role from `profiles` table or JWT claims
- ✅ Prevent role spoofing
- ✅ Handle role changes gracefully

**Example Safe Policy**:
```sql
-- Only guide profiles can create guide records
CREATE POLICY "Guides create own guide profile"
ON guides FOR INSERT
WITH CHECK (
    auth.uid() = profile_id
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'guide'
    )
);
```

---

### 4. Admin Policies
**Purpose**: Full access for admin users

**Expected Tables**: All application tables for moderation/management

**Security Check**:
- ✅ Must verify admin role from secure source (JWT claim or profiles table)
- ✅ Use `SECURITY DEFINER` functions for privileged operations
- ⚠️ Do NOT use always-true policies like `USING (true)`

**Example Safe Policy**:
```sql
-- Admins can moderate all profiles
CREATE POLICY "Admins manage all profiles"
ON profiles FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);
```

---

## Common RLS Antipatterns

### ❌ Antipattern 1: Always-True Policies

```sql
-- BAD: This defeats the purpose of RLS
CREATE POLICY "Allow all"
ON sensitive_table FOR SELECT
USING (true);
```

**Why Bad**: Exposes all data to everyone, including soft-deleted records and private info.

**Fix**: Add proper conditions:
```sql
CREATE POLICY "Public data only"
ON sensitive_table FOR SELECT
USING (is_public = true AND deleted_at IS NULL);
```

---

### ❌ Antipattern 2: Overlapping Policies

```sql
-- Policy 1
CREATE POLICY "Users see own data"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy 2
CREATE POLICY "All profiles public"
ON profiles FOR SELECT
USING (deleted_at IS NULL);
```

**Why Bad**: Multiple SELECT policies are OR'd together. If any policy returns true, access is granted. This can create unintended access.

**Fix**: Combine into a single policy or use RESTRICTIVE policies:
```sql
CREATE POLICY "Profile visibility"
ON profiles FOR SELECT
USING (
    deleted_at IS NULL
    AND (
        auth.uid() = id  -- Own profile
        OR role IN ('guide', 'agency', 'dmc', 'transport')  -- Public profiles
    )
);
```

---

### ❌ Antipattern 3: Performance Killers

```sql
-- BAD: Subquery runs for every row
CREATE POLICY "Complex check"
ON messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM conversation_participants cp
        JOIN conversations c ON c.id = cp.conversation_id
        JOIN profiles p ON p.id = cp.user_id
        WHERE cp.user_id = auth.uid()
        AND cp.conversation_id = messages.conversation_id
    )
);
```

**Why Bad**: Correlated subquery is inefficient for large tables.

**Fix**: Simplify or use indexed columns:
```sql
-- Better: Direct FK check
CREATE POLICY "User messages"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT conversation_id
        FROM conversation_participants
        WHERE user_id = auth.uid()
    )
);

-- Best: Add user_ids[] array to messages table
CREATE POLICY "User messages fast"
ON messages FOR SELECT
USING (auth.uid() = ANY(participant_ids));
```

---

### ❌ Antipattern 4: Missing WITH CHECK

```sql
-- BAD: INSERT/UPDATE allowed without validation
CREATE POLICY "Users update profiles"
ON profiles FOR UPDATE
USING (auth.uid() = id);
-- Missing: WITH CHECK clause
```

**Why Bad**: `USING` only checks existing rows. `WITH CHECK` validates new data.

**Fix**: Always include `WITH CHECK` for INSERT/UPDATE:
```sql
CREATE POLICY "Users update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND deleted_at IS NULL);
```

---

## Tables Requiring RLS Policies

### Critical Tables (Must Have RLS)

| Table | Policy Requirements | Notes |
|-------|---------------------|-------|
| `profiles` | Public read (filtered), own UPDATE | Must hide email/phone from public |
| `guides` | Public read, own INSERT/UPDATE | Must validate role = 'guide' |
| `agencies` | Public read, own INSERT/UPDATE | Role validation required |
| `messages` | Conversation participants only | Performance-critical |
| `conversations` | Participants only | FK chain validation |
| `conversation_participants` | Own conversations only | Must prevent unauthorized joins |
| `availability_slots` | Public read future slots, own UPDATE | Date filtering required |
| `availability_holds` | Requester/provider only | Status-based access |
| `reviews` | Public read published, own INSERT | Status validation |
| `subscriptions` | Own subscription only | Payment info protection |
| `guide_credentials` | Own credentials only | PII protection |
| `contact_reveals` | Revealer + revealed only | Anti-scraping measure |

---

### Administrative Tables (Admin-Only or Service Role)

| Table | Policy | Rationale |
|-------|--------|-----------|
| `guide_applications` | Admin + applicant | Application review |
| `agency_applications` | Admin + applicant | Application review |
| `dmc_applications` | Admin + applicant | Application review |
| `transport_applications` | Admin + applicant | Application review |
| `audit_logs` | Admin only | Security logs |
| `abuse_reports` | Admin + reporter | Moderation |
| `billing_events` | Admin only | Financial audit |

---

### Reference Tables (Public Read-Only)

| Table | Policy | Notes |
|-------|--------|-------|
| `countries` | Public read-only | Static reference |
| `regions` | Public read-only | Static reference |
| `cities` | Public read-only | May grow, but static |
| `national_parks` | Public read-only | Static reference |
| `country_licensing_rules` | Public read-only | Business rules |
| `subscription_rate_limits` | Public read-only | Pricing tiers |

**Recommended Policy**:
```sql
CREATE POLICY "Public read reference data"
ON countries FOR SELECT
USING (true);

ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
```

---

## Policy Audit Checklist

Run this query to verify RLS status:

```sql
-- Check which tables have RLS enabled
SELECT
    schemaname,
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Critical Checks:

1. **All User Tables Have RLS Enabled**
   ```sql
   -- Should return 0 rows
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public'
       AND tablename NOT LIKE 'pg_%'
       AND rowsecurity = false;
   ```

2. **No Always-True SELECT Policies** (except reference tables)
   ```sql
   SELECT schemaname, tablename, policyname, qual
   FROM pg_policies
   WHERE schemaname = 'public'
       AND cmd = 'SELECT'
       AND qual = 'true'
       AND tablename NOT IN ('countries', 'regions', 'cities', 'national_parks');
   ```

3. **All Policies Have Comments**
   ```sql
   SELECT p.schemaname, p.tablename, p.policyname
   FROM pg_policies p
   WHERE p.schemaname = 'public'
       AND NOT EXISTS (
           SELECT 1 FROM pg_description d
           WHERE d.objoid = (
               SELECT oid FROM pg_policy
               WHERE polname = p.policyname
           )
       );
   ```

4. **INSERT/UPDATE Policies Have WITH CHECK**
   ```sql
   SELECT schemaname, tablename, policyname, cmd
   FROM pg_policies
   WHERE schemaname = 'public'
       AND cmd IN ('INSERT', 'UPDATE', 'ALL')
       AND with_check IS NULL;
   ```

---

## Performance Impact Analysis

### Test Policy Performance

For each critical table, run:

```sql
-- Enable policy timing
SET track_functions = 'all';

-- Test query with RLS
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM messages
WHERE conversation_id = '<uuid>'
LIMIT 50;

-- Check if policy causes seq scan
-- Look for "SubPlan" or "Seq Scan" in EXPLAIN output
```

### Red Flags:
- ⚠️ Sequential scans on large tables
- ⚠️ Policy execution time > 10ms per row
- ⚠️ Multiple nested subqueries in USING clause

### Solutions:
1. **Add Indexes**: Policy conditions need supporting indexes
   ```sql
   -- If policy checks conversation_participants
   CREATE INDEX idx_conversation_participants_user
   ON conversation_participants(user_id, conversation_id);
   ```

2. **Simplify Policy Logic**: Use direct column checks instead of subqueries
3. **Denormalize**: Add helper columns to avoid joins in policies
   ```sql
   -- Example: Add participant_ids[] to messages
   ALTER TABLE messages ADD COLUMN participant_ids UUID[];

   CREATE POLICY "User messages"
   ON messages FOR SELECT
   USING (auth.uid() = ANY(participant_ids));
   ```

---

## Recommended Policy Changes

### 1. Unify Profile Visibility

**Problem**: Separate policies for public/own profiles can conflict.

**Solution**: Single policy with clear logic
```sql
DROP POLICY IF EXISTS "Public profiles" ON profiles;
DROP POLICY IF EXISTS "Own profile" ON profiles;

CREATE POLICY "Profile visibility"
ON profiles FOR SELECT
USING (
    deleted_at IS NULL
    AND (
        -- Own profile (full access)
        id = auth.uid()
        -- Public profiles (limited fields via view)
        OR role IN ('guide', 'agency', 'dmc', 'transport')
    )
);
```

---

### 2. Optimize Message Access

**Current**: Subquery joins conversation_participants

**Optimized**: Add participant array to conversations table
```sql
-- Migration
ALTER TABLE conversations ADD COLUMN participant_ids UUID[];

-- Backfill
UPDATE conversations c
SET participant_ids = (
    SELECT ARRAY_AGG(user_id)
    FROM conversation_participants
    WHERE conversation_id = c.id
);

-- New policy
CREATE POLICY "User conversations"
ON conversations FOR SELECT
USING (auth.uid() = ANY(participant_ids));

CREATE POLICY "Conversation messages"
ON messages FOR SELECT
USING (
    conversation_id IN (
        SELECT id FROM conversations
        WHERE auth.uid() = ANY(participant_ids)
    )
);
```

---

### 3. Implement Bypass for Service Role

**Problem**: Application server needs full access for admin operations.

**Solution**: Check for service_role
```sql
CREATE POLICY "Service role bypass"
ON sensitive_table FOR ALL
USING (
    current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
    OR auth.uid() = owner_id
);
```

**Note**: Use sparingly, only when necessary.

---

## Testing Plan

### 1. Unit Tests for Each Policy

```sql
-- Test 1: Unauthenticated user cannot access private data
SET request.jwt.claims = '{}';
SELECT COUNT(*) FROM profiles WHERE email IS NOT NULL;
-- Expected: 0

-- Test 2: User can access own profile
SET request.jwt.claims = '{"sub": "<user-uuid>"}';
SELECT * FROM profiles WHERE id = '<user-uuid>';
-- Expected: 1 row

-- Test 3: User cannot access other profiles' private fields
SELECT email FROM profiles WHERE id != '<user-uuid>';
-- Expected: Should be NULL or error

-- Test 4: Admin can access all profiles
SET request.jwt.claims = '{"sub": "<admin-uuid>", "role": "admin"}';
SELECT COUNT(*) FROM profiles;
-- Expected: All profiles
```

---

### 2. Performance Tests

```bash
# Run with real user JWT
psql $SUPABASE_DB_URL -c "
SET request.jwt.claims = '{\"sub\": \"<user-uuid>\"}';
EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM vw_user_conversations WHERE user_id = '<user-uuid>';
"
```

---

### 3. Security Audit

Use `supabase db lint` or custom script:

```bash
# Check for always-true policies
psql $SUPABASE_DB_URL -f rls_audit_queries.sql
```

---

## Rollback Plan

If RLS policies cause issues:

```sql
-- Disable RLS on specific table (emergency only)
ALTER TABLE problematic_table DISABLE ROW LEVEL SECURITY;

-- Drop problematic policy
DROP POLICY IF EXISTS "problematic_policy" ON table_name;

-- Revert to previous policy definition
CREATE POLICY "safe_policy" ON table_name ...;
```

---

## Next Steps

1. **Run Audit Queries**: Execute queries in this document to identify current policies
2. **Document Findings**: List all existing policies with their purpose
3. **Identify Issues**: Flag always-true, overlapping, or slow policies
4. **Propose Changes**: Create migration script in `constraints.sql`
5. **Test Changes**: Validate policies in staging environment
6. **Monitor Performance**: Track query times before/after policy changes

---

## Appendix: Useful Queries

```sql
-- List all RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual AS using_clause,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Find tables without RLS
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename NOT LIKE 'pg_%'
    AND rowsecurity = false;

-- Check policy execution time (approximate)
SELECT
    schemaname,
    tablename,
    policyname,
    LENGTH(qual) AS policy_complexity
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY LENGTH(qual) DESC;
```
