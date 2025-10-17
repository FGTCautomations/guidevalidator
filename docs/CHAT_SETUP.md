# Chat System Setup Guide

## Overview

The Guide Validator chat system provides real-time messaging between users with the following features:

- **Real-time messaging** via Supabase Realtime
- **File attachments** (images, PDFs, documents)
- **Read receipts** tracking
- **Rate limiting** (10 messages per minute)
- **Abuse reporting** with moderation queue
- **Search conversations** by participant or subject

## Database Setup

### 1. Apply Migrations

Run the following migrations in order:

```bash
# Core chat tables (already applied)
supabase db push supabase/migrations/20250925183000_feature_scaffolds.sql
supabase db push supabase/migrations/20250925191500_rls_extended.sql

# Abuse reporting (new)
supabase db push supabase/migrations/20251001000000_abuse_reports.sql
```

### 2. Create Supabase Storage Bucket

In your Supabase dashboard:

1. Go to **Storage** → **Create a new bucket**
2. Name: `message-attachments`
3. **Public bucket**: No (private)
4. **File size limit**: 10 MB
5. **Allowed MIME types**:
   - `image/jpeg`
   - `image/png`
   - `image/gif`
   - `application/pdf`
   - `application/msword`
   - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`

### 3. Configure Storage Policies

Add the following RLS policies to the `message-attachments` bucket:

```sql
-- Allow authenticated users to upload to their own message folders
CREATE POLICY "Users can upload attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'message-attachments'
  AND (storage.foldername(name))[1] = 'attachments'
);

-- Allow users to read attachments from conversations they're part of
CREATE POLICY "Users can read their conversation attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM message_attachments ma
    INNER JOIN messages m ON m.id = ma.message_id
    INNER JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE ma.storage_path = name
    AND cp.profile_id = auth.uid()
  )
);

-- Allow users to delete their own attachments
CREATE POLICY "Users can delete their own attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'message-attachments'
  AND EXISTS (
    SELECT 1 FROM message_attachments ma
    INNER JOIN messages m ON m.id = ma.message_id
    WHERE ma.storage_path = name
    AND m.sender_id = auth.uid()
  )
);
```

## Enable Realtime

### 1. Enable Realtime for Tables

In Supabase Dashboard → **Database** → **Replication**:

Enable replication for:
- `conversations`
- `messages`
- `message_attachments`
- `conversation_participants`

### 2. Configure Realtime Security

Realtime subscriptions automatically respect RLS policies. No additional configuration needed.

## Testing

### 1. Create Test Conversations

```sql
-- As a guide user
INSERT INTO conversations (subject, created_by)
VALUES ('Test Conversation', '<guide-user-id>')
RETURNING *;

-- Add participants (guide + agency)
INSERT INTO conversation_participants (conversation_id, profile_id)
VALUES
  ('<conversation-id>', '<guide-user-id>'),
  ('<conversation-id>', '<agency-user-id>');
