"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ContactRevealModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetProfileId: string;
  targetProfileName: string;
  revealType: "email" | "phone" | "website" | "full_contact";
  onReveal: () => void;
};

export function ContactRevealModal({
  isOpen,
  onClose,
  targetProfileId,
  targetProfileName,
  revealType,
  onReveal,
}: ContactRevealModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    if (isOpen) {
      loadRemainingReveals();
      setStep(1);
      setError(null);
    }
  }, [isOpen]);

  const loadRemainingReveals = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.rpc("get_remaining_contact_reveals", {
        user_id: user.id,
      });

      if (error) throw error;
      setRemaining(data);
    } catch (err) {
      console.error("Error loading remaining reveals:", err);
    }
  };

  const handleContinue = () => {
    setStep(2);
  };

  const handleConfirm = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Check rate limit
      const { data: canReveal, error: rateLimitError } = await supabase.rpc(
        "check_contact_reveal_rate_limit",
        { user_id: user.id }
      );

      if (rateLimitError) throw rateLimitError;

      if (!canReveal) {
        throw new Error(
          "You have reached your daily limit for contact reveals. Please try again tomorrow."
        );
      }

      // Get IP and user agent
      const ipResponse = await fetch("https://api.ipify.org?format=json");
      const { ip } = await ipResponse.json();
      const userAgent = navigator.userAgent;

      // Log the reveal
      const { error: insertError } = await supabase
        .from("contact_reveals")
        .insert({
          requester_id: user.id,
          target_profile_id: targetProfileId,
          reveal_type: revealType,
          ip_address: ip,
          user_agent: userAgent,
          revealed_at: new Date().toISOString(),
        });

      if (insertError) throw insertError;

      // Call the reveal callback
      onReveal();
      onClose();
    } catch (err: any) {
      console.error("Error revealing contact:", err);
      setError(err.message || "Failed to reveal contact information");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const revealTypeLabel = {
    email: "email address",
    phone: "phone number",
    website: "website URL",
    full_contact: "full contact information",
  }[revealType];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-foreground/40 hover:text-foreground transition"
          aria-label="Close"
        >
          ✕
        </button>

        {step === 1 ? (
          <>
            {/* Step 1: Warning & Information */}
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <span className="text-2xl">⚠️</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Contact Information Request
              </h2>
              <p className="text-sm text-foreground/70">
                You are about to reveal {revealTypeLabel} for{" "}
                <strong>{targetProfileName}</strong>.
              </p>
            </div>

            <div className="mb-6 space-y-3 rounded-lg bg-blue-50 p-4 text-sm">
              <p className="font-semibold text-blue-900">Please note:</p>
              <ul className="list-inside list-disc space-y-1 text-blue-800">
                <li>This action will be logged for security purposes</li>
                <li>
                  You have {remaining !== null ? remaining : "..."} reveal
                  {remaining !== 1 ? "s" : ""} remaining today
                </li>
                <li>Contact information should only be used for legitimate business inquiries</li>
                <li>Misuse may result in account suspension</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-full border border-foreground/20 px-4 py-2 font-medium text-foreground transition hover:bg-foreground/5"
              >
                Cancel
              </button>
              <button
                onClick={handleContinue}
                disabled={remaining === 0}
                className="flex-1 rounded-full bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue
              </button>
            </div>

            {remaining === 0 && (
              <p className="mt-3 text-center text-sm text-red-600">
                You have reached your daily limit. Please try again tomorrow.
              </p>
            )}
          </>
        ) : (
          <>
            {/* Step 2: Final Confirmation */}
            <div className="mb-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <span className="text-2xl">🔓</span>
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Confirm Access
              </h2>
              <p className="text-sm text-foreground/70">
                Are you sure you want to reveal {revealTypeLabel}?
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="mb-6 rounded-lg border border-foreground/10 bg-foreground/5 p-4">
              <p className="text-sm text-foreground/80">
                By confirming, you agree that:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-foreground/70">
                <li>You will use this information responsibly</li>
                <li>This action is permanent and logged</li>
                <li>You may be contacted for verification</li>
              </ul>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                disabled={isLoading}
                className="flex-1 rounded-full border border-foreground/20 px-4 py-2 font-medium text-foreground transition hover:bg-foreground/5 disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirm}
                disabled={isLoading}
                className="flex-1 rounded-full bg-primary px-4 py-2 font-semibold text-white transition hover:bg-primary/90 disabled:opacity-50"
              >
                {isLoading ? "Processing..." : "Confirm & Reveal"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
