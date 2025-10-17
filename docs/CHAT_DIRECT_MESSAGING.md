# Direct Messaging Between Users

## Overview

Users can now start 1:1 conversations with each other from anywhere in the app. The system automatically finds existing conversations or creates new ones.

---

## Features Added

### 1. Start Conversation from Profile Pages ✅

**What it does:**
- Adds a "Message [Name]" button to user profile pages
- Clicking the button finds or creates a 1:1 conversation
- Automatically redirects to the conversation

**Where it appears:**
- Guide profiles: `/[locale]/profiles/guide/[id]`
- Agency profiles: `/[locale]/profiles/agency/[id]`
- DMC profiles: `/[locale]/profiles/dmc/[id]`
- Transport profiles: `/[locale]/profiles/transport/[id]`

**Example usage:**
```tsx
import { MessageUserButton } from "@/components/chat/message-user-button";

<MessageUserButton
  userId="uuid-of-other-user"
  userName="John Doe"
  locale="en"
  variant="primary"
  size="md"
/>
```

---

### 2. New Message Button in Chat Sidebar ✅

**What it does:**
- Adds a ✏️ button in the chat sidebar header
- Opens a modal to search for users
- Start conversations with anyone in the system

**How to use:**
1. Go to `/[locale]/chat`
2. Click the ✏️ (pencil) button in the top-right
3. Search for a user by name or email
4. Click on a user to start/open conversation

---

### 3. Smart Conversation Matching ✅

**What it does:**
- Checks if a 1:1 conversation already exists between two users
- If exists: Opens the existing conversation
- If not exists: Creates a new conversation automatically

