"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { searchUsersForChat, findOrCreateDirectConversation } from "@/lib/chat/queries";

type NewConversationModalProps = {
  locale: string;
  onClose: () => void;
};

type UserResult = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string;
};

export function NewConversationModal({ locale, onClose }: NewConversationModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  // Search users with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchUsersForChat(supabase, searchQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, supabase]);

  const handleSelectUser = async (userId: string) => {
    setIsCreating(true);

    try {
      // Find or create conversation
      const conversation = await findOrCreateDirectConversation(supabase, userId);

      // Navigate to conversation
      router.push(`/${locale}/chat/${conversation.id}`);
      onClose();
    } catch (error) {
      console.error("Failed to create conversation:", error);
      alert("Failed to start conversation. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, string> = {
      guide: "text-green-700 bg-green-100",
      agency: "text-blue-700 bg-blue-100",
      dmc: "text-purple-700 bg-purple-100",
      transport: "text-orange-700 bg-orange-100",
      admin: "text-red-700 bg-red-100",
      super_admin: "text-red-900 bg-red-200",
    };
    return colors[role] || "text-gray-700 bg-gray-100";
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      guide: "Guide",
      agency: "Agency",
      dmc: "DMC",
      transport: "Transport",
      admin: "Admin",
      super_admin: "Super Admin",
    };
    return labels[role] || role;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">New Message</h2>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="text-foreground/60 hover:text-foreground disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {/* Search input */}
        <div className="mb-4">
          <label className="mb-2 block text-sm font-medium text-foreground">
            Search for a user
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type name or email..."
            autoFocus
            className="w-full rounded-lg border border-foreground/10 bg-background px-4 py-2 text-foreground placeholder:text-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        {/* Search results */}
        <div className="max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="py-8 text-center text-sm text-foreground/60">
              Searching...
            </div>
          ) : searchResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-foreground/60">
              {searchQuery.trim() ? "No users found" : "Start typing to search"}
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((user) => (
                <button
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  disabled={isCreating}
                  className="flex w-full items-center gap-3 rounded-lg border border-foreground/10 p-3 text-left transition hover:bg-background disabled:opacity-50"
                >
                  {/* Avatar */}
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <span className="text-sm font-semibold">
                      {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>

                  {/* User info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate font-semibold text-foreground">
                        {user.full_name || "Unknown"}
                      </p>
                      <span
                        className={`flex-shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${getRoleColor(
                          user.role
                        )}`}
                      >
                        {getRoleLabel(user.role)}
                      </span>
                    </div>
                    <p className="truncate text-sm text-foreground/60">{user.id}</p>
                  </div>

                  {/* Arrow */}
                  <div className="flex-shrink-0 text-foreground/40">→</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isCreating}
            className="rounded-lg border border-foreground/10 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
