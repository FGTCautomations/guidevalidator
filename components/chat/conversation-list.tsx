"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConversationWithDetails } from "@/lib/chat/types";
import { NewConversationModal } from "./new-conversation-modal";
import clsx from "clsx";

type ConversationListProps = {
  conversations: ConversationWithDetails[];
  currentUserId: string;
  locale: string;
  onSearch?: (query: string) => void;
};

export function ConversationList({
  conversations,
  currentUserId,
  locale,
  onSearch,
}: ConversationListProps) {
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewMessageModal, setShowNewMessageModal] = useState(false);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  const getOtherParticipants = (conv: ConversationWithDetails) => {
    return conv.participants.filter((p) => p.profile_id !== currentUserId);
  };

  const getConversationTitle = (conv: ConversationWithDetails) => {
    if (conv.subject) return conv.subject;
    const others = getOtherParticipants(conv);
    if (others.length === 0) return "You";
    if (others.length === 1)
      return others[0].profile?.full_name || "Unknown";
    return `${others[0].profile?.full_name || "Unknown"} +${others.length - 1}`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 24) {
      return date.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (hours < 168) {
      // Less than a week
      return date.toLocaleDateString(locale, { weekday: "short" });
    } else {
      return date.toLocaleDateString(locale, {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <div className="flex h-full flex-col border-r border-foreground/10 bg-white">
      {/* Search bar */}
      <div className="border-b border-foreground/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-foreground">Messages</h2>
          <button
            onClick={() => setShowNewMessageModal(true)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary/90"
            title="New message"
          >
            <span className="text-lg">✏️</span>
          </button>
        </div>
        <div className="mt-3">
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-foreground/60">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => {
            const isActive = pathname.includes(conv.id);
            const title = getConversationTitle(conv);
            const lastMessage = conv.last_message;
            const hasUnread = (conv.unread_count || 0) > 0;

            return (
              <Link
                key={conv.id}
                href={`/${locale}/chat/${conv.id}`}
                className={clsx(
                  "flex items-start gap-3 border-b border-foreground/5 p-4 transition hover:bg-background",
                  isActive && "bg-primary/5 border-l-4 border-l-primary"
                )}
              >
                {/* Avatar */}
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="text-sm font-semibold">
                    {title.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <h3
                      className={clsx(
                        "truncate text-sm font-semibold",
                        hasUnread ? "text-foreground" : "text-foreground/80"
                      )}
                    >
                      {title}
                    </h3>
                    {lastMessage && (
                      <span className="flex-shrink-0 text-xs text-foreground/50">
                        {formatTimestamp(lastMessage.created_at)}
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <p
                      className={clsx(
                        "truncate text-sm",
                        hasUnread
                          ? "font-medium text-foreground"
                          : "text-foreground/60"
                      )}
                    >
                      {lastMessage?.body || "No messages yet"}
                    </p>
                    {hasUnread && (
                      <span className="flex-shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-white">
                        {conv.unread_count}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* New Message Modal */}
      {showNewMessageModal && (
        <NewConversationModal
          locale={locale}
          onClose={() => setShowNewMessageModal(false)}
        />
      )}
    </div>
  );
}
