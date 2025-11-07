# 🔧 Quick Fix - Edge Function Deployment

## ❌ Error You Got
```
Entrypoint path does not exist - /tmp/.../index.ts
```

## ✅ Solution
Use the **Dashboard version** of the code instead.

---

## 📝 Step-by-Step Fix

### 1. Open Supabase Functions Dashboard
👉 https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/functions

### 2. Delete the Failed Function (if it exists)
- If you see "guides-search" in the list with error status
- Click the **3 dots** → **Delete function**

### 3. Create New Function
- Click **"Create a new function"**
- Name: `guides-search`
- Click **"Create function"**

### 4. Copy the DASHBOARD Version
Open this file in VS Code:
```
supabase/functions/guides-search/DASHBOARD_VERSION.ts
```

⚠️ **Important**: Use `DASHBOARD_VERSION.ts` NOT `index.ts`

Press:
- `Ctrl+A` (Select All)
- `Ctrl+C` (Copy)

### 5. Paste in Dashboard
1. You'll see a code editor with some template code
2. **Select all the template code** (`Ctrl+A`)
3. **Delete it**
4. **Paste your code** (`Ctrl+V`)
5. Click **"Deploy function"**
6. Wait ~30 seconds

---

## ✅ Expected Result

You should see:
- ✅ Status: "Active" (green)
- ✅ URL: `https://vhqzmunorymtoisijiqb.supabase.co/functions/v1/guides-search`

---

## 🧪 Test It

### In PowerShell:
```powershell
curl "https://vhqzmunorymtoisijiqb.supabase.co/functions/v1/guides-search?country=VN&limit=3" `
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZocXptdW5vcnltdG9pc2lqaXFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3OTc4MzcsImV4cCI6MjA3NDM3MzgzN30.kKcEcFyf0knJ93ktT2k88V_dHOrOeVn7ExNtm-CqekE"
```

### Expected Response:
```json
{
  "results": [...],
  "facets": {
    "languages": [...],
    "specialties": [...],
    "total": 25000
  },
  "nextCursor": "..."
}
```

✅ If you see JSON with results → **SUCCESS!**

---

## ❌ Still Getting Errors?

### Error: "Missing Supabase configuration"
→ The environment variables are missing. They should be auto-set by Supabase.
   Try: Re-deploy the function

### Error: "Database error: relation guides_browse_v does not exist"
→ The migration hasn't been applied yet!
   Go back and apply the migration first (see APPLY_MIGRATION_NOW.md)

### Error: "function api_guides_search does not exist"
→ The RPC function wasn't created in the migration.
   Re-run the migration SQL

---

## 📋 Checklist

- [ ] Migration applied (guides_browse_v exists)
- [ ] Used DASHBOARD_VERSION.ts (not index.ts)
- [ ] Deleted all template code before pasting
- [ ] Function shows "Active" status
- [ ] curl test returns JSON

---

## 🎯 Next Step

Once the Edge Function is working:
1. Start your dev server: `npm run dev`
2. Visit: http://localhost:3000/en/guides-v2
3. Select "Vietnam" and see it work!

---

**Need more help?** Copy the exact error message and let me know!
