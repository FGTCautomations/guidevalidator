# Database Consolidation Plan

## Current Problem

The database has **82 tables** with significant redundancy:

### 1. Guide Workflow Issues
- **guide_applications** table (application data) → **guides** table (approved guides)
- These are separate tables causing potential sync issues
- Application data has different columns than guides table
- Risk of data loss during approval process

### 2. Agency Workflow Issues
- **agency_applications** table → **agencies** table
- **dmc_applications** table → **agencies** table (type='dmc')
- **transport_applications** table → **agencies** table (type='transport')
- Three separate application tables for the same destination

### 3. Redundant Location Junction Tables
- **guide_cities**, **guide_regions**, **guide_countries**, **guide_parks**, **guide_attractions**
- **dmc_cities**, **dmc_regions**, **dmc_countries**
- **transport_cities**, **transport_regions**, **transport_countries**
- All doing the same thing (linking entities to locations)

### 4. Separate Ratings Tables
- **guide_ratings_summary**
- **agency_ratings_summary**
- **transport_ratings_summary**
- Can be consolidated

---

## Proposed Consolidated Structure

### Master Tables (4 main entities)

#### 1. **profiles** (remains mostly the same)
Master user authentication and basic info table. All users start here.

**Added columns:**
- `application_status` (pending, approved, rejected, revision_requested)
- `application_submitted_at`
- `application_reviewed_at`
- `application_reviewed_by`
- `rejection_reason`

#### 2. **guides** (consolidated master guide table)
Single source of truth for all guide data (both applications and approved)

**Merge in data from:**
- ✓ Current `guides` table (approved guides)
- ✓ `guide_applications` table (pending applications)

**Status tracking:**
- Use `profiles.application_status` for approval workflow
- When approved, data stays in `guides` table
- No more separate application table

**New structure:**
```sql
guides (
  profile_id uuid PRIMARY KEY,  -- FK to profiles.id

  -- Basic Info
  headline text,
  bio text,
  professional_intro text,

  -- Qualifications
  specialties text[],
  expertise_areas text[],
  spoken_languages text[],
  years_experience integer,
  experience_summary text,

  -- Business Details
  business_name text,
  hourly_rate_cents integer,
  currency char(3),
  gender text,
  owns_vehicle boolean,
  has_liability_insurance boolean,
  response_time_minutes integer,

  -- License & Verification
  license_number text,
  license_authority text,
  license_proof_url text,
  id_document_url text,
  last_verified_at timestamptz,

  -- Media
  avatar_url text,
  profile_photo_url text,
  sample_itineraries jsonb,
  media_gallery jsonb,

  -- Availability
  timezone text,
  availability_timezone text,
  working_hours jsonb,
  availability_notes text,

  -- Location (denormalized for quick access)
  location_data jsonb,  -- {countries: [], regions: [], cities: [], parks: []}

  -- Application Data (temporary during approval)
  application_data jsonb,  -- Stores original application

  -- Timestamps
  created_at timestamptz,
  updated_at timestamptz
)
```

#### 3. **agencies** (consolidated master agency/DMC/transport table)
Already consolidated! Just needs application merge.

**Merge in data from:**
- ✓ `agency_applications`
- ✓ `dmc_applications`
- ✓ `transport_applications`

**Enhanced structure:**
```sql
agencies (
  id uuid PRIMARY KEY,  -- NOT profile_id (agencies can have multiple members)

  -- Type & Identity
  type agency_type,  -- 'agency', 'dmc', 'transport'
  name text,
  slug text,

  -- Location
  country_code char(2),
  location_data jsonb,  -- {countries: [], regions: [], cities: []}
  coverage_summary text,

  -- Business Details
  registration_number text,
  vat_id text,
  website text,
  logo_url text,
  description text,
  compliance_notes text,

  -- Service Details
  languages text[],
  specialties text[],

  -- Transport-specific (if type='transport')
  fleet_data jsonb,  -- Vehicle information

  -- Status
  featured boolean,
  verified boolean,

  -- Application Data (temporary during approval)
  application_status text,
  application_submitted_at timestamptz,
  application_reviewed_at timestamptz,
  application_reviewed_by uuid,
  application_data jsonb,
  rejection_reason text,

  -- Timestamps
  created_at timestamptz,
  updated_at timestamptz
)
```

