# GuideValidator System Architecture

## Database Structure for All Account Types

### Field Definitions

| Field | Type | Purpose | Values |
|-------|------|---------|--------|
| `active` | boolean | **Directory Visibility** | `true` = Shows in public directory<br>`false` = Hidden/Frozen (removed from directory) |
| `application_status` | enum | **Admin Approval Status** | `pending` = Awaiting admin review (limited info shown)<br>`approved` = Admin approved (full info shown)<br>`rejected` = Application denied |
| `verified` | boolean | **Profile Ownership** | `true` = Owner has claimed profile (✓ Verified badge)<br>`false` = Profile not claimed (Unverified badge) |

---

## System Behavior

### 1. **Directory Visibility (`active` field)**

| Value | Effect | Used For |
|-------|--------|----------|
| `active = true` | **Shows in public directory** | Active accounts that should be discoverable |
| `active = false` | **Hidden from directory** | Frozen/suspended accounts |

**Example**:
- Agency with `active=true` → Appears at `/directory/agencies?country=VN`
- Agency with `active=false` → Does not appear in directory (frozen)

---

### 2. **Admin Approval (`application_status` field)**

| Status | Information Shown | Badge Color |
|--------|------------------|-------------|
| `pending` | **Limited Info**: Name, license number only | 🟡 Yellow |
| `approved` | **Full Info**: All profile details, contact info | 🟢 Green |
| `rejected` | Application denied | 🔴 Red |

**Example**:
- Guide with `status=pending` → Shows minimal info in directory
- Guide with `status=approved` → Shows complete profile

---

### 3. **Profile Verification (`verified` field)**

| Value | Badge | Meaning |
|-------|-------|---------|
| `verified = true` | **✓ Verified** | Owner has claimed and verified their profile |
| `verified = false` | **Unverified** | Profile imported or not yet claimed |

**Example**:
- Agency with `verified=true` → Shows "✓ Verified" badge
- Agency with `verified=false` → Shows "Unverified" badge

---

## Complete State Matrix

| active | application_status | verified | Directory | Info Shown | Badge |
|--------|-------------------|----------|-----------|------------|-------|
| `true` | `pending` | `false` | ✅ Visible | Limited | 🟡 Pending + Unverified |
| `true` | `pending` | `true` | ✅ Visible | Limited | 🟡 Pending + ✓ Verified |
| `true` | `approved` | `false` | ✅ Visible | Full | 🟢 Approved + Unverified |
| `true` | `approved` | `true` | ✅ Visible | Full | 🟢 Approved + ✓ Verified |
| `false` | `*` | `*` | ❌ Hidden | N/A | Frozen/Suspended |
| `*` | `rejected` | `*` | ❌ Hidden | N/A | Rejected |

---

## Current Vietnamese Agencies State

**All 5,863 agencies are configured as**:
- `active = true` ✅ (visible in directory)
- `application_status = pending` ⏳ (awaiting admin approval)
- `verified = false` 🔓 (profile not claimed by owner)

This means they will appear in the directory with limited information until:
1. Admin approves them (`application_status` → `approved`) = Full info shown
2. Owner claims them (`verified` → `true`) = ✓ Verified badge

---

## Admin Filter Options

### Account Type Filter
- ☑ Guide
- ☑ Travel Agency
- ☑ DMC
- ☑ Transport

### Status Filter (Directory Visibility)
- ☑ Active (shows in directory)
- ☑ Frozen (hidden from directory)

### Approval Filter (Info Level)
- ☑ Pending (limited info)
- ☑ Approved (full info)
- ☑ Rejected (denied)

### Verification Filter (Ownership)
- ☑ Verified (✓ profile claimed)
- ☑ Unverified (not claimed)

---

## Example Scenarios

### Scenario 1: Imported Vietnamese Agency
```
active: true          → Shows in /directory/agencies?country=VN
application_status: pending  → Only name & license visible
verified: false       → Shows "Unverified" badge
```

### Scenario 2: Admin Approves Agency
```
active: true          → Still shows in directory
application_status: approved → NOW shows full profile info
verified: false       → Still shows "Unverified" badge
```

### Scenario 3: Owner Claims Profile
```
active: true          → Still shows in directory
application_status: approved → Full info still shown
verified: true        → NOW shows "✓ Verified" badge
```

### Scenario 4: Admin Freezes Account
```
active: false         → REMOVED from directory
application_status: approved → (not relevant, account frozen)
verified: true        → (not relevant, account frozen)
```

---

## Implementation Notes

### For Directories (`/directory/*`)
- Filter by: `WHERE active = true AND deleted_at IS NULL`
- Ignore `application_status` for visibility
- Show limited vs full info based on `application_status`

### For Admin Panel (`/admin/*`)
- Show ALL accounts regardless of `active` status
- Allow filtering by all three fields
- Allow admin to toggle `active`, `application_status`, `verified`

### For Materialized Views
- Filter by: `WHERE active = true` (not by `application_status = 'approved'`)
- This allows pending accounts to appear in directory with limited info

---

**This architecture separates three independent concerns**:
1. **Visibility** (`active`) - Is it in the directory?
2. **Info Level** (`application_status`) - How much info is shown?
3. **Trust** (`verified`) - Is it owner-verified?
