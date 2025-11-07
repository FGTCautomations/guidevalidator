# Guide Search Filter Updates - Summary

## Changes Made

### 1. **Fixed Country Filter Caching Issue** ✅
- **File**: `lib/guides/api.ts`
- **Change**: Disabled Next.js caching (`cache: "no-store"`)
- **Why**: Results were cached per country, so changing countries showed cached Vietnamese guides
- **Result**: Now each filter change fetches fresh data from Edge Function

### 2. **Added Gender Facets** ✅
- **File**: `lib/guides/api.ts`
- **Change**: Added `genders: FacetCount[]` to `GuideSearchResponse` interface
- **Result**: Gender filter data is now properly typed

### 3. **Created Language Name Helper** ✅
- **File**: `lib/utils/language-names.ts`
- **Purpose**: Converts language codes (en, es, "en", "zh") to full names (English, Spanish, Chinese)
- **Handles**: Both quoted (`"en"`) and unquoted (`en`) formats from database

### 4. **Created Enhanced Filter Component** ✅
- **File**: `components/guides-v2/guide-filters-enhanced.tsx`
- **New Features**:
  - ✅ **Full language names** instead of codes (English vs "en")
  - ✅ **Gender filter** with facet counts
  - ✅ **Region & City dropdowns** (placeholder - needs implementation)
  - ✅ **Price range slider** (0-$500)
  - ✅ **Pending state** for checkboxes (shows immediately, applies on button click)
  - ✅ **Apply Filters button** (only shows when there are pending changes)
  - ✅ **All original filters**: verified, licensed, rating, search, specialties

## Next Steps (MANUAL)

### Update the Page to Use Enhanced Filters

**File**: `app/[locale]/directory/guides/page.tsx`

**Line 5** - Change from:
```typescript
import { GuideFilters } from "@/components/guides-v2/guide-filters";
```

To:
```typescript
import { GuideFiltersEnhanced } from "@/components/guides-v2/guide-filters-enhanced";
```

**Line 175** - Change from:
```typescript
<GuideFilters facets={data.facets} currentFilters={filterParams} />
```

To:
```typescript
<GuideFiltersEnhanced
  facets={data.facets}
  currentFilters={filterParams}
  regionOptions={[]}
  cityOptions={[]}
/>
```

## Testing Checklist

Once you restart `npm run dev`, test:

1. ✅ **Country switching** - Change from VN to another country, results should update
2. ✅ **Language display** - Should show "English" not "en"
3. ✅ **Gender filter** - Should show if available in facets
4. ✅ **Search** - Debounced, updates after 400ms
5. ✅ **Price slider** - Drag to set max price
6. ✅ **Rating filter** - Click 3+, 4+, 5+ stars
7. ✅ **Checkboxes** - Select multiple, click "Apply Filters"
8. ✅ **Clear All** - Resets everything except country

## Known Issues

### Language Data Format
Languages in database have extra quotes (`"en"` instead of `en`). The helper function handles both formats, but ideally the database should be fixed:

```sql
-- Fix language data (run in Supabase SQL Editor when ready)
UPDATE guides
SET spoken_languages = (
  SELECT array_agg(replace(lang, '"', ''))
  FROM unnest(spoken_languages) AS lang
)
WHERE EXISTS (
  SELECT 1 FROM unnest(spoken_languages) AS lang
  WHERE lang LIKE '%"%'
);

REFRESH MATERIALIZED VIEW CONCURRENTLY guides_browse_v;
```

## Files Created/Modified

- ✅ `lib/guides/api.ts` - Added genders facet, disabled caching
- ✅ `lib/utils/language-names.ts` - NEW: Language name mappings
- ✅ `components/guides-v2/guide-filters-enhanced.tsx` - NEW: Complete filter component
- ⏳ `app/[locale]/directory/guides/page.tsx` - NEEDS MANUAL UPDATE (see above)

## Architecture

```
User changes country dropdown
  ↓
CountryFilter updates URL (?country=DE)
  ↓
Page re-renders server-side
  ↓
searchGuides(params) called with cache: "no-store"
  ↓
Edge Function fetches fresh data from RPC
  ↓
Results + Facets returned
  ↓
GuideFiltersEnhanced shows filters with language names
  ↓
User selects filters → Apply button appears
  ↓
Click Apply → URL updates → Fresh fetch
```

## Performance

- **Edge Function**: Caches at CDN level (5min cache, 1hr stale)
- **Next.js**: No caching (`cache: "no-store"`)
- **Why**: Allows filter changes to fetch fresh data while still benefiting from Edge caching
