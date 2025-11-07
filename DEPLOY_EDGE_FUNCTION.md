# Deploy Edge Function - Step by Step

Since Docker is not available, deploy via Supabase Dashboard:

## Method 1: Via Supabase Dashboard (Easiest)

### Step 1: Open Edge Functions
👉 https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/functions

### Step 2: Create New Function
1. Click the **"Create a new function"** button
2. Enter function name: `guides-search`
3. Click **"Create function"**

### Step 3: Copy the Code
1. Open this file in VS Code:
   ```
   supabase/functions/guides-search/DASHBOARD_VERSION.ts
   ```
   ⚠️ **Important**: Use `DASHBOARD_VERSION.ts` (not `index.ts`)

2. Select All (`Ctrl+A`) and Copy (`Ctrl+C`)

### Step 4: Paste and Deploy
1. In the Supabase Dashboard, you'll see a code editor
2. **Delete all existing code** in the editor
3. Paste your code (`Ctrl+V`)
4. Click **"Deploy function"** button
5. Wait for deployment to complete (~30 seconds)

### Step 5: Verify Deployment
You should see:
- ✅ Status: "Active"
- ✅ A URL like: `https://vhqzmunorymtoisijiqb.supabase.co/functions/v1/guides-search`

---

## Method 2: Via Supabase CLI (If Docker Works)

If you get Docker working later:

```bash
cd c:/Users/PC/Guide-Validator
npx supabase functions deploy guides-search
```

---

## Test the Deployment

### Test with curl (PowerShell):
```powershell
curl "https://vhqzmunorymtoisijiqb.supabase.co/functions/v1/guides-search?country=VN&limit=3" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTc4MzcsImV4cCI6MjA3NDM3MzgzN30.kKcEcFyf0knJ93ktT2k88V_dHOrOeVn7ExNtm-CqekE"
```

### Test in Browser:
Open this URL (replace VN with your country):
```
https://vhqzmunorymtoisijiqb.supabase.co/functions/v1/guides-search?country=VN&limit=5
```

You may see "Authorization required" - that's expected in browser. The curl test will work.

---

## Expected Response

You should see JSON like:
```json
{
  "results": [
    {
      "id": "...",
      "name": "Guide Name",
      "country_code": "VN",
      "languages": ["en", "vi"],
      "specialties": [...],
      "rating": 4.5,
      "review_count": 10,
      ...
    }
  ],
  "facets": {
    "languages": [
      {"value": "en", "count": 15000},
      {"value": "vi", "count": 25000}
    ],
    "specialties": [...],
    "total": 25000
  },
  "nextCursor": "MTUwOjEyMzQ1Njc4..."
}
```

---

## ❌ Troubleshooting

### Error: "Missing Supabase configuration"
→ The function needs environment variables. These should be auto-set by Supabase.
   Check: Dashboard → Settings → API

### Error: "Database error: relation guides_browse_v does not exist"
→ The migration hasn't been applied yet.
   Go back and apply the migration first (see APPLY_MIGRATION_NOW.md)

### Error: "function api_guides_search does not exist"
→ The RPC function wasn't created.
   Re-run the migration SQL

### Error: 404 Not Found
→ Function name is wrong or not deployed.
   Check the function exists in Dashboard → Functions

---

## ✅ If Successful

You should see:
- ✅ JSON response with `results`, `facets`, and `nextCursor`
- ✅ `facets.total` shows your guide count
- ✅ `results` array contains guide objects

**Next Step:** Test the Next.js app (see next section)

---

## 🔄 Update Function Later

To update the function after changes:
1. Go to Dashboard → Functions → guides-search
2. Click "Edit function"
3. Update the code
4. Click "Deploy function"
