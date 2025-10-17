"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { findOrCreateDirectConversation } from "@/lib/chat/queries";

type MessageUserButtonProps = {
  userId: string;
  userName?: string;
  locale: string;
  variant?: "primary" | "secondary";
  size?: "sm" | "md" | "lg";
  className?: string;
};

export function MessageUserButton({
  userId,
  userName,
  locale,
  variant = "primary",
  size = "md",
  className = "",
}: MessageUserButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const handleClick = async () => {
    setIsLoading(true);

    try {
      console.log("Starting conversation with user:", userId);

      // Find or create conversation with this user
      const conversation = await findOrCreateDirectConversation(supabase, userId);

      console.log("Conversation created/found:", conversation);

      // Navigate to the conversation
      router.push(`/${locale}/chat/${conversation.id}`);
    } catch (error: any) {
      console.error("Failed to start conversation - Full error:", error);
      console.error("Error message:", error?.message);
      console.error("Error details:", error?.details);
      console.error("Error hint:", error?.hint);

      const errorMessage = error?.message || "Failed to start conversation. Please try again.";
      alert(`Error: ${errorMessage}\n\nCheck console for details.`);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary:
      "bg-primary text-white hover:bg-primary/90 border-primary",
    secondary:
      "bg-white text-primary border-primary hover:bg-primary/5",
  };

  return (
    <button
      onClick={handleClick}
      disabled={isLoading}
      className={`
        inline-flex items-center gap-2 rounded-lg border font-semibold
        transition disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <span className="animate-spin">⏳</span>
          <span>Opening...</span>
        </>
      ) : (
        <>
          <span>💬</span>
          <span>Message{userName ? ` ${userName}` : ""}</span>
        </>
      )}
    </button>
  );
}
