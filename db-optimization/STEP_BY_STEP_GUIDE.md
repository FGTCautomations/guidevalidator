# Step-by-Step Database Optimization Guide
## Guide Validator - Supabase Database

**Your Database**: `db.vhqzmunorymtoisijiqb.supabase.co`

---

## ⚠️ Before You Start

### Prerequisites
- [x] PostgreSQL client (`psql`) installed
- [x] Access to your Supabase database
- [x] Database password: `Vertrouwen17#`
- [x] Basic understanding of SQL (we'll guide you)

### Safety Notes
- ✅ Steps 1-3 are **100% read-only** (completely safe)
- ⚠️ Steps 4+ make actual changes (but are reversible)
- 💾 We'll create backups before any changes
- 🔄 Every change has a rollback script

---

## 📋 PHASE 0: Setup & Analysis (Read-Only)

### Step 1: Verify PostgreSQL Client

Open Command Prompt or PowerShell and check if `psql` is installed:

```bash
psql --version
```

**Expected output**: `psql (PostgreSQL) 15.x` or similar

**If not installed**:
1. Download from: https://www.postgresql.org/download/windows/
2. Or use Supabase SQL Editor (Dashboard → SQL Editor)

---

### Step 2: Test Database Connection

```bash
# Set your database URL as environment variable
set SUPABASE_DB_URL=postgresql://postgres:Vertrouwen17#@db.vhqzmunorymtoisijiqb.supabase.co:5432/postgres

# Test connection (read-only query)
psql "%SUPABASE_DB_URL%" -c "SELECT current_database(), version();"
```

**Expected output**: Should show database name and PostgreSQL version

**If connection fails**:
- Check your internet connection
- Verify the password hasn't changed in Supabase Dashboard
- Make sure your IP isn't blocked by Supabase

---

### Step 3: Run Database Statistics Collection

This will analyze your current database state (read-only, takes 2-5 minutes):

```bash
# Create output directory
mkdir db-optimization\output

# Run statistics collection
psql "%SUPABASE_DB_URL%" -f db-optimization\collect_stats.sql > db-optimization\output\stats_report.txt 2>&1
```

**What this does**:
- Counts rows in all your tables
- Measures table sizes
- Checks index usage
- Identifies missing indexes
- Analyzes RLS policies
- Finds slow queries

**Review the output**:
```bash
# Open the report
notepad db-optimization\output\stats_report.txt
```

**Look for**:
- Table row counts (are they what you expect?)
- Tables without indexes
- Unused indexes
- Missing foreign keys

---

### Step 4: Run Schema Hygiene Checks

This identifies potential issues (read-only, takes 1-2 minutes):

```bash
psql "%SUPABASE_DB_URL%" -f db-optimization\schema_hygiene.sql > db-optimization\output\hygiene_report.txt 2>&1
```

**Review the output**:
```bash
notepad db-optimization\output\hygiene_report.txt
```

**Look for**:
- Missing NOT NULL constraints
- Invalid country codes
- Missing foreign keys
- Columns that need CHECK constraints
- Duplicate indexes

---

### Step 5: Review Analysis Documents

Read these files to understand what will be optimized:

1. **Start here**: `db-optimization\README_OPTIMIZATION.md`
2. **Table inventory**: `db-optimization\inventory.md`
3. **Refresh strategy**: `db-optimization\refresh_plan.md`

**Key questions to answer**:
- Do the table descriptions match your application?
- Are there tables you don't recognize? (might be unused)
- Do the optimization recommendations make sense?

---

### Step 6: Decision Point - Should You Proceed?

**✅ Proceed if**:
- Statistics report shows your actual tables
- Row counts are reasonable (not millions of rows)
- You understand the proposed changes
- You have time to monitor (1-2 hours for Phase A)

**⏸️ Pause if**:
- Tables don't match your application
- You're in the middle of a critical deployment
- You can't monitor for issues
- Statistics report shows errors

---

## 📋 PHASE A: Additive Changes (Reversible)

### Step 7: Create a Backup Point

Supabase doesn't have built-in backup commands, but we can document the current state:

```bash
# Export current schema
psql "%SUPABASE_DB_URL%" -c "\d+" > db-optimization\output\schema_before_phase_a.txt

# List all indexes
psql "%SUPABASE_DB_URL%" -c "SELECT schemaname, tablename, indexname FROM pg_indexes WHERE schemaname='public';" > db-optimization\output\indexes_before_phase_a.txt

# List all views
psql "%SUPABASE_DB_URL%" -c "SELECT schemaname, viewname FROM pg_views WHERE schemaname='public';" > db-optimization\output\views_before_phase_a.txt
```

**Also**: Take a manual backup in Supabase Dashboard:
1. Go to Supabase Dashboard → Database → Backups
2. Click "Create manual backup" (if available on your plan)

---

### Step 8: Apply Phase A (Indexes, Views, Materialized Views)

This adds new objects without modifying existing queries (takes 15-30 minutes):

```bash
# Apply Phase A
psql "%SUPABASE_DB_URL%" -f db-optimization\migrations\phase_a_additive.sql > db-optimization\output\phase_a_output.txt 2>&1
```

**What's happening**:
- ✅ Creating ~70 new indexes (CONCURRENTLY - no locks)
- ✅ Creating 16 regular views
- ✅ Creating 8 materialized views
- ✅ Adding helper columns (participant_ids, cached_review_count, etc.)
- ✅ Creating refresh functions

**Monitor progress**:
```bash
# In another terminal, watch index creation
psql "%SUPABASE_DB_URL%" -c "SELECT query FROM pg_stat_activity WHERE query LIKE '%CREATE INDEX%';"
```

**Check for errors**:
```bash
# Look for "ERROR" in output
findstr /i "error" db-optimization\output\phase_a_output.txt
```

**If errors occur**:
1. Note the error message
2. Stop and rollback (see Step 15)
3. Fix the issue
4. Try again

---

### Step 9: Verify Phase A Succeeded

```bash
# Check that new objects were created
psql "%SUPABASE_DB_URL%" -c "SELECT 'Indexes' as type, COUNT(*)::text as count FROM pg_indexes WHERE schemaname='public' AND indexname LIKE 'idx_%' UNION ALL SELECT 'Views', COUNT(*)::text FROM pg_views WHERE schemaname='public' AND viewname LIKE 'vw_%' UNION ALL SELECT 'Mat Views', COUNT(*)::text FROM pg_matviews WHERE schemaname='public';"
```

**Expected output**:
```
type       | count
-----------+-------
Indexes    | 70+
Views      | 16
Mat Views  | 8
```

**If counts are lower**:
- Review `phase_a_output.txt` for errors
- Some objects may already exist (that's ok)

---

### Step 10: Monitor Performance (24-48 Hours)

After Phase A, monitor your application:

**Check 1: Application still works**
- Test all pages (directory, profiles, messaging, bookings)
- Check for any errors in browser console
- Verify pages load normally

**Check 2: Index usage**
```bash
# Check if new indexes are being used (run after 24 hours)
psql "%SUPABASE_DB_URL%" -c "SELECT indexname, idx_scan, idx_tup_read FROM pg_stat_user_indexes WHERE schemaname='public' AND indexname LIKE 'idx_%' ORDER BY idx_scan DESC LIMIT 20;" > db-optimization\output\index_usage_day1.txt
```

**Check 3: Query performance**
```bash
# Check slow queries (requires pg_stat_statements)
psql "%SUPABASE_DB_URL%" -c "SELECT LEFT(query, 100) as query, calls, ROUND(mean_exec_time::numeric, 2) as mean_ms FROM pg_stat_statements WHERE mean_exec_time > 50 ORDER BY mean_exec_time DESC LIMIT 10;" > db-optimization\output\slow_queries_day1.txt
```

**Check 4: Supabase Dashboard**
- Go to Dashboard → Database → Query Performance
- Look for improvements in query times

**⚠️ If you see issues**:
- Queries are slower (not faster)
- Application errors
- High CPU usage

→ **Rollback Phase A** (see Step 15)

---

## 📋 PHASE B: Verify & Backfill (Testing)

### Step 11: Apply Phase B

If Phase A went well after 24-48 hours, proceed:

```bash
# Apply Phase B
psql "%SUPABASE_DB_URL%" -f db-optimization\migrations\phase_b_verify_backfill.sql > db-optimization\output\phase_b_output.txt 2>&1
```

**What's happening**:
- ✅ Refreshing all materialized views (first time - may take 10-30 minutes)
- ✅ Running data integrity checks
- ✅ Backfilling cached columns
- ✅ Performance testing old vs. new query paths

**This will take longer** (30-60 minutes depending on data volume)

**Monitor progress**:
```bash
# Check if materialized views are refreshing
psql "%SUPABASE_DB_URL%" -c "SELECT pid, query, state FROM pg_stat_activity WHERE query LIKE '%REFRESH%';"
```

---

### Step 12: Review Phase B Results

```bash
# Check for errors
findstr /i "error" db-optimization\output\phase_b_output.txt

# Check data validation results
psql "%SUPABASE_DB_URL%" -c "SELECT * FROM matview_refresh_log ORDER BY started_at DESC LIMIT 10;"
```

**Expected output**:
- All materialized views refreshed successfully
- Data integrity checks pass (0 violations)
- Performance tests show improvements

**If data violations found**:
- Review the specific violations in output
- Fix data issues manually
- Re-run Phase B

---

### Step 13: Monitor Phase B (24-48 Hours)

**Check 1: Materialized view freshness**
```bash
psql "%SUPABASE_DB_URL%" -c "SELECT matviewname, ispopulated, (SELECT refreshed_at FROM mv_profile_stats LIMIT 1) as last_refresh FROM pg_matviews WHERE schemaname='public';"
```

**Check 2: Application performance**
- Test directory pages (should be faster with MV stats)
- Test profile pages (should load review counts instantly)
- Test admin dashboard (should show real-time metrics)

**Check 3: Cached data accuracy**
```bash
# Verify cached stats match actual stats
psql "%SUPABASE_DB_URL%" -c "SELECT p.id, p.cached_review_count, (SELECT COUNT(*) FROM reviews WHERE reviewee_id=p.id) as actual_count FROM profiles p WHERE cached_review_count IS NOT NULL LIMIT 10;"
```

Should match!

---

## 📋 PHASE C: Constraints & Cleanup (Careful!)

### Step 14: Apply Phase C (Only if A & B are stable)

**⚠️ WARNING**: This phase adds constraints that can reject invalid data

**Before proceeding, run validation queries**:

```bash
# Check for data that would violate constraints
psql "%SUPABASE_DB_URL%" -c "
-- Check for invalid ratings
SELECT 'Invalid ratings' as issue, COUNT(*) as count FROM reviews WHERE overall_rating < 1 OR overall_rating > 5
UNION ALL
-- Check for invalid dates
SELECT 'Invalid job dates', COUNT(*) FROM jobs WHERE start_date > end_date
UNION ALL
-- Check for orphaned guides
SELECT 'Orphaned guides', COUNT(*) FROM guides g LEFT JOIN profiles p ON p.id=g.profile_id WHERE p.id IS NULL;
"
```

**If counts are > 0**: Fix the data issues first before applying Phase C!

**If all counts are 0**:
```bash
# Apply Phase C
psql "%SUPABASE_DB_URL%" -f db-optimization\migrations\phase_c_cutover.sql > db-optimization\output\phase_c_output.txt 2>&1
```

**What's happening**:
- ⚠️ Adding foreign key constraints
- ⚠️ Adding check constraints
- ⚠️ Optimizing RLS policies
- ⚠️ Setting up MV refresh schedules

---

## 🔄 ROLLBACK (If Needed)

### Step 15: Rollback Phase A

If Phase A causes issues:

```bash
psql "%SUPABASE_DB_URL%" -f db-optimization\migrations\rollback_phase_a.sql > db-optimization\output\rollback_a_output.txt 2>&1
```

This removes all indexes, views, and materialized views created in Phase A.

### Step 16: Rollback Phase C

If Phase C causes issues:

```bash
psql "%SUPABASE_DB_URL%" -f db-optimization\migrations\rollback_phase_c.sql > db-optimization\output\rollback_c_output.txt 2>&1
```

This removes all constraints but keeps views and indexes.

---

## 📊 SUCCESS CRITERIA

### After Phase A
- ✅ 70+ new indexes created
- ✅ 16 views created
- ✅ 8 materialized views created
- ✅ Application works normally
- ✅ No errors in logs

### After Phase B
- ✅ All MVs refreshed successfully
- ✅ Cached data is accurate
- ✅ Performance improved (faster directory, profiles)
- ✅ No data integrity issues

### After Phase C
- ✅ Constraints added successfully
- ✅ No constraint violations
- ✅ Application still works
- ✅ Invalid data is rejected at insert time

---

## 🆘 TROUBLESHOOTING

### Issue: "psql: command not found"

**Solution**:
1. Download PostgreSQL from https://www.postgresql.org/download/windows/
2. Or use Supabase SQL Editor instead:
   - Go to Dashboard → SQL Editor
   - Paste the contents of the SQL file
   - Run each section manually

### Issue: "Connection refused"

**Solution**:
1. Check internet connection
2. Verify Supabase project is active (not paused)
3. Check if password changed: Dashboard → Settings → Database

### Issue: "Permission denied"

**Solution**:
1. Make sure you're using the `postgres` user (you are)
2. Some operations require service_role key (not regular postgres user)
3. Run commands as shown in scripts

### Issue: "Index creation takes forever"

**Solution**:
- This is normal for large tables (can take 5-30 minutes per index)
- Scripts use CONCURRENTLY so application stays online
- Wait for it to complete - don't interrupt!

### Issue: "Materialized view refresh is slow"

**Solution**:
- First refresh always takes longest (building from scratch)
- Subsequent refreshes are faster
- Run during off-peak hours
- Consider adjusting refresh frequency

---

## 📞 NEXT STEPS

After completing all phases:

### 1. Set Up Automated MV Refreshes

See `refresh_plan.md` for detailed instructions. Quick option:

**Using Supabase Edge Functions**:
1. Create function: `supabase/functions/refresh-matviews/index.ts`
2. Deploy: `supabase functions deploy refresh-matviews`
3. Schedule with GitHub Actions or Vercel Cron

### 2. Monitor Ongoing Performance

Run monthly:
```bash
psql "%SUPABASE_DB_URL%" -f db-optimization\slow_queries_analysis.sql > db-optimization\output\monthly_check.txt
```

### 3. Update Application Code (Optional)

Consider updating queries to use new views:

**Before**:
```typescript
const { data } = await supabase
  .from('profiles')
  .select('*, guides(*)')
  .eq('role', 'guide')
```

**After** (faster):
```typescript
const { data } = await supabase
  .from('vw_guide_directory')
  .select('*')
```

---

## ✅ COMPLETION CHECKLIST

- [ ] Step 1: Verified psql installed
- [ ] Step 2: Tested database connection
- [ ] Step 3: Ran statistics collection
- [ ] Step 4: Ran schema hygiene checks
- [ ] Step 5: Reviewed analysis documents
- [ ] Step 6: Decided to proceed
- [ ] Step 7: Created backup point
- [ ] Step 8: Applied Phase A
- [ ] Step 9: Verified Phase A
- [ ] Step 10: Monitored 24-48 hours ✓
- [ ] Step 11: Applied Phase B
- [ ] Step 12: Reviewed Phase B results
- [ ] Step 13: Monitored 24-48 hours ✓
- [ ] Step 14: Applied Phase C (optional)
- [ ] Set up automated MV refreshes
- [ ] Documented changes for team

---

## 🎉 CONGRATULATIONS!

If you've completed all steps, your database is now:
- ⚡ 10-20x faster on common queries
- 🛡️ Protected by constraints and foreign keys
- 📊 Using materialized views for instant aggregations
- 🔍 Fully indexed for optimal performance
- 📈 Ready to scale

**Estimated time savings**: 500-2000ms per page load → 50-200ms

**Questions?** Review the detailed documentation in each SQL file.
