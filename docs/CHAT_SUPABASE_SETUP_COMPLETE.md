# ✅ Chat System Supabase Setup - COMPLETE

**Date:** October 1, 2025
**Status:** All verification checks passed ✅

---

## Summary

The Guide Validator chat system has been fully configured in Supabase with all required infrastructure:

✅ Database tables created
✅ RLS policies configured
✅ Storage bucket created
✅ Storage policies configured
✅ Realtime enabled
✅ All verification checks passed

---

## 1. Database Migration Applied ✅

**Migration:** `20251001000000_abuse_reports.sql`

**Tables Created:**
- ✅ `abuse_reports` - Stores abuse reports from users
- ✅ `user_strikes` - Tracks violations and strikes

**RLS Policies Created:**
- ✅ `abuse_reports_select_own` - Users can view their own reports
- ✅ `abuse_reports_insert` - Users can create reports
- ✅ `abuse_reports_admin_all` - Admins can manage all reports
- ✅ `user_strikes_admin_all` - Admins can manage strikes
- ✅ `user_strikes_select_own` - Users can view their active strikes

**Command Used:**
```bash
node scripts/apply-abuse-reports-migration.mjs
```

---

## 2. Storage Bucket Created ✅

**Bucket Name:** `message-attachments`

**Configuration:**
- **Privacy:** Private ✅
- **Max File Size:** 10 MB (10,485,760 bytes) ✅
- **Allowed MIME Types:** 6 types ✅
  - `image/jpeg`
  - `image/png`
  - `image/gif`
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

**Command Used:**
```bash
node scripts/setup-storage-bucket.mjs
```

---

## 3. Storage RLS Policies Configured ✅

**Policies Created:**

### Upload Policy
```sql
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
);
```

### Read Policy
```sql
CREATE POLICY "Users can read their conversation attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM public.message_attachments ma
    INNER JOIN public.messages m ON m.id = ma.message_id
    INNER JOIN public.conversation_participants cp
      ON cp.conversation_id = m.conversation_id
    WHERE ma.storage_path = name
    AND cp.profile_id = auth.uid()
  )
);
```

### Delete Policy
```sql
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM public.message_attachments ma
    INNER JOIN public.messages m ON m.id = ma.message_id
    WHERE ma.storage_path = name
    AND m.sender_id = auth.uid()
  )
);
```

---

## 4. Realtime Enabled ✅

**Tables Enabled for Realtime:**
- ✅ `conversations`
- ✅ `messages`
- ✅ `message_attachments`
- ✅ `conversation_participants`

**Configuration:**
- **Publication:** `supabase_realtime` ✅
- **Replica Identity:** FULL (for all tables) ✅
  - Enables tracking of UPDATE and DELETE operations
  - Required for Realtime to broadcast all column changes

**Command Used:**
```bash
node scripts/enable-realtime.mjs
```

---

## 5. Verification Results ✅

**Verification Script:** `scripts/verify-chat-setup.mjs`

### Check 1: Core Chat Tables ✅
- ✅ conversations
- ✅ messages
- ✅ message_attachments
- ✅ conversation_participants

### Check 2: Abuse Reporting Tables ✅
- ✅ abuse_reports
- ✅ user_strikes

### Check 3: RLS Policies ✅
- ✅ conversations: 3 policies
- ✅ conversation_participants: 2 policies
- ✅ messages: 4 policies
- ✅ message_attachments: 3 policies
- ✅ abuse_reports: 3 policies
- ✅ user_strikes: 2 policies

### Check 4: Storage Bucket ✅
- ✅ Bucket exists: message-attachments
- ✅ Privacy: Private
- ✅ Size limit: 10.0 MB
- ✅ Allowed types: 6 MIME types

### Check 5: Storage RLS Policies ✅
- ✅ Upload policy (INSERT)
- ✅ Read policy (SELECT)
- ✅ Delete policy (DELETE)

### Check 6: Realtime Configuration ✅
- ✅ All 4 chat tables in supabase_realtime publication

### Check 7: Replica Identity ✅
- ✅ All tables set to FULL

### Check 8: Database Statistics 📊
- 📈 Conversations: 1 (test data exists)
- 📈 Messages: 1 (test data exists)
- 📈 Attachments: 0
- 📈 Abuse Reports: 0

---

## Scripts Created

All setup scripts are located in `scripts/`:

1. **`apply-abuse-reports-migration.mjs`**
   - Applies the abuse_reports migration
   - Verifies tables and policies
   - Reusable for future migrations

2. **`setup-storage-bucket.mjs`**
   - Creates message-attachments bucket
   - Configures storage RLS policies
   - Idempotent (safe to run multiple times)

3. **`enable-realtime.mjs`**
   - Enables Realtime for chat tables
   - Sets replica identity to FULL
   - Handles existing publications

4. **`verify-chat-setup.mjs`**
   - Comprehensive verification of all setup
   - Checks tables, policies, storage, Realtime
   - Provides actionable next steps

---

## Next Steps: Testing the Chat System

### 1. Start Development Server
```bash
npm run dev
```

### 2. Navigate to Chat
```
http://localhost:3000/en/chat
```

### 3. Create Test Conversation (SQL)

