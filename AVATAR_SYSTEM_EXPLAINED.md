# Avatar System Explained

## The Confusion: "profile_avatar is null"

You saw in the SQL results:
```json
{
  "profile_avatar": null,
  "guide_avatar": "https://huongdanvien.vn/dmdocuments/...",
  "display_avatar": "https://huongdanvien.vn/dmdocuments/..."
}
```

And commented: *"profile_avatar is null should be avatar_url"*

## Here's What's Actually Happening

### 1. Database Column Names (THE TRUTH)

**Profiles Table**:
```sql
profiles
├── id (UUID)
├── full_name (TEXT)
├── avatar_url (TEXT) ← THIS IS THE REAL COLUMN NAME
├── role (TEXT)
└── ...
```

**Guides Table**:
```sql
guides
├── profile_id (UUID)
├── license_number (TEXT)
├── headline (TEXT)
├── avatar_url (TEXT) ← THIS IS ALSO THE REAL COLUMN NAME
└── ...
```

### 2. SQL Query Aliases (JUST FOR DISPLAY)

In my diagnostic SQL, I used **aliases** to make it clear which table the avatar came from:

```sql
SELECT
    p.avatar_url as profile_avatar,  -- Alias: "profile_avatar"
    g.avatar_url as guide_avatar,    -- Alias: "guide_avatar"
    COALESCE(p.avatar_url, g.avatar_url) as display_avatar
FROM guides g
INNER JOIN profiles p ON g.profile_id = p.id
```

**What this means**:
- `profile_avatar` = nickname for `profiles.avatar_url` (just in this query)
- `guide_avatar` = nickname for `guides.avatar_url` (just in this query)
- Both actual columns are named `avatar_url` in their respective tables

### 3. Why "profile_avatar" is NULL

**For imported guides who haven't claimed their profile yet**:

| Stage | profiles.avatar_url | guides.avatar_url |
|-------|-------------------|------------------|
| After Import | `NULL` | `"https://..."` |
| After Profile Claim | `NULL` | `"https://..."` |
| After User Updates Avatar | `"https://new-url"` | `"https://..."` |

**This is CORRECT behavior**:
1. Guides are imported with avatars → stored in `guides.avatar_url`
2. Profiles are created but avatar is empty → `profiles.avatar_url` is NULL
3. When guide claims profile → they're linked, but still NULL until they update
4. When guide uploads new avatar → `profiles.avatar_url` gets the new URL

### 4. How the Code Handles This

In [components/admin/users-manager.tsx:234-244](components/admin/users-manager.tsx#L234-L244):

```tsx
{(profile.avatar_url || guide.avatar_url) ? (
  <img
    src={profile.avatar_url || guide.avatar_url}
    alt={profile.full_name || "Guide"}
    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
  />
) : (
  <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
    {profile.full_name?.slice(0, 2).toUpperCase() || "??"}
  </div>
)}
```

**Logic Flow**:
1. Try `profile.avatar_url` first (custom avatar after claiming)
2. If NULL, try `guide.avatar_url` (imported avatar)
3. If both NULL, show blue circle with initials

### 5. The Avatar Journey

```
┌─────────────────────────────────────────────────────────────┐
│ STAGE 1: Import                                             │
├─────────────────────────────────────────────────────────────┤
│ guides.avatar_url = "https://huongdanvien.vn/..."          │
│ profiles.avatar_url = NULL                                  │
│ DISPLAY: Shows imported avatar ✓                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STAGE 2: Guide Claims Profile                              │
├─────────────────────────────────────────────────────────────┤
│ guides.avatar_url = "https://huongdanvien.vn/..."          │
│ profiles.avatar_url = NULL                                  │
│ DISPLAY: Still shows imported avatar ✓                     │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ STAGE 3: Guide Uploads New Avatar                          │
├─────────────────────────────────────────────────────────────┤
│ guides.avatar_url = "https://huongdanvien.vn/..."          │
│ profiles.avatar_url = "https://supabase-storage/new.jpg"   │
│ DISPLAY: Shows NEW custom avatar ✓                         │
└─────────────────────────────────────────────────────────────┘
```

## Summary

**Your SQL Results Are CORRECT**:
- ✅ `profile_avatar: null` - Expected for unclaimed/not-yet-updated profiles
- ✅ `guide_avatar: "https://..."` - Imported avatar from Vietnamese database
- ✅ `display_avatar: "https://..."` - Correctly shows the guide's avatar

**The Column IS Called `avatar_url`**:
- In `profiles` table: column is `avatar_url`
- In `guides` table: column is `avatar_url`
- In SQL query: I just renamed them to `profile_avatar` and `guide_avatar` for clarity

**The Code Is Working Correctly**:
- Checks both `profile.avatar_url` and `guide.avatar_url`
- Shows whichever one has a value
- Prefers the profile's custom avatar over the imported avatar

## What You Should See After Restart

When you refresh the admin panel, you should see:
- **Actual avatar images** loading from `https://huongdanvien.vn/dmdocuments/...`
- **Not blue circles** (unless a guide truly has no avatar in either table)
- Images in a circular frame with a border

If you're still seeing blue circles for guides that HAVE `guide_avatar` URLs in the database, then there's an issue with:
1. Dev server not restarted
2. Browser cache not cleared
3. Image URLs being blocked/unreachable
4. Network issue loading external images

## Quick Diagnostic

If avatars still don't show, run this in browser console (F12):
```javascript
// Check if avatar URLs are being passed to component
console.log(document.querySelector('img[alt*="Guide"]'));
```

If the `<img>` tag exists but image doesn't load:
- Check Network tab for failed image requests
- Try opening one of the URLs directly in a new tab
- Check if Vietnamese website is blocking hotlinking
