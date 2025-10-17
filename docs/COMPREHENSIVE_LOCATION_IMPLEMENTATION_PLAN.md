# Comprehensive Location & Profile Completion Implementation Plan

## Overview
This document outlines the implementation plan for:
1. Making all application form fields mandatory
2. Implementing comprehensive location selection (Countries → Regions/Provinces → Cities/Parks → Attractions)
3. Displaying all profile data in admin panel
4. Adding profile completion prompts

## Phase 1: Database Schema Enhancement

### 1.1 Create New Tables

```sql
-- Countries table (already exists, ensure it's populated with all world countries)
-- We'll use existing: public.countries

-- Regions/Provinces table
CREATE TABLE IF NOT EXISTS public.regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  code varchar(10) NOT NULL,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('province', 'state', 'region', 'prefecture', 'canton', 'territory')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_code, code)
);

-- Cities table
CREATE TABLE IF NOT EXISTS public.cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES public.regions(id) ON DELETE CASCADE,
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'city' CHECK (type IN ('city', 'town', 'village', 'municipality')),
  is_major boolean DEFAULT false,
  latitude decimal(10, 7),
  longitude decimal(10, 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(region_id, name)
);

-- National Parks table
CREATE TABLE IF NOT EXISTS public.national_parks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  region_id uuid REFERENCES public.regions(id) ON DELETE CASCADE,
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'national_park' CHECK (type IN ('national_park', 'nature_reserve', 'protected_area', 'wildlife_sanctuary')),
  latitude decimal(10, 7),
  longitude decimal(10, 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(country_code, name)
);

-- Tourist Attractions table
CREATE TABLE IF NOT EXISTS public.tourist_attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  city_id uuid REFERENCES public.cities(id) ON DELETE CASCADE,
  national_park_id uuid REFERENCES public.national_parks(id) ON DELETE CASCADE,
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'monument', 'museum', 'religious_site', 'historical_site',
    'landmark', 'cultural_center', 'entertainment', 'nature_spot',
    'viewpoint', 'beach', 'market', 'shopping_district'
  )),
  description text,
  latitude decimal(10, 7),
  longitude decimal(10, 7),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (city_id IS NOT NULL OR national_park_id IS NOT NULL)
);
```

### 1.2 Create Guide Location Junction Tables

```sql
-- Guide operates in countries
CREATE TABLE IF NOT EXISTS public.guide_operating_countries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  country_code varchar(2) NOT NULL REFERENCES public.countries(code) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guide_id, country_code)
);

-- Guide operates in regions
CREATE TABLE IF NOT EXISTS public.guide_operating_regions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  region_id uuid NOT NULL REFERENCES public.regions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guide_id, region_id)
);

-- Guide operates in cities
CREATE TABLE IF NOT EXISTS public.guide_operating_cities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  city_id uuid NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  all_attractions boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guide_id, city_id)
);

-- Guide operates in national parks
CREATE TABLE IF NOT EXISTS public.guide_operating_parks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  park_id uuid NOT NULL REFERENCES public.national_parks(id) ON DELETE CASCADE,
  all_attractions boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guide_id, park_id)
);

-- Guide specific attractions
CREATE TABLE IF NOT EXISTS public.guide_attractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  attraction_id uuid NOT NULL REFERENCES public.tourist_attractions(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(guide_id, attraction_id)
);
```

### 1.3 Add Profile Completion Tracking

```sql
-- Add profile completion fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS profile_completion_percentage integer DEFAULT 0 CHECK (profile_completion_percentage >= 0 AND profile_completion_percentage <= 100),
  ADD COLUMN IF NOT EXISTS profile_completion_last_prompted_at timestamptz,
  ADD COLUMN IF NOT EXISTS required_fields_missing jsonb DEFAULT '[]'::jsonb;

-- Add application data JSONB field to store all form responses
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS application_data jsonb DEFAULT '{}'::jsonb;

-- For guides specifically
ALTER TABLE public.guides
  ADD COLUMN IF NOT EXISTS location_data_complete boolean DEFAULT false;
```

## Phase 2: Data Population

### 2.1 Populate World Countries
- Import all 195 countries (will need a comprehensive countries dataset)
- Source: Use REST Countries API or similar

### 2.2 Populate Regions/Provinces
- Import regions for all countries
- This is extensive (e.g., US has 50 states, China has 34 provinces, etc.)
- Will need a comprehensive dataset

### 2.3 Populate Major Cities
- Import major cities for each region
- Focus on tourist destinations initially
- Can expand over time

### 2.4 Populate National Parks
- Import national parks by country/region
- Include major protected areas

### 2.5 Populate Tourist Attractions
- Import major tourist attractions by city/park
- This is the most extensive dataset
- Can be populated progressively

## Phase 3: UI Components

### 3.1 Location Selector Component

