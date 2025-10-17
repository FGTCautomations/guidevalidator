"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  getConversation,
  getConversationMessages,
  sendMessage,
  markMessagesAsRead,
  checkMessageRateLimit,
} from "@/lib/chat/queries";
import type {
  ConversationWithDetails,
  Message,
  SendMessagePayload,
} from "@/lib/chat/types";
import { MessageThread } from "@/components/chat/message-thread";
import { ConversationList } from "@/components/chat/conversation-list";
import { getUserConversations } from "@/lib/chat/queries";

export default function ConversationPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as string;
  const locale = params.locale as string;

  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [user, setUser] = useState<any>(null);
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push(`/${locale}/auth/sign-in`);
      } else {
        setUser(user);
      }
    });
  }, [supabase, router, locale]);

  // Load conversation and messages
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("[ConversationPage] Loading conversation:", conversationId);
        console.log("[ConversationPage] User ID:", user.id);

        // Load conversation details
        console.log("[ConversationPage] Fetching conversation details...");
        const conv = await getConversation(supabase, conversationId);
        console.log("[ConversationPage] Conversation loaded:", conv);
        setConversation(conv);

        // Load messages
        console.log("[ConversationPage] Fetching messages...");
        const msgs = await getConversationMessages(supabase, conversationId);
        console.log("[ConversationPage] Messages loaded:", msgs.length);
        setMessages(msgs);

        // Load conversations list
        console.log("[ConversationPage] Fetching conversations list...");
        const convs = await getUserConversations(supabase, user.id);
        console.log("[ConversationPage] Conversations list loaded:", convs.length);
        setConversations(convs);

        // Mark as read
        console.log("[ConversationPage] Marking messages as read...");
        await markMessagesAsRead(supabase, conversationId, user.id);
        console.log("[ConversationPage] All data loaded successfully");
      } catch (err: any) {
        console.error("[ConversationPage] Failed to load conversation:", err);
        console.error("[ConversationPage] Error details:", {
          message: err?.message,
          code: err?.code,
          details: err?.details,
          hint: err?.hint
        });
        setError(`Failed to load conversation: ${err?.message || 'Unknown error'}. Check console for details.`);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [conversationId, user, supabase]);

  // Subscribe to new messages via Realtime
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`conversation:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log("New message received:", payload);

          // Fetch full message with sender details
          const { data: newMessage } = await supabase
            .from("messages")
            .select(
              `
              *,
              sender:profiles!sender_id (
                id,
                email,
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
            .eq("id", payload.new.id)
            .single();

          if (newMessage) {
            setMessages((prev) => [...prev, newMessage as Message]);

            // Mark as read if not sent by current user
            if (newMessage.sender_id !== user.id) {
              await markMessagesAsRead(supabase, conversationId, user.id);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user, supabase]);

  const handleSendMessage = async (body: string, attachments?: File[]) => {
    if (!user) return;

    // Check rate limit
    const rateLimit = await checkMessageRateLimit(supabase, user.id);
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetAt.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });
      throw new Error(
        `Rate limit exceeded. You can send ${rateLimit.remaining} more messages. Try again after ${resetTime}.`
      );
    }

    const payload: SendMessagePayload = {
      conversation_id: conversationId,
      body,
      attachments,
    };

    await sendMessage(supabase, payload);
    // Message will be added via Realtime subscription
  };

  const handleMarkAsRead = async () => {
    if (!user) return;
    await markMessagesAsRead(supabase, conversationId, user.id);
  };

  const handleSearch = async (query: string) => {
    if (!user) return;
    if (!query.trim()) {
      const convs = await getUserConversations(supabase, user.id);
      setConversations(convs);
    } else {
      const filtered = conversations.filter((conv) => {
        const subjectMatch =
          conv.subject?.toLowerCase().includes(query.toLowerCase()) || false;
        const participantMatch = conv.participants.some((p) =>
          p.profile?.full_name?.toLowerCase().includes(query.toLowerCase())
        );
        return subjectMatch || participantMatch;
      });
      setConversations(filtered);
    }
  };

  const getOtherParticipants = () => {
    if (!conversation || !user || !conversation.participants) return [];
    return conversation.participants.filter((p) => p.profile_id !== user.id);
  };

  const getConversationTitle = () => {
    if (!conversation) return "Loading...";
    if (conversation.subject) return conversation.subject;
    const others = getOtherParticipants();
    if (others.length === 0) return "You";
    if (others.length === 1)
      return others[0].profile?.full_name || "Unknown";
    return `${others[0].profile?.full_name || "Unknown"} +${others.length - 1}`;
  };

  if (!user) {
    return (
      <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
        <p className="text-foreground/60">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-background">
      {/* Conversations sidebar */}
      <div className="w-80 flex-shrink-0">
        <ConversationList
          conversations={conversations}
          currentUserId={user.id}
          locale={locale}
          onSearch={handleSearch}
        />
      </div>

      {/* Messages area */}
      <div className="flex flex-1 flex-col">
        {/* Conversation header */}
        <div className="border-b border-foreground/10 bg-white px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {getConversationTitle()}
              </h2>
              {conversation && (
                <p className="text-sm text-foreground/60">
                  {conversation.participants.length} participant
                  {conversation.participants.length !== 1 ? "s" : ""}
                </p>
              )}
            </div>
            {/* Future: Add more actions (info, search, etc.) */}
          </div>
        </div>

        {/* Message thread */}
        {error ? (
          <div className="flex flex-1 items-center justify-center text-red-600">
            {error}
          </div>
        ) : (
          <MessageThread
            messages={messages}
            currentUserId={user.id}
            conversationId={conversationId}
            onSendMessage={handleSendMessage}
            onMarkAsRead={handleMarkAsRead}
            locale={locale}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}
