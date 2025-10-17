"use client";

import { useState, useRef, useEffect } from "react";
import { Message, MessageAttachment } from "@/lib/chat/types";
import clsx from "clsx";

type MessageThreadProps = {
  messages: Message[];
  currentUserId: string;
  conversationId: string;
  onSendMessage: (body: string, attachments?: File[]) => Promise<void>;
  onMarkAsRead: () => Promise<void>;
  locale: string;
  isLoading?: boolean;
};

export function MessageThread({
  messages,
  currentUserId,
  conversationId,
  onSendMessage,
  onMarkAsRead,
  locale,
  isLoading = false,
}: MessageThreadProps) {
  const [messageBody, setMessageBody] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark as read when component mounts or conversation changes
  useEffect(() => {
    onMarkAsRead();
  }, [conversationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageBody.trim() && selectedFiles.length === 0) return;
    if (isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(messageBody, selectedFiles);
      setMessageBody("");
      setSelectedFiles([]);
    } catch (error) {
      console.error("Failed to send message:", error);
      alert("Failed to send message. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // Filter for allowed file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const validFiles = files.filter((f) => allowedTypes.includes(f.type));
    setSelectedFiles((prev) => [...prev, ...validFiles]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(locale, {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const renderAttachment = (attachment: MessageAttachment) => {
    const isImage = attachment.content_type?.startsWith("image/");
    return (
      <div
        key={attachment.id}
        className="mt-2 overflow-hidden rounded-lg border border-foreground/10"
      >
        {isImage ? (
          <img
            src={`/api/attachments/${attachment.id}`}
            alt="Attachment"
            className="max-h-64 w-auto"
          />
        ) : (
          <div className="flex items-center gap-3 bg-foreground/5 p-3">
            <div className="flex h-10 w-10 items-center justify-center rounded bg-primary/10 text-primary">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {attachment.storage_path?.split("/").pop() || "File"}
              </p>
              <p className="text-xs text-foreground/60">
                {attachment.size_bytes ? formatFileSize(attachment.size_bytes) : "Unknown size"}
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-foreground/60">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-foreground/60">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((message) => {
            const isOwn = message.sender_id === currentUserId;
            const isRead = (message.metadata?.read_by || []).length > 1;

            return (
              <div
                key={message.id}
                className={clsx(
                  "flex items-end gap-2",
                  isOwn ? "justify-end" : "justify-start"
                )}
              >
                {/* Sender avatar (only for others) */}
                {!isOwn && (
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary text-xs font-semibold">
                    {message.sender?.full_name?.charAt(0) || "?"}
                  </div>
                )}

                {/* Message bubble */}
                <div
                  className={clsx(
                    "max-w-[70%] rounded-2xl px-4 py-2",
                    isOwn
                      ? "bg-primary text-white rounded-br-sm"
                      : "bg-white border border-foreground/10 text-foreground rounded-bl-sm"
                  )}
                >
                  {!isOwn && (
                    <p className="text-xs font-semibold mb-1 text-foreground/80">
                      {message.sender?.full_name || "Unknown"}
                    </p>
                  )}
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {message.body}
                  </p>

                  {/* Attachments */}
                  {message.attachments &&
                    message.attachments.length > 0 &&
                    message.attachments.map(renderAttachment)}

                  {/* Timestamp and read status */}
                  <div
                    className={clsx(
                      "mt-1 flex items-center gap-1 text-xs",
                      isOwn ? "text-white/70" : "text-foreground/60"
                    )}
                  >
                    <span>{formatTimestamp(message.created_at)}</span>
                    {isOwn && (
                      <span className="ml-1">
                        {isRead ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-foreground/10 bg-white p-4">
        {/* Selected files preview */}
        {selectedFiles.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm"
              >
                <span className="truncate max-w-[150px]">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="text-foreground/60 hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-foreground/10 text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition"
            title="Attach file"
          >
            📎
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx"
            className="hidden"
          />

          {/* Message input */}
          <textarea
            value={messageBody}
            onChange={(e) => setMessageBody(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 resize-none rounded-lg border border-foreground/10 bg-background px-4 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />

          {/* Send button */}
          <button
            type="submit"
            disabled={isSending || (!messageBody.trim() && selectedFiles.length === 0)}
            className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Send message"
          >
            {isSending ? "..." : "→"}
          </button>
        </form>

        <p className="mt-2 text-xs text-foreground/50">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
