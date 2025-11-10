# Database Cleanup Guide

## Summary

Your Supabase database has **70 tables**, but only **36 are actively used** by your website. This guide helps you safely remove the **40 unused tables**.

## 📋 How to Clean Up

### Step 1: Backup Your Database

**Option A: Full PostgreSQL Backup (Recommended)**
```bash
# From your local machine or Supabase dashboard SQL Editor
pg_dump -h db.vhqzmunorymtoisijiqb.supabase.co \
  -U postgres \
  -d postgres \
  -F c \
  -f backup_$(date +%Y%m%d).dump
```

**Option B: Archive to Separate Schema**
```sql
-- Run backup-before-cleanup.sql in Supabase SQL Editor
-- This creates an 'archived_tables' schema with all data
```

### Step 2: Run the Cleanup Script

In Supabase SQL Editor, run:
```sql
-- Execute: cleanup-unused-tables.sql
```

### Step 3: Verify

Check remaining tables:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

You should have exactly **36 tables** remaining.

---

## ✅ Tables to KEEP (36 total)

### Core User & Auth (5)
- `profiles` - User profiles
- `guides` - Guide-specific data
- `agencies` - Agency/DMC/Transport data
- `guide_credentials` - Licenses & certifications
- `profile_claim_tokens` - Profile claiming system

### Location Data (4)
- `countries` - Country master data
- `regions` - Region/state data
- `cities` - City data
- `country_licensing_rules` - Licensing requirements

### Reviews & Ratings (2)
- `reviews` - Review submissions
- `review_responses` - Guide responses

### Availability & Bookings (2)
- `availability_slots` - Guide availability calendar
- `availability_holds` - Temporary booking holds

### Messaging/Chat (4)
- `conversations` - Chat conversations
- `messages` - Chat messages
- `conversation_participants` - Conversation members
- `message_attachments` - File attachments

### Jobs Board (2)
- `jobs` - Job postings
- `job_applications` - Applications to jobs

### Advertising (2)
- `ads` - Ad campaigns
- `ad_clicks` - Click tracking

### Billing & Subscriptions (5)
- `billing_customers` - Stripe customers
- `billing_plans` - Subscription plans
- `subscriptions` - Active subscriptions
- `payments` - Payment records
- `billing_events` - Event logs

### Admin & Moderation (3)
- `abuse_reports` - Reported content
- `audit_logs` - Admin actions
- `dsar_requests` - GDPR requests

### Import System (1)
- `staging_imports` - Bulk import tracking

---

## ❌ Tables to DELETE (40 total)

### Not Implemented Features
- `agency_members` - Team management (not built)
- `badges`, `profile_badges` - Gamification (not built)
- `calendar_accounts` - Calendar sync (not built)
- `contact_reveals`, `contact_reveal_settings` - Contact reveal (not built)
- `feature_flags` - A/B testing (not built)
- `message_reactions` - Emoji reactions (not built)
- `referrals`, `referral_events` - Referral program (not built)
- `saved_searches`, `saved_search_runs` - Search alerts (not built)
- `shortlists`, `shortlist_items` - Favorites (not built)
- `transport_fleet` - Fleet management (not built)

### Unused Location Data
- `entity_locations` - Generic locations
- `national_parks`, `national_parks_stage` - Parks database
- `tourist_attractions` - Attractions

### Alternative/Old Systems
- `banners`, `sponsored_listings` - Old ad system (using `ads` now)
- `consents` - Old consent system
- `gdpr_audit_log` - Old GDPR logs (using `dsar_requests`)
- `guides_staging` - Old staging (using `staging_imports`)
- `holds` - Old holds (using `availability_holds`)

### Unused Admin/Security
- `archived_accounts` - Account archiving
- `honey_tokens` - Security honeypots
- `impersonation_logs` - Impersonation tracking
- `mfa_reset_tokens` - MFA reset
- `moderation_queue` - Content moderation
- `strikes`, `user_strikes` - User strikes

### Unused Monitoring
- `cron_tasks` - Cron tracking
- `job_runs`, `jobs_queue` - Job queue
- `file_moderation_events`, `file_uploads` - File tracking
- `renewal_events` - Renewal tracking

### Unused Legal/Compliance
- `terms_versions` - Terms history
- `user_consents` - User consents

---

## 🔄 Restore Instructions

If you need to restore a deleted table:

```sql
-- If you used backup-before-cleanup.sql:
CREATE TABLE public.table_name AS
SELECT * FROM archived_tables.table_name;

-- If you used pg_dump:
pg_restore -h [host] -U postgres -d postgres -t table_name backup.dump
```

---

## 📊 Storage Savings

Removing 40 unused tables will:
- ✅ Reduce database complexity
- ✅ Speed up backups/restores
- ✅ Improve query performance
- ✅ Simplify maintenance
- ✅ Potentially reduce storage costs

---

## ⚠️ Important Notes

1. **Always backup first!** Run `backup-before-cleanup.sql` before cleanup
2. **Test on staging** if you have a staging environment
3. **Check RLS policies** - Unused tables might have Row Level Security policies that can also be removed
4. **Check functions/triggers** - Some might reference deleted tables
5. **Update documentation** - Remove references to deleted tables

---

## 🆘 Need Help?

If something goes wrong:
1. Check the `archived_tables` schema for your data
2. Restore from `pg_dump` backup
3. Contact Supabase support if needed

---

Generated: 2025-11-10
Website: https://guidevalidator.com
