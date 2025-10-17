"use client";

import { useState, useEffect } from "react";
import { ContactRevealModal } from "./contact-reveal-modal";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ProtectedContactProps = {
  targetProfileId: string;
  targetProfileName: string;
  contactType: "email" | "phone" | "website";
  contactValue: string;
  className?: string;
};

export function ProtectedContact({
  targetProfileId,
  targetProfileName,
  contactType,
  contactValue,
  className = "",
}: ProtectedContactProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    checkIfAlreadyRevealed();
  }, [targetProfileId, contactType]);

  // Disable right-click
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    return false;
  };

  // Disable copy
  const handleCopy = (e: React.ClipboardEvent) => {
    if (!isRevealed) {
      e.preventDefault();
      return false;
    }
  };

  const checkIfAlreadyRevealed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      // Check if user has already revealed this contact
      const { data, error } = await supabase
        .from("contact_reveals")
        .select("id")
        .eq("requester_id", user.id)
        .eq("target_profile_id", targetProfileId)
        .in("reveal_type", [contactType, "full_contact"])
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      setIsRevealed(!!data);
    } catch (error) {
      console.error("Error checking reveal status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReveal = () => {
    setIsRevealed(true);
    setIsModalOpen(false);
  };

  const handleClick = () => {
    if (!isRevealed && !isLoading) {
      setIsModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className={`contact-loading ${className}`}>
        <span className="text-foreground/40">Loading...</span>
      </div>
    );
  }

  return (
    <>
      <div
        className={`relative ${className}`}
        onContextMenu={handleContextMenu}
        onCopy={handleCopy}
      >
        {!isRevealed ? (
          <button
            onClick={handleClick}
            className="contact-blur relative inline-block rounded-lg bg-foreground/5 px-4 py-2 font-mono text-sm transition hover:bg-foreground/10"
            aria-label={`Click to reveal ${contactType}`}
          >
            <span className="select-none">
              {contactType === "email" && "••••••@••••.com"}
              {contactType === "phone" && "+•• ••• ••• ••••"}
              {contactType === "website" && "https://••••••.com"}
            </span>
          </button>
        ) : (
          <div className="contact-protected print-hidden">
            <a
              href={
                contactType === "email"
                  ? `mailto:${contactValue}`
                  : contactType === "phone"
                  ? `tel:${contactValue}`
                  : contactValue
              }
              target={contactType === "website" ? "_blank" : undefined}
              rel={contactType === "website" ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 font-mono text-sm text-primary transition hover:bg-primary/20"
              onContextMenu={handleContextMenu}
            >
              <span className="select-none">
                {contactType === "email" && "📧"}
                {contactType === "phone" && "📱"}
                {contactType === "website" && "🌐"}
              </span>
              <span>{contactValue}</span>
            </a>
            <div className="mt-1 flex items-center gap-1 text-xs text-foreground/60">
              <span className="security-badge">Protected</span>
              <span>This contact is logged and monitored</span>
            </div>
          </div>
        )}

        {/* Print protection message */}
        <div className="print-warning hidden">
          <p>
            📄 Contact information has been hidden for security purposes.
            <br />
            Please visit the website to access contact details.
          </p>
        </div>
      </div>

      <ContactRevealModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetProfileId={targetProfileId}
        targetProfileName={targetProfileName}
        revealType={contactType}
        onReveal={handleReveal}
      />
    </>
  );
}
