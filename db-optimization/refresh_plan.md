# Materialized View Refresh Strategy
## Guide Validator Platform

---

## Overview

Materialized views (MVs) provide pre-computed aggregations for fast read performance but require periodic refresh to stay current. This document outlines the refresh strategy for all materialized views created in `matviews.sql`.

---

## Materialized Views Summary

| View Name | Purpose | Data Volatility | Refresh Frequency | Method |
|-----------|---------|-----------------|-------------------|--------|
| `mv_profile_stats` | Review aggregates per profile | Medium | **Hourly** | CONCURRENTLY |
| `mv_agency_stats` | Agency team size, jobs, applications | Low | **Daily** | CONCURRENTLY |
| `mv_availability_summary` | Provider availability overview | High | **Every 15 min** | CONCURRENTLY |
| `mv_conversation_stats` | Message counts and timing | Medium | **Hourly** | CONCURRENTLY |
| `mv_job_stats` | Job application metrics | Medium | **Hourly** | CONCURRENTLY |
| `mv_location_popularity` | Provider density by country | Low | **Daily** | CONCURRENTLY |
| `mv_platform_metrics` | Admin dashboard metrics | Medium | **Every 5 min** | Full rebuild |
| `mv_user_engagement` | User activity metrics | Low | **Daily** | CONCURRENTLY |

---

## Refresh Schedules

### Real-Time (Every 5 Minutes)

**View**: `mv_platform_metrics`

**Why**: Admin dashboard needs near-real-time metrics for pending tasks (applications, abuse reports).

**Impact**: Minimal (single-row result, fast aggregation).

**SQL**:
```sql
REFRESH MATERIALIZED VIEW mv_platform_metrics;
```

**Cron Expression**: `*/5 * * * *`

---

### High Frequency (Every 15 Minutes)

**View**: `mv_availability_summary`

**Why**: Availability changes frequently as users book slots and update schedules.

**Impact**: Low (one row per provider with future availability).

**SQL**:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_availability_summary;
```

**Cron Expression**: `*/15 * * * *`

---

### Medium Frequency (Hourly)

**Views**:
- `mv_profile_stats`
- `mv_conversation_stats`
- `mv_job_stats`

**Why**: Reviews, messages, and job applications arrive throughout the day but don't require instant reflection.

**Impact**: Medium (profile_stats is largest, but CONCURRENTLY avoids locks).

**SQL**:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profile_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversation_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_job_stats;
```

**Cron Expression**: `0 * * * *` (top of every hour)

---

### Low Frequency (Daily)

**Views**:
- `mv_agency_stats`
- `mv_location_popularity`
- `mv_user_engagement`

**Why**: These metrics change slowly and are mostly used for analytics/reporting.

**Impact**: Low (run during off-peak hours).

**SQL**:
```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agency_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_location_popularity;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_engagement;
```

**Cron Expression**: `0 2 * * *` (2:00 AM UTC daily)

---

## Implementation Methods

### Option 1: Supabase Edge Functions (Recommended)

Create Deno edge functions triggered by Supabase cron:

**File**: `supabase/functions/refresh-matviews-frequent/index.ts`

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  )

  try {
    // Refresh high-frequency views
    await supabase.rpc('refresh_frequent_matviews')

    return new Response(
      JSON.stringify({ success: true, refreshed_at: new Date().toISOString() }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
```

**Database Function**:

```sql
CREATE OR REPLACE FUNCTION refresh_frequent_matviews()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_availability_summary;
  REFRESH MATERIALIZED VIEW mv_platform_metrics;
END;
$$;
```

**Schedule**: Configure in Supabase Dashboard > Database > Cron Jobs

---

### Option 2: pg_cron Extension (Supabase Pro)

If pg_cron is available:

```sql
-- Install extension (requires superuser)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule real-time refresh (every 5 minutes)
SELECT cron.schedule(
  'refresh-platform-metrics',
  '*/5 * * * *',
  $$REFRESH MATERIALIZED VIEW mv_platform_metrics;$$
);

-- Schedule high-frequency refresh (every 15 minutes)
SELECT cron.schedule(
  'refresh-availability',
  '*/15 * * * *',
  $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_availability_summary;$$
);

-- Schedule hourly refreshes
SELECT cron.schedule(
  'refresh-hourly-matviews',
  '0 * * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profile_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversation_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_job_stats;
  $$
);

-- Schedule daily refreshes (2 AM UTC)
SELECT cron.schedule(
  'refresh-daily-matviews',
  '0 2 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_agency_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_location_popularity;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_user_engagement;
  $$
);
```

---

### Option 3: External Cron Service (Vercel Cron, GitHub Actions)

**Vercel Cron** (if using Vercel):

**File**: `app/api/cron/refresh-matviews/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'edge'

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  try {
    // Determine which views to refresh based on query param
    const { searchParams } = new URL(request.url)
    const frequency = searchParams.get('frequency') || 'hourly'

    if (frequency === 'frequent') {
      await supabase.rpc('refresh_frequent_matviews')
    } else if (frequency === 'hourly') {
      await supabase.rpc('refresh_hourly_matviews')
    } else if (frequency === 'daily') {
      await supabase.rpc('refresh_daily_matviews')
    }

    return NextResponse.json({ success: true, frequency })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

**File**: `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/refresh-matviews?frequency=frequent",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/refresh-matviews?frequency=hourly",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/refresh-matviews?frequency=daily",
      "schedule": "0 2 * * *"
    }
  ]
}
```

---

## Monitoring & Alerts

### Track Refresh Performance

Create a monitoring table:

```sql
CREATE TABLE IF NOT EXISTS matview_refresh_log (
    id SERIAL PRIMARY KEY,
    view_name TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    duration_ms INTEGER,
    success BOOLEAN,
    error_message TEXT
);

CREATE INDEX idx_matview_refresh_log_view_time
    ON matview_refresh_log(view_name, started_at DESC);
```

### Instrumented Refresh Function

```sql
CREATE OR REPLACE FUNCTION refresh_matview_with_logging(view_name TEXT)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    start_time TIMESTAMPTZ;
    log_id INTEGER;
BEGIN
    -- Start logging
    INSERT INTO matview_refresh_log (view_name, started_at)
    VALUES (view_name, NOW())
    RETURNING id INTO log_id;

    start_time := clock_timestamp();

    -- Refresh the view
    EXECUTE 'REFRESH MATERIALIZED VIEW CONCURRENTLY ' || view_name;

    -- Log success
    UPDATE matview_refresh_log
    SET completed_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000,
        success = true
    WHERE id = log_id;

EXCEPTION WHEN OTHERS THEN
    -- Log failure
    UPDATE matview_refresh_log
    SET completed_at = NOW(),
        duration_ms = EXTRACT(EPOCH FROM (clock_timestamp() - start_time)) * 1000,
        success = false,
        error_message = SQLERRM
    WHERE id = log_id;

    RAISE;
END;
$$;
```

### Query Recent Refresh Status

```sql
SELECT
    view_name,
    completed_at,
    duration_ms,
    success,
    error_message
FROM matview_refresh_log
WHERE started_at >= NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;
```

---

## Performance Considerations

### CONCURRENTLY vs. Full Rebuild

- **CONCURRENTLY**: Does not lock the view, users can query stale data during refresh. Requires UNIQUE index.
- **Full Rebuild**: Locks the view (no reads during refresh), faster for small views.

**Rule**: Use CONCURRENTLY for all views except `mv_platform_metrics` (single row, fast rebuild).

---

### Refresh Duration Estimates

| View | Expected Duration | Notes |
|------|-------------------|-------|
| `mv_platform_metrics` | < 1 second | Simple aggregates, no joins |
| `mv_availability_summary` | 2-5 seconds | One row per provider with future slots |
| `mv_profile_stats` | 5-30 seconds | Depends on review count |
| `mv_conversation_stats` | 10-60 seconds | Message count can be large |
| `mv_job_stats` | 5-15 seconds | Moderate application volume |
| `mv_agency_stats` | 5-20 seconds | Multiple joins, moderate size |
| `mv_location_popularity` | 10-30 seconds | Joins all provider types |
| `mv_user_engagement` | 30-120 seconds | Most complex, many joins |

---

### Optimization Tips

1. **Partial Refreshes**: If a view is too slow, consider partitioning by date or provider and refreshing incrementally.

2. **Incremental Updates**: For high-frequency views, track changes and update only affected rows:

```sql
-- Example: Update only changed profiles
CREATE OR REPLACE FUNCTION incremental_refresh_profile_stats()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Delete stale rows for profiles with new reviews
    DELETE FROM mv_profile_stats
    WHERE profile_id IN (
        SELECT DISTINCT reviewee_id
        FROM reviews
        WHERE updated_at >= NOW() - INTERVAL '1 hour'
    );

    -- Recompute only changed profiles
    INSERT INTO mv_profile_stats
    SELECT ... -- same query as materialized view
    FROM profiles p
    WHERE p.id IN (
        SELECT DISTINCT reviewee_id
        FROM reviews
        WHERE updated_at >= NOW() - INTERVAL '1 hour'
    );
END;
$$;
```

3. **Off-Peak Scheduling**: Run expensive daily refreshes during low-traffic hours (2-4 AM in your primary timezone).

4. **Parallel Refreshes**: If pg_cron supports it, refresh independent views in parallel:

```sql
-- Refresh multiple views in parallel (requires multiple cron jobs)
SELECT cron.schedule('refresh-profile-stats', '0 * * * *', $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profile_stats;$$);
SELECT cron.schedule('refresh-conversation-stats', '0 * * * *', $$REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversation_stats;$$);
-- These run independently
```

---

## Rollback Plan

If materialized views cause issues:

1. **Revert Application Queries**: Change back to original queries (not using MVs)
2. **Drop Materialized Views**:

```sql
DROP MATERIALIZED VIEW IF EXISTS mv_user_engagement;
DROP MATERIALIZED VIEW IF EXISTS mv_platform_metrics;
DROP MATERIALIZED VIEW IF EXISTS mv_location_popularity;
DROP MATERIALIZED VIEW IF EXISTS mv_job_stats;
DROP MATERIALIZED VIEW IF EXISTS mv_conversation_stats;
DROP MATERIALIZED VIEW IF EXISTS mv_availability_summary;
DROP MATERIALIZED VIEW IF EXISTS mv_agency_stats;
DROP MATERIALIZED VIEW IF EXISTS mv_profile_stats;
```

3. **Stop Cron Jobs**:

```sql
-- List all cron jobs
SELECT * FROM cron.job;

-- Unschedule by name
SELECT cron.unschedule('refresh-platform-metrics');
SELECT cron.unschedule('refresh-availability');
SELECT cron.unschedule('refresh-hourly-matviews');
SELECT cron.unschedule('refresh-daily-matviews');
```

---

## Testing Plan

### Phase 1: Create MVs and Test Queries

```sql
-- After running matviews.sql, verify all views exist
SELECT matviewname, ispopulated FROM pg_matviews WHERE schemaname = 'public';

-- Manually refresh all views
REFRESH MATERIALIZED VIEW mv_profile_stats;
REFRESH MATERIALIZED VIEW mv_agency_stats;
REFRESH MATERIALIZED VIEW mv_availability_summary;
REFRESH MATERIALIZED VIEW mv_conversation_stats;
REFRESH MATERIALIZED VIEW mv_job_stats;
REFRESH MATERIALIZED VIEW mv_location_popularity;
REFRESH MATERIALIZED VIEW mv_platform_metrics;
REFRESH MATERIALIZED VIEW mv_user_engagement;

-- Test query performance
EXPLAIN ANALYZE
SELECT p.*, s.review_count, s.avg_overall_rating
FROM vw_guide_directory p
JOIN mv_profile_stats s ON s.profile_id = p.id
LIMIT 50;
```

### Phase 2: Test CONCURRENTLY Refreshes

```sql
-- Verify UNIQUE indexes exist (required for CONCURRENTLY)
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename LIKE 'mv_%'
    AND indexdef LIKE '%UNIQUE%';

-- Test concurrent refresh (should not block reads)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_profile_stats;
```

### Phase 3: Schedule and Monitor

1. Set up cron jobs (choose one method above)
2. Wait 24 hours
3. Check refresh log:

```sql
SELECT * FROM matview_refresh_log
WHERE started_at >= NOW() - INTERVAL '24 hours'
ORDER BY started_at DESC;
```

4. Verify data freshness:

```sql
SELECT
    schemaname,
    matviewname,
    (SELECT refreshed_at FROM mv_profile_stats LIMIT 1) AS last_refreshed
FROM pg_matviews
WHERE schemaname = 'public';
```

---

## Next Steps

1. **Choose Implementation Method**: Supabase Edge Functions (recommended) or pg_cron
2. **Deploy Refresh Scripts**: Set up automated refresh scheduling
3. **Update Application Queries**: Replace direct aggregations with MV joins
4. **Monitor Performance**: Track refresh durations and query improvements
5. **Adjust Frequencies**: Fine-tune refresh schedules based on actual usage patterns

---

## Appendix: Quick Reference Commands

```sql
-- Refresh all MVs manually (one-time)
REFRESH MATERIALIZED VIEW mv_profile_stats;
REFRESH MATERIALIZED VIEW mv_agency_stats;
REFRESH MATERIALIZED VIEW mv_availability_summary;
REFRESH MATERIALIZED VIEW mv_conversation_stats;
REFRESH MATERIALIZED VIEW mv_job_stats;
REFRESH MATERIALIZED VIEW mv_location_popularity;
REFRESH MATERIALIZED VIEW mv_platform_metrics;
REFRESH MATERIALIZED VIEW mv_user_engagement;

-- Check MV sizes
SELECT
    schemaname,
    matviewname,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||matviewname)) AS size
FROM pg_matviews
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||matviewname) DESC;

-- Check when MV was last refreshed (custom timestamp in view)
SELECT
    'mv_profile_stats' AS view,
    refreshed_at
FROM mv_profile_stats
LIMIT 1;
```
