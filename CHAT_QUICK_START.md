# 🚀 Chat System - Quick Start Guide

## ✅ Setup Complete!

All Supabase infrastructure is configured and ready to use.

---

## 🎯 Access the Chat

**Development URL:**
```
http://localhost:3000/en/chat
```

**Start Server:**
```bash
npm run dev
```

---

## 📝 Create Test Conversation

Run this SQL in **Supabase SQL Editor**:

```sql
-- 1. Get user IDs
SELECT id, email, role FROM profiles LIMIT 5;

-- 2. Create conversation (replace <user-id>)
INSERT INTO conversations (subject, created_by)
VALUES ('My First Chat', '<your-user-id>')
RETURNING id;

-- 3. Add participants (replace IDs)
INSERT INTO conversation_participants (conversation_id, profile_id)
VALUES
  ('<conversation-id>', '<user1-id>'),
  ('<conversation-id>', '<user2-id>');
```

---

## ✨ Features to Test

### 1. Real-time Messaging
- Open chat in 2 browser tabs
- Send message from Tab 1
- Should appear in Tab 2 instantly

### 2. File Attachments
- Click 📎 paperclip icon
- Upload image (JPG, PNG, GIF)
- Upload document (PDF, DOC, DOCX)
- Max size: 10 MB

### 3. Read Receipts
- Send message: ✓ (sent)
- Recipient reads: ✓✓ (read)

### 4. Rate Limiting
- Send 10 messages quickly
- 11th will be blocked for 60 seconds

### 5. Search
- Type in search box
- Filters conversations in real-time

### 6. Abuse Reporting
- Click "Report" (need to add button)
- Select reason
- Submit report

---

## 🔧 Verify Setup

Run verification script:
```bash
node scripts/verify-chat-setup.mjs
```

Should show: **✅ ALL CHECKS PASSED**

---

## 📚 Documentation

**Detailed Guides:**
- [CHAT_SETUP.md](docs/CHAT_SETUP.md) - Full setup instructions
- [CHAT_IMPLEMENTATION_SUMMARY.md](docs/CHAT_IMPLEMENTATION_SUMMARY.md) - Technical details
- [CHAT_SUPABASE_SETUP_COMPLETE.md](docs/CHAT_SUPABASE_SETUP_COMPLETE.md) - Setup verification

**Scripts:**
- `scripts/verify-chat-setup.mjs` - Check setup status
- `scripts/apply-abuse-reports-migration.mjs` - Apply migrations
- `scripts/setup-storage-bucket.mjs` - Configure storage
- `scripts/enable-realtime.mjs` - Enable Realtime

---

## 🐛 Common Issues

### Messages not appearing in real-time
- Check: `node scripts/verify-chat-setup.mjs`
- Verify: Realtime enabled for all tables

### File upload fails
- Check: File size < 10 MB
- Verify: File type allowed (images, PDFs, docs)
- Check: Storage bucket exists

### Rate limit not working
- Check: System clock accurate
- Verify: Messages table timestamps correct

---

## 📊 What's Configured

✅ Database tables (conversations, messages, attachments)
✅ RLS policies (17 total)
✅ Storage bucket (message-attachments, private, 10MB)
✅ Storage policies (upload, read, delete)
✅ Realtime (4 chat tables, FULL replica identity)
✅ Abuse reporting (reports + strikes tables)

---

## 🎯 Next Steps

1. **Test basic chat** - Send messages between users
2. **Test file uploads** - Upload images and PDFs
3. **Test real-time** - Open in multiple tabs
4. **Build admin queue** - For abuse report moderation
5. **Add notifications** - In-app bell icon
6. **Add typing indicators** - Show "typing..." status

---

## 🚀 Production Deployment

Before going live:
- [ ] Test with 10+ real users
- [ ] Load test (100+ concurrent users)
- [ ] Set up monitoring (Sentry)
- [ ] Configure abuse report emails
- [ ] Add admin moderation dashboard
- [ ] Review security policies
- [ ] Enable automated backups

---

**Questions?** Check [docs/CHAT_SETUP.md](docs/CHAT_SETUP.md) for troubleshooting.

**Ready to chat!** 💬
