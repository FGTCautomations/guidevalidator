import { SupabaseClient } from "@supabase/supabase-js";
import type {
  Conversation,
  ConversationWithDetails,
  Message,
  SendMessagePayload,
  CreateConversationPayload,
  MessageAttachment,
} from "./types";

/**
 * Get all conversations for the current user
 */
export async function getUserConversations(
  supabase: SupabaseClient,
  userId: string
): Promise<ConversationWithDetails[]> {
  // First get conversation IDs where user is a participant
  const { data: participantData, error: participantError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", userId);

  if (participantError) throw participantError;
  if (!participantData || participantData.length === 0) return [];

  const conversationIds = participantData.map((p) => p.conversation_id);

  // Get full conversation details with participants and last message
  const { data: conversations, error: conversationError } = await supabase
    .from("conversations")
    .select(
      `
      *,
      conversation_participants!inner (
        profile_id,
        joined_at,
        profile:profiles (
          id,
          full_name,
          avatar_url,
          role
        )
      )
    `
    )
    .in("id", conversationIds)
    .order("updated_at", { ascending: false });

  if (conversationError) throw conversationError;

  // Get last message for each conversation
  const conversationsWithMessages = await Promise.all(
    (conversations || []).map(async (conv) => {
      const { data: lastMessage } = await supabase
        .from("messages")
        .select(
          `
          *,
          sender:profiles!sender_id (
            id,
            full_name,
            avatar_url,
            role
          )
        `
        )
        .eq("conversation_id", conv.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      // Calculate unread count
      const { count: unreadCount } = await supabase
        .from("messages")
        .select("*", { count: "exact", head: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", userId)
        .not("metadata->>read_by", "cs", `{${userId}}`);

      // Map conversation_participants to participants
      const result: any = { ...conv };
      result.participants = result.conversation_participants || [];
      delete result.conversation_participants;

      return {
        ...result,
        last_message: lastMessage || undefined,
        unread_count: unreadCount || 0,
      } as ConversationWithDetails;
    })
  );

  return conversationsWithMessages;
}

/**
 * Get a single conversation with all participants
 */
export async function getConversation(
  supabase: SupabaseClient,
  conversationId: string
): Promise<ConversationWithDetails | null> {
  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      *,
      conversation_participants (
        profile_id,
        joined_at,
        profile:profiles (
          id,
          full_name,
          avatar_url,
          role
        )
      )
    `
    )
    .eq("id", conversationId)
    .single();

  if (error) throw error;

  // Map conversation_participants to participants
  if (data) {
    const result: any = { ...data };
    result.participants = result.conversation_participants || [];
    delete result.conversation_participants;
    return result as ConversationWithDetails;
  }

  return null;
}

/**
 * Get messages for a conversation with pagination
 */
export async function getConversationMessages(
  supabase: SupabaseClient,
  conversationId: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<Message[]> {
  const { limit = 50, offset = 0 } = options;

  const { data, error } = await supabase
    .from("messages")
    .select(
      `
      *,
      sender:profiles!sender_id (
        id,
        full_name,
        avatar_url,
        role
      ),
      attachments:message_attachments (
        id,
        storage_path,
        content_type,
        size_bytes,
        created_at
      )
    `
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return (data || []) as Message[];
}

/**
 * Send a new message in a conversation
 */
export async function sendMessage(
  supabase: SupabaseClient,
  payload: SendMessagePayload
): Promise<Message> {
  const { conversation_id, body, attachments } = payload;

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Insert message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      conversation_id,
      sender_id: user.id,
      body,
      metadata: { read_by: [user.id] },
    })
    .select(
      `
      *,
      sender:profiles!sender_id (
        id,
        full_name,
        avatar_url,
        role
      )
    `
    )
    .single();

  if (messageError) {
    console.error("[sendMessage] Error inserting message:", messageError);
    throw messageError;
  }

  // Handle attachments if any
  if (attachments && attachments.length > 0) {
    const attachmentRecords: Partial<MessageAttachment>[] = [];

    for (const file of attachments) {
      const fileExt = file.name.split(".").pop();
      const filePath = `attachments/${message.id}/${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("message-attachments")
        .upload(filePath, file);

      if (uploadError) {
        console.error("Failed to upload attachment:", uploadError);
        continue;
      }

      attachmentRecords.push({
        message_id: message.id,
        storage_path: filePath,
        content_type: file.type,
        size_bytes: file.size,
      });
    }

    if (attachmentRecords.length > 0) {
      await supabase.from("message_attachments").insert(attachmentRecords);
    }
  }

  // Update conversation updated_at
  await supabase
    .from("conversations")
    .update({ updated_at: new Date().toISOString() })
    .eq("id", conversation_id);

  return message as Message;
}

/**
 * Create a new conversation
 */
export async function createConversation(
  supabase: SupabaseClient,
  payload: CreateConversationPayload
): Promise<Conversation> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  // Create conversation
  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .insert({
      subject: payload.subject || null,
      created_by: user.id,
    })
    .select()
    .single();

  if (convError) throw convError;

  // Add participants (including creator)
  const participantIds = [...new Set([user.id, ...payload.participant_ids])];
  const { error: participantsError } = await supabase
    .from("conversation_participants")
    .insert(
      participantIds.map((pid) => ({
        conversation_id: conversation.id,
        profile_id: pid,
      }))
    );

  if (participantsError) throw participantsError;

  // Send initial message if provided
  if (payload.initial_message) {
    await sendMessage(supabase, {
      conversation_id: conversation.id,
      body: payload.initial_message,
    });
  }

  return conversation as Conversation;
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string
): Promise<void> {
  // Get all unread messages in the conversation
  const { data: messages, error: fetchError } = await supabase
    .from("messages")
    .select("id, metadata")
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId);

  if (fetchError) throw fetchError;

  // Update each message to add userId to read_by array
  const updates = (messages || [])
    .filter((msg) => {
      const readBy = (msg.metadata as any)?.read_by || [];
      return !readBy.includes(userId);
    })
    .map((msg) => {
      const readBy = (msg.metadata as any)?.read_by || [];
      return {
        id: msg.id,
        metadata: {
          ...msg.metadata,
          read_by: [...readBy, userId],
        },
      };
    });

  if (updates.length > 0) {
    const { error: updateError } = await supabase
      .from("messages")
      .upsert(updates);

    if (updateError) throw updateError;
  }
}

/**
 * Get signed URL for attachment
 */
export async function getAttachmentUrl(
  supabase: SupabaseClient,
  storagePath: string
): Promise<string> {
  const { data, error } = await supabase.storage
    .from("message-attachments")
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Search conversations by participant name or subject
 */
export async function searchConversations(
  supabase: SupabaseClient,
  userId: string,
  query: string
): Promise<ConversationWithDetails[]> {
  const conversations = await getUserConversations(supabase, userId);

  return conversations.filter((conv) => {
    const subjectMatch =
      conv.subject?.toLowerCase().includes(query.toLowerCase()) || false;
    const participantMatch = conv.participants.some((p) =>
      p.profile?.full_name?.toLowerCase().includes(query.toLowerCase())
    );
    return subjectMatch || participantMatch;
  });
}

/**
 * Check rate limit for sending messages
 * Returns true if user can send, false if rate limited
 */
export async function checkMessageRateLimit(
  supabase: SupabaseClient,
  userId: string
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();

  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", userId)
    .gte("created_at", oneMinuteAgo);

  if (error) throw error;

  const messageCount = count || 0;
  const limit = 10; // 10 messages per minute
  const allowed = messageCount < limit;
  const remaining = Math.max(0, limit - messageCount);
  const resetAt = new Date(Date.now() + 60 * 1000);

  return { allowed, remaining, resetAt };
}

/**
 * Find or create a 1:1 conversation between two users
 */
export async function findOrCreateDirectConversation(
  supabase: SupabaseClient,
  otherUserId: string
): Promise<Conversation> {
  console.log("[findOrCreateDirectConversation] Starting with otherUserId:", otherUserId);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    console.error("[findOrCreateDirectConversation] User not authenticated");
    throw new Error("User not authenticated");
  }

  console.log("[findOrCreateDirectConversation] Current user:", user.id);

  // Check if a conversation already exists between these two users
  console.log("[findOrCreateDirectConversation] Searching for existing conversations...");
  const { data: existingConversations, error: searchError } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("profile_id", user.id);

  if (searchError) {
    console.error("[findOrCreateDirectConversation] Error searching conversations:", searchError);
    throw searchError;
  }

  console.log("[findOrCreateDirectConversation] Found", existingConversations?.length, "conversations for current user");

  if (existingConversations && existingConversations.length > 0) {
    const conversationIds = existingConversations.map((c) => c.conversation_id);

    // Check which of these conversations also includes the other user
    console.log("[findOrCreateDirectConversation] Checking if other user is in any of these conversations...");
    const { data: otherUserConvs, error: otherUserError } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("profile_id", otherUserId)
      .in("conversation_id", conversationIds);

    if (otherUserError) {
      console.error("[findOrCreateDirectConversation] Error checking other user:", otherUserError);
      throw otherUserError;
    }

    console.log("[findOrCreateDirectConversation] Found", otherUserConvs?.length, "shared conversations");

    if (otherUserConvs && otherUserConvs.length > 0) {
      // Find conversation that is 1:1 (only 2 participants)
      for (const conv of otherUserConvs) {
        const { data: participants, error: participantsError } = await supabase
          .from("conversation_participants")
          .select("profile_id")
          .eq("conversation_id", conv.conversation_id);

        if (participantsError) {
          console.error("[findOrCreateDirectConversation] Error fetching participants:", participantsError);
          throw participantsError;
        }

        console.log("[findOrCreateDirectConversation] Conversation", conv.conversation_id, "has", participants?.length, "participants");

        if (participants && participants.length === 2) {
          // Found existing 1:1 conversation
          console.log("[findOrCreateDirectConversation] Found existing 1:1 conversation:", conv.conversation_id);
          const { data: conversation, error: convError } = await supabase
            .from("conversations")
            .select("*")
            .eq("id", conv.conversation_id)
            .single();

          if (convError) {
            console.error("[findOrCreateDirectConversation] Error fetching conversation:", convError);
            throw convError;
          }

          return conversation as Conversation;
        }
      }
    }
  }

  // No existing 1:1 conversation found, create a new one
  console.log("[findOrCreateDirectConversation] No existing conversation found, creating new one...");
  const newConversation = await createConversation(supabase, {
    participant_ids: [otherUserId],
  });

  console.log("[findOrCreateDirectConversation] Created new conversation:", newConversation.id);
  return newConversation;
}

/**
 * Search for users to start a conversation with
 */
export async function searchUsersForChat(
  supabase: SupabaseClient,
  query: string,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    role: string;
  }>
> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("User not authenticated");

  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role")
    .neq("id", user.id) // Exclude current user
    .ilike("full_name", `%${query}%`)
    .limit(limit);

  if (error) throw error;
  return data || [];
}
