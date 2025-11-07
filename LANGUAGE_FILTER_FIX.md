# Language Filter Fix - Show All Languages

## Problem

After implementing the performance optimization that limits guide queries to 2000 results, the language filter was only showing languages present in the current result set. This meant:

- If you filtered to Vietnam + a specific specialty, you might only see 3-4 languages
- Users couldn't select a language that existed in the database but wasn't in the current 2000-guide subset
- The language options would change based on what filters were already applied

## Solution

Changed the language options to **always use the static list** from `PROFILE_LANGUAGE_CODES` constant instead of building it dynamically from the loaded guides.

### Code Change

**File:** `app/[locale]/directory/guides/page.tsx`

**Before:**
```typescript
const languageOptions = shouldFetchListings
  ? buildLanguageOptions(locale, baseListingsForOptions)  // Dynamic - only shows languages in results
  : buildStaticLanguageOptions(locale);                    // Static - shows all 13 languages
```

**After:**
```typescript
// Always use static list to show ALL available languages (not limited by current result set)
// This ensures users can see all language options even when only 2000 guides are loaded
const languageOptions = buildStaticLanguageOptions(locale);
```

## Result

Now the language filter **always shows all 13 supported languages**:

1. **Arabic** (ar)
2. **Chinese** (zh)
3. **English** (en)
4. **French** (fr)
5. **German** (de)
6. **Hindi** (hi)
7. **Italian** (it)
8. **Japanese** (ja)
9. **Korean** (ko)
10. **Portuguese** (pt)
11. **Russian** (ru)
12. **Spanish** (es)
13. **Urdu** (ur)

### Benefits

✅ **Consistent UX** - Language options don't change based on other filters
✅ **All languages visible** - Users can select any supported language
✅ **Better discoverability** - Shows the full scope of language options
✅ **No performance impact** - Static list is just as fast as dynamic list

### How It Works

1. The `PROFILE_LANGUAGE_CODES` constant in `lib/constants/profile.ts` defines all 13 supported languages
2. `buildStaticLanguageOptions()` maps these codes to localized language names
3. The filter UI always shows these 13 options
4. When "Apply Filters" is clicked, the database query uses the selected languages
5. Only guides matching the selected languages are returned (database-level filtering)

## Testing

To verify this works:

1. Go to http://localhost:3003/en/directory/guides
2. Select **Vietnam** from country dropdown
3. Click on **Languages** filter
4. **You should see all 13 languages** listed (not just languages from Vietnamese guides)
5. Select **Arabic**
6. Click **Apply Filters**
7. Only Arabic-speaking guides in Vietnam should be shown

## Related Files

- `lib/constants/profile.ts` - Contains `PROFILE_LANGUAGE_CODES` array
- `app/[locale]/directory/guides/page.tsx` - Uses static language list
- `lib/directory/queries.ts` - Database-level language filtering with `.overlaps()`

## Note on Dynamic vs Static

The previous implementation had a nice feature where it showed **counts** next to each language (e.g., "English (1,250)"). This was removed to ensure all languages are always visible.

If you want to restore the counts while keeping all languages visible, you could:

1. Fetch a count query for each language across ALL guides in the country
2. Show "0" next to languages with no guides
3. This would require additional database queries but would provide both benefits

Example:
```sql
SELECT
  unnest(spoken_languages) as language,
  COUNT(*) as guide_count
FROM guides
INNER JOIN profiles ON guides.profile_id = profiles.id
WHERE profiles.country_code = 'VN'
  AND profiles.application_status = 'approved'
GROUP BY language;
```

But for now, the simpler solution (static list, no counts) provides a better user experience.