```typescript
// components/form/location-selector.tsx
interface LocationSelection {
  countries: string[]; // country codes
  regions: { [countryCode: string]: string[] }; // region IDs by country
  cities: { [regionId: string]: string[] }; // city IDs by region
  parks: { [regionId: string]: string[] }; // park IDs by region
  attractions: {
    cities: { [cityId: string]: { all: boolean; selected: string[] } };
    parks: { [parkId: string]: { all: boolean; selected: string[] } };
  };
}

export function LocationSelector({
  value,
  onChange,
  required
}: {
  value: LocationSelection;
  onChange: (value: LocationSelection) => void;
  required?: boolean;
}) {
  // Multi-step location selection UI
  // 1. Select countries (multi-select dropdown)
  // 2. For each country, show regions (multi-select)
  // 3. For each region, show cities and parks (multi-select)
  // 4. For each city/park, show attractions with "All" checkbox
}
```

### 3.2 Profile Completion Banner

```typescript
// components/profile/completion-banner.tsx
export function ProfileCompletionBanner({
  completionPercentage,
  missingFields,
  onDismiss
}: {
  completionPercentage: number;
  missingFields: string[];
  onDismiss: () => void;
}) {
  if (completionPercentage === 100) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex items-start">
        <div className="flex-1">
          <h3 className="text-sm font-medium text-yellow-800">
            Complete your profile ({completionPercentage}%)
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>Missing required information:</p>
            <ul className="list-disc list-inside mt-1">
              {missingFields.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
          <div className="mt-3">
            <button className="text-sm font-medium text-yellow-800 hover:text-yellow-900">
              Complete profile →
            </button>
          </div>
        </div>
        <button onClick={onDismiss} className="text-yellow-400 hover:text-yellow-500">
          ×
        </button>
      </div>
    </div>
  );
}
```

## Phase 4: Form Updates

### 4.1 Make All Fields Required
Update all form components to set `required={true}` on:
- Text inputs
- Textareas
- File uploads
- Selects
- At least one checkbox selection in groups

### 4.2 Add Location Selection to Guide Form
Replace the simple "operating regions" textarea with the comprehensive LocationSelector component.

### 4.3 Store All Form Data
Update form submission to store complete application data in `application_data` JSONB field.

## Phase 5: Admin Panel Enhancements

### 5.1 Display All Application Data
Update admin user detail page to show:
- All form fields submitted
- Location selections (hierarchical display)
- File uploads with links
- Application timestamps

### 5.2 Add Location Data Section
Create expandable section showing:
- Countries guide operates in
- Regions per country
- Cities and parks per region
- Attractions per city/park

## Phase 6: Profile Completion System

### 6.1 Calculate Completion Percentage
Create function to calculate profile completion:
```typescript
function calculateProfileCompletion(profile: Profile): {
  percentage: number;
  missingFields: string[];
} {
  const requiredFields = [
    'full_name',
    'email',
    'country_code',
    'timezone',
    // ... all required fields
  ];

  const completed = requiredFields.filter(field =>
    profile[field] !== null && profile[field] !== ''
  );

  return {
    percentage: (completed.length / requiredFields.length) * 100,
    missingFields: requiredFields.filter(f => !completed.includes(f))
  };
}
```

### 6.2 Add Middleware Check
Check profile completion on protected routes:
- If < 100%, show banner
- Store last prompted timestamp
- Don't spam user (max once per day)

## Implementation Timeline

### Phase 1: Immediate (Hours 1-4)
1. Make all existing form fields required ✓
2. Add application_data JSONB field ✓
3. Update form submission to capture all data ✓

### Phase 2: Short-term (Hours 5-12)
4. Create database schema for locations
5. Populate initial country/region data
6. Build basic LocationSelector component

### Phase 3: Medium-term (Hours 13-24)
7. Populate cities and parks data
8. Complete LocationSelector with attractions
9. Integrate into guide form

### Phase 4: Final (Hours 25-32)
10. Update admin panel display
11. Implement profile completion system
12. Add completion banner/prompts
13. Testing and refinement

## Data Sources

### Countries
- REST Countries API: https://restcountries.com/
- 195 countries with ISO codes

### Regions/Provinces
- GeoNames: http://www.geonames.org/
- Administrative divisions database

### Cities
- GeoNames cities database
- Filter by population for major cities

### National Parks
- Protected Planet API: https://www.protectedplanet.net/
- Wikipedia lists by country

### Tourist Attractions
- OpenStreetMap tourism tags
- Wikipedia "Tourist attractions in [City]"
- TripAdvisor API (if available)
- Manual curation for major destinations

## Notes

- This is an extensive implementation
- Start with phase 1 for immediate wins
- Phases 2-4 can be implemented progressively
- Location data can be populated over time
- Start with major tourist destinations
- Expand coverage based on guide registrations

## Files to Modify

1. `supabase/migrations/[timestamp]_comprehensive_locations.sql`
2. `components/form/location-selector.tsx` (new)
3. `components/profile/completion-banner.tsx` (new)
4. `components/auth/applications/guide-sign-up-form.tsx`
5. `app/[locale]/auth/sign-up/guide/actions.ts`
6. `app/[locale]/admin/users/[id]/page.tsx`
7. `lib/profile/completion.ts` (new)
8. `middleware.ts` (update)