```

### 2. Send Test Messages

Navigate to:
```
http://localhost:3000/en/chat/<conversation-id>
```

Features to test:
- ✅ Send text messages
- ✅ Upload image attachments
- ✅ Upload PDF attachments
- ✅ Real-time message delivery
- ✅ Read receipts (double checkmark)
- ✅ Rate limiting (try sending 11 messages in 1 minute)
- ✅ Search conversations
- ✅ Report abuse

### 3. Test Rate Limiting

Send 10 messages quickly. The 11th should show an error:
```
Rate limit exceeded. You can send 0 more messages. Try again after XX:XX.
```

### 4. Test Abuse Reporting

1. Click on a message or conversation
2. Click "Report Abuse" (you'll need to add this button to the UI)
3. Select a reason
4. Submit report
5. Check `abuse_reports` table

## Rate Limiting

The system enforces:
- **10 messages per minute per user**
- Tracked via database query (counts messages in last 60 seconds)
- Returns remaining count and reset time

To adjust limits, edit `lib/chat/queries.ts`:

```typescript
const limit = 10; // Change this value
```

## Abuse Reporting Workflow

### User Flow
1. User clicks "Report" on a message or conversation
2. Selects reason (spam, harassment, inappropriate, scam, impersonation, other)
3. Optionally adds details
4. Submits report

### Admin Flow
1. Admin views moderation queue at `/admin/moderation`
2. Reviews report details, conversation history
3. Takes action:
   - **Dismiss**: No violation found
   - **Issue warning**: Send warning to reported user
   - **Issue strike**: Add strike to user record
   - **Suspend user**: Temporary account suspension
   - **Ban user**: Permanent account ban

### Strikes System

Users accumulate strikes for violations:
- **Minor** (1 strike): Warning, expires in 30 days
- **Moderate** (2 strikes): 7-day suspension, expires in 90 days
- **Severe** (3 strikes): Permanent ban

Strikes tracked in `user_strikes` table.

## File Attachments

### Allowed File Types
- Images: `.jpg`, `.jpeg`, `.png`, `.gif`
- Documents: `.pdf`, `.doc`, `.docx`

### Size Limits
- Max file size: **10 MB** per file
- Max attachments per message: **5 files**

### Security
- Files stored in private bucket
- Signed URLs expire after 1 hour
- Access controlled via RLS policies
- Future: Add antivirus scanning (ClamAV)

## Future Enhancements

### Phase 1 (Current) ✅
- [x] Real-time messaging
- [x] File attachments
- [x] Read receipts
- [x] Rate limiting
- [x] Abuse reporting

### Phase 2 (Next)
- [ ] Message reactions (👍❤️😂)
- [ ] Edit/delete messages
- [ ] Message threading/replies
- [ ] @mentions
- [ ] Typing indicators
- [ ] Voice messages
- [ ] Video messages

### Phase 3 (Future)
- [ ] End-to-end encryption
- [ ] Message search
- [ ] Pin messages
- [ ] Message forwarding
- [ ] Scheduled messages
- [ ] Chat bots/automation

## Troubleshooting

### Messages not appearing in real-time

1. Check Supabase Realtime is enabled for `messages` table
2. Verify user is authenticated
3. Check browser console for WebSocket errors
4. Ensure RLS policies allow user to read messages

### File uploads failing

1. Verify `message-attachments` bucket exists
2. Check storage policies are configured
3. Verify file size < 10 MB
4. Check file type is in allowed list
5. Review browser console for errors

### Rate limit not working

1. Verify `checkMessageRateLimit` is called before sending
2. Check system clock is accurate
3. Review `messages` table has proper timestamps

### Abuse reports not saving

1. Run migration: `20251001000000_abuse_reports.sql`
2. Verify `abuse_reports` table exists
3. Check RLS policies allow user to insert
4. Review API route `/api/chat/report-abuse` logs

## API Reference

### GET `/api/attachments/[attachmentId]`

Get a signed URL for a message attachment.

**Authentication**: Required
**Authorization**: Must be conversation participant

**Response**: Redirects to signed URL

### POST `/api/chat/report-abuse`

Submit an abuse report.

**Authentication**: Required
**Authorization**: Must be conversation participant

**Request Body**:
```json
{
  "conversation_id": "uuid",
  "message_id": "uuid",
  "reported_user_id": "uuid",
  "reason": "spam|harassment|inappropriate|scam|impersonation|other",
  "details": "optional description"
}
```

**Response**:
```json
{
  "success": true,
  "report_id": "uuid",
  "message": "Report submitted successfully..."
}
```

## Production Checklist

Before deploying chat to production:

- [ ] Apply all migrations to production database
- [ ] Create `message-attachments` storage bucket
- [ ] Configure storage RLS policies
- [ ] Enable Realtime for chat tables
- [ ] Set up admin moderation queue
- [ ] Configure email notifications for abuse reports
- [ ] Set up monitoring for rate limit violations
- [ ] Test with multiple users across different roles
- [ ] Load test with 100+ concurrent users
- [ ] Add antivirus scanning for file uploads
- [ ] Set up automated backups for messages
- [ ] Configure content moderation AI (optional)
- [ ] Add Slack/email alerts for high-priority reports