#### 4. **entity_locations** (new unified junction table)
Replaces ALL location junction tables.

```sql
entity_locations (
  id uuid PRIMARY KEY,
  entity_type text,  -- 'guide', 'agency', 'dmc', 'transport'
  entity_id uuid,
  location_type text,  -- 'country', 'region', 'city', 'park', 'attraction'
  location_id uuid,  -- FK to countries/regions/cities/national_parks/tourist_attractions
  created_at timestamptz,

  UNIQUE(entity_type, entity_id, location_type, location_id)
)
```

**Replaces 12 tables:**
- guide_countries, guide_regions, guide_cities, guide_parks, guide_attractions
- dmc_countries, dmc_regions, dmc_cities
- transport_countries, transport_regions, transport_cities

---

## Migration Strategy

### Phase 1: Add Status Columns (Non-breaking)
Add new columns to existing tables without dropping anything.

### Phase 2: Migrate Application Data
Copy data from `*_applications` tables into master tables with `application_status='pending'`.

### Phase 3: Create Unified Location Table
Create `entity_locations` and migrate all junction table data.

### Phase 4: Update Application Code
Update all queries to use new structure.

### Phase 5: Drop Old Tables
After verification, drop old application and junction tables.

---

## Tables to Remove (After Migration)

### Application Tables (6 tables → 0)
- ✗ guide_applications
- ✗ agency_applications
- ✗ dmc_applications
- ✗ transport_applications
- ✗ job_applications (separate issue)

### Location Junction Tables (12 tables → 1)
- ✗ guide_cities
- ✗ guide_regions
- ✗ guide_countries
- ✗ guide_parks
- ✗ guide_attractions
- ✗ dmc_cities
- ✗ dmc_regions
- ✗ dmc_countries
- ✗ transport_cities
- ✗ transport_regions
- ✗ transport_countries
- ✓ NEW: entity_locations (unified)

### Redundant Rating Tables (2 tables → 0, use materialized views)
- ✗ guide_ratings_summary (replaced by mv_profile_stats)
- ✗ agency_ratings_summary (replaced by mv_profile_stats)
- ✗ transport_ratings_summary (replaced by mv_profile_stats)

### Deprecated Review Tables (3 tables → 0, use unified reviews)
- ✗ guide_reviews (data migrated to reviews)
- ✗ agency_reviews (data migrated to reviews)
- ✗ transport_reviews (data migrated to reviews)

### Unused/Redundant Tables
- ✗ guide_availability (data in availability_slots)
- ✗ calendar_accounts (if unused)
- ✗ honey_tokens (if unused)
- ✗ impersonation_logs (move to audit_logs)

**Total Reduction: 82 tables → ~50 tables (32 tables removed)**

---

## Benefits

1. **Single Source of Truth**: Application data and live data in same table
2. **No Data Loss**: Application data preserved during approval
3. **Simplified Queries**: No more joins between applications and master tables
4. **Unified Location System**: One table for all entity-location relationships
5. **Easier Maintenance**: Fewer tables to manage and index
6. **Better Performance**: Fewer tables = fewer index lookups
7. **Clearer Schema**: Logical structure easier to understand

---

## Risk Mitigation

1. **Backup First**: Full database backup before any changes
2. **Phased Approach**: Incremental changes, not big bang
3. **Data Validation**: Verify row counts match before dropping tables
4. **Keep Old Tables**: Don't drop until fully tested (rename to `_deprecated`)
5. **Transaction Rollback**: All migrations in transactions with rollback capability

---

## Implementation Timeline

- **Phase 1-2**: 2-3 hours (schema changes + data migration)
- **Phase 3**: 1 hour (unified location table)
- **Phase 4**: 3-4 hours (update application code)
- **Phase 5**: 30 minutes (testing and cleanup)

**Total Estimated Time**: 7-9 hours

---

## Next Steps

1. ✓ Review and approve this plan
2. Create full database backup
3. Execute Phase 1: Schema enhancements
4. Execute Phase 2: Data migration
5. Execute Phase 3: Unified locations
6. Execute Phase 4: Code updates
7. Execute Phase 5: Testing and cleanup