**Benefits:**
- No duplicate conversations between the same two users
- Seamless experience (users don't need to know if conversation exists)
- Maintains conversation history

---

## Components Created

### 1. `MessageUserButton` Component

**File:** `components/chat/message-user-button.tsx`

**Props:**
```typescript
{
  userId: string;          // ID of user to message
  userName?: string;       // Optional display name
  locale: string;          // Current locale (e.g., "en")
  variant?: "primary" | "secondary";  // Button style
  size?: "sm" | "md" | "lg";         // Button size
  className?: string;      // Additional CSS classes
}
```

**Example:**
```tsx
// Primary button (filled)
<MessageUserButton
  userId="abc-123"
  userName="Jane Smith"
  locale="en"
  variant="primary"
  size="md"
/>

// Secondary button (outlined)
<MessageUserButton
  userId="abc-123"
  locale="en"
  variant="secondary"
  size="sm"
  className="ml-auto"
/>
```

---

### 2. `NewConversationModal` Component

**File:** `components/chat/new-conversation-modal.tsx`

**Props:**
```typescript
{
  locale: string;          // Current locale
  onClose: () => void;     // Callback when modal closes
}
```

**Features:**
- Search users by name or email
- Displays user role badges (Guide, Agency, DMC, etc.)
- 300ms debounce on search
- Shows user avatars (first letter of name)

**Example:**
```tsx
const [showModal, setShowModal] = useState(false);

<button onClick={() => setShowModal(true)}>New Message</button>

{showModal && (
  <NewConversationModal
    locale="en"
    onClose={() => setShowModal(false)}
  />
)}
```

---

## New Query Functions

### 1. `findOrCreateDirectConversation`

**File:** `lib/chat/queries.ts`

**Purpose:** Find or create a 1:1 conversation between current user and another user

**Signature:**
```typescript
async function findOrCreateDirectConversation(
  supabase: SupabaseClient,
  otherUserId: string
): Promise<Conversation>
```

**How it works:**
1. Gets current authenticated user
2. Searches for existing conversations where both users are participants
3. Checks if any of those conversations are 1:1 (exactly 2 participants)
4. If found: Returns existing conversation
5. If not found: Creates new conversation with both users

**Example:**
```typescript
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { findOrCreateDirectConversation } from "@/lib/chat/queries";

const supabase = createSupabaseBrowserClient();
const conversation = await findOrCreateDirectConversation(supabase, "other-user-id");
// Navigate to conversation
router.push(`/en/chat/${conversation.id}`);
```

---

### 2. `searchUsersForChat`

**File:** `lib/chat/queries.ts`

**Purpose:** Search for users to start a conversation with

**Signature:**
```typescript
async function searchUsersForChat(
  supabase: SupabaseClient,
  query: string,
  limit?: number
): Promise<User[]>
```

**How it works:**
1. Searches `profiles` table
2. Matches against `full_name` and `email` (case-insensitive)
3. Excludes current user
4. Returns max 10 results (configurable)

**Example:**
```typescript
const users = await searchUsersForChat(supabase, "john", 5);
// Returns: [{ id, email, full_name, avatar_url, role }, ...]
```

---

## User Flow Examples

### Flow 1: Message from Profile Page

```
User visits guide profile
  ↓
Sees "Message John Doe" button
  ↓
Clicks button
  ↓
System checks for existing conversation
  ↓
If exists → Opens existing conversation
If not exists → Creates new conversation
  ↓
Redirects to /en/chat/[conversation-id]
  ↓
User can start chatting immediately
```

### Flow 2: New Message from Chat

```
User is on /en/chat
  ↓
Clicks ✏️ button in sidebar
  ↓
Modal opens with search input
  ↓
User types "jane"
  ↓
System searches profiles (300ms debounce)
  ↓
Shows matching users with roles
  ↓
User clicks "Jane Smith (Agency)"
  ↓
System finds/creates conversation
  ↓
Modal closes, redirects to conversation
  ↓
User can start chatting
```

---

## Integration Examples

### Example 1: Add to Directory Cards

```tsx
// In directory/guides/page.tsx
import { MessageUserButton } from "@/components/chat/message-user-button";

function GuideCard({ guide, locale }) {
  return (
    <div className="card">
      <h3>{guide.name}</h3>
      <p>{guide.bio}</p>

      {/* Add message button */}
      <MessageUserButton
        userId={guide.id}
        userName={guide.name}
        locale={locale}
        variant="secondary"
        size="sm"
      />
    </div>
  );
}
```

### Example 2: Add to Search Results

```tsx
// In search results
{searchResults.map(user => (
  <div key={user.id} className="result">
    <div>
      <h4>{user.name}</h4>
      <p>{user.role}</p>
    </div>
    <MessageUserButton
      userId={user.id}
      locale={locale}
      variant="primary"
      size="sm"
    />
  </div>
))}
```

### Example 3: Custom Button with API

```tsx
// Custom implementation
async function handleStartChat(userId: string) {
  const supabase = createSupabaseBrowserClient();

  try {
    const conversation = await findOrCreateDirectConversation(supabase, userId);
    router.push(`/${locale}/chat/${conversation.id}`);
  } catch (error) {
    console.error("Failed to start chat:", error);
    alert("Could not start conversation");
  }
}

<button onClick={() => handleStartChat(otherUserId)}>
  Start Chat
</button>
```

---

## Security & Privacy

### RLS Policies

All conversation operations respect existing RLS policies:

1. **conversation_participants_select** - Users can only see conversations they're in
2. **conversations_select_participants** - Users can only access their conversations
3. **messages_select** - Users can only read messages in their conversations
4. **messages_insert** - Users can only send messages to their conversations

### Privacy Features

- Users can only search for other users (not themselves)
- Users can only create conversations with one other person at a time
- Users cannot add others to someone else's conversation
- Conversation history is private to participants

---

## Testing

### Test 1: Start New Conversation

1. Go to a guide profile: `/en/profiles/guide/[id]`
2. Click "Message [Name]" button
3. Verify redirect to `/en/chat/[conversation-id]`
4. Send a test message
5. Verify message appears

### Test 2: Existing Conversation

1. Follow Test 1 to create a conversation
2. Navigate away from chat
3. Go back to the same guide profile
4. Click "Message [Name]" button again
5. **Verify:** Opens the SAME conversation (not a new one)
6. **Verify:** Previous messages are visible

### Test 3: New Message Modal

1. Go to `/en/chat`
2. Click ✏️ button
3. Type a user's name in search
4. Click on a user
5. Verify conversation opens/creates
6. Send a message

### Test 4: Search Functionality

1. Open New Message modal
2. Search for "john"
3. Verify results show users with "john" in name or email
4. Verify current user is NOT in results
5. Verify role badges display correctly

---

## Customization

### Change Button Text

Edit `components/chat/message-user-button.tsx`:

```tsx
<span>Message{userName ? ` ${userName}` : ""}</span>
// Change to:
<span>Chat with{userName ? ` ${userName}` : ""}</span>
```

### Change Search Debounce Time

Edit `components/chat/new-conversation-modal.tsx`:

```tsx
const timer = setTimeout(async () => {
  // ... search logic
}, 300); // Change from 300ms to desired value
```

### Change Search Result Limit

Edit `lib/chat/queries.ts`:

```typescript
export async function searchUsersForChat(
  supabase: SupabaseClient,
  query: string,
  limit: number = 10  // Change default from 10 to desired number
)
```

---

## Troubleshooting

### Issue: Button doesn't work

**Check:**
1. User is authenticated
2. `userId` prop is valid
3. Browser console for errors
4. Supabase connection is working

### Issue: Creates duplicate conversations

**Check:**
1. Verify `findOrCreateDirectConversation` is being used
2. Check database for multiple conversations with same 2 users
3. May need to manually clean up duplicates in database

### Issue: Search returns no results

**Check:**
1. Users exist in `profiles` table
2. Users have `full_name` or matching `email`
3. Search query is at least 1 character
4. Check browser console for Supabase errors

### Issue: Profile button shows wrong user

**Check:**
1. `userId` prop matches the profile being viewed
2. Not using current user's ID accidentally
3. Profile data is fetched correctly

---

## Future Enhancements

### Phase 1 (Current) ✅
- [x] Message button on profiles
- [x] New message modal
- [x] Search users
- [x] Find/create conversations

### Phase 2 (Next)
- [ ] "Quick reply" from notifications
- [ ] Message preview on hover
- [ ] Recent conversations in modal
- [ ] Message templates (pre-filled messages)

### Phase 3 (Future)
- [ ] Group conversations (3+ users)
- [ ] "Introduce" feature (connect two users)
- [ ] Message scheduling
- [ ] Auto-replies when away

---

## Files Modified/Created

**New Files:**
- ✅ `components/chat/message-user-button.tsx`
- ✅ `components/chat/new-conversation-modal.tsx`
- ✅ `docs/CHAT_DIRECT_MESSAGING.md` (this file)

**Modified Files:**
- ✅ `lib/chat/queries.ts` - Added `findOrCreateDirectConversation` and `searchUsersForChat`
- ✅ `components/chat/conversation-list.tsx` - Added New Message button and modal
- ✅ `app/[locale]/profiles/guide/[id]/page.tsx` - Added MessageUserButton example

---

## Summary

✅ Users can now message each other directly from:
- Profile pages (guides, agencies, DMCs, transport)
- Chat page (via New Message modal)
- Anywhere else (using the MessageUserButton component)

✅ System intelligently prevents duplicate conversations
✅ Search functionality makes finding users easy
✅ Secure (respects all RLS policies)
✅ Easy to integrate (just add the button component)

**Ready to use!** 🚀