Run this in Supabase SQL Editor:

```sql
-- Get your user ID first
SELECT id, email FROM auth.users LIMIT 5;

-- Create a test conversation
INSERT INTO conversations (subject, created_by)
VALUES ('Test Chat', '<your-user-id>')
RETURNING id;

-- Add participants (copy conversation ID from above)
INSERT INTO conversation_participants (conversation_id, profile_id)
VALUES
  ('<conversation-id>', '<user1-id>'),
  ('<conversation-id>', '<user2-id>');
```

### 4. Test Features

#### A. Send Messages
- ✅ Type a message and press Enter
- ✅ Message should appear instantly
- ✅ Check for single checkmark (✓)

#### B. Test Real-time
- ✅ Open same conversation in another browser/tab
- ✅ Send message from Tab 1
- ✅ Should appear in Tab 2 within 1 second

#### C. Test File Uploads
- ✅ Click paperclip icon
- ✅ Upload an image (JPG/PNG) < 10 MB
- ✅ Image should display inline
- ✅ Upload a PDF
- ✅ PDF should show as download link

#### D. Test Read Receipts
- ✅ Send message from Tab 1 (sender)
- ✅ Should show ✓ (sent)
- ✅ Open Tab 2 (receiver)
- ✅ Tab 1 should update to ✓✓ (read)

#### E. Test Rate Limiting
- ✅ Send 10 messages quickly
- ✅ 11th message should show error
- ✅ Error should display reset time

#### F. Test Search
- ✅ Type in search box
- ✅ Conversations should filter in real-time

---

## Troubleshooting

### Issue: Messages not appearing in real-time

**Check:**
1. Verify Realtime is enabled:
   ```bash
   node scripts/verify-chat-setup.mjs
   ```
2. Check browser console for WebSocket errors
3. Verify user is authenticated
4. Check RLS policies allow user to read messages

### Issue: File uploads failing

**Check:**
1. Verify bucket exists:
   ```sql
   SELECT * FROM storage.buckets WHERE name = 'message-attachments';
   ```
2. Check file size < 10 MB
3. Verify file type is in allowed list
4. Check storage policies:
   ```sql
   SELECT * FROM pg_policies
   WHERE schemaname = 'storage'
   AND tablename = 'objects';
   ```

### Issue: Rate limit not working

**Check:**
1. Verify messages table has proper timestamps
2. Check system clock is accurate
3. Review `checkMessageRateLimit` function in `lib/chat/queries.ts`

---

## Configuration Summary

### Database
- **Host:** db.vhqzmunorymtoisijiqb.supabase.co
- **Port:** 5432
- **Database:** postgres
- **Tables:** 6 chat tables + 2 abuse reporting tables

### Storage
- **Bucket:** message-attachments
- **Privacy:** Private
- **Max Size:** 10 MB
- **Types:** 6 MIME types

### Realtime
- **Publication:** supabase_realtime
- **Tables:** 4 chat tables
- **Replica Identity:** FULL

### Security
- **RLS:** Enabled on all tables
- **Policies:** 17 total policies
- **Storage Policies:** 3 policies
- **Auth:** Supabase Auth (JWT)

---

## Performance Notes

### Current Implementation
- **Rate Limiting:** Database query (60-second window)
- **Search:** Client-side filtering
- **Pagination:** Load all conversations
- **Realtime:** WebSocket subscriptions

### Expected Performance
- **Message Delivery:** < 1 second
- **File Upload:** < 5 seconds (for 10 MB)
- **Rate Limit Check:** < 100ms
- **Realtime Connection:** 99%+ uptime

---

## Production Checklist

Before deploying to production:

- [x] Apply all migrations ✅
- [x] Create storage bucket ✅
- [x] Configure storage RLS ✅
- [x] Enable Realtime ✅
- [ ] Test with multiple users
- [ ] Load test (100+ concurrent users)
- [ ] Set up monitoring (Sentry, Vercel Analytics)
- [ ] Configure email notifications for abuse reports
- [ ] Add Slack alerts for moderation queue
- [ ] Test file uploads with max size (10 MB)
- [ ] Test rate limiting with automated script
- [ ] Verify GDPR compliance
- [ ] Review audit logs
- [ ] Set up automated backups

---

## Support Resources

**Documentation:**
- [CHAT_SETUP.md](./CHAT_SETUP.md) - Detailed setup guide
- [CHAT_IMPLEMENTATION_SUMMARY.md](./CHAT_IMPLEMENTATION_SUMMARY.md) - Implementation details

**Scripts:**
- `scripts/apply-abuse-reports-migration.mjs` - Apply migrations
- `scripts/setup-storage-bucket.mjs` - Storage setup
- `scripts/enable-realtime.mjs` - Realtime setup
- `scripts/verify-chat-setup.mjs` - Verification

**Supabase Dashboard:**
- Database: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/database/tables
- Storage: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/storage/buckets
- Realtime: https://supabase.com/dashboard/project/vhqzmunorymtoisijiqb/database/replication

---

## ✅ Setup Status: COMPLETE

All Supabase configuration for the Guide Validator chat system is complete and verified.

**Ready to test!** 🚀

Start the dev server and navigate to http://localhost:3000/en/chat
