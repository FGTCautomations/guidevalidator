"use client";

import { useState } from "react";

type ReportAbuseModalProps = {
  conversationId: string;
  messageId?: string;
  reportedUserId: string;
  onClose: () => void;
  onSubmit: (reason: string, details: string) => Promise<void>;
};

const ABUSE_REASONS = [
  { value: "spam", label: "Spam or unwanted messages" },
  { value: "harassment", label: "Harassment or bullying" },
  { value: "inappropriate", label: "Inappropriate content" },
  { value: "scam", label: "Scam or fraud" },
  { value: "impersonation", label: "Impersonation" },
  { value: "other", label: "Other" },
];

export function ReportAbuseModal({
  conversationId,
  messageId,
  reportedUserId,
  onClose,
  onSubmit,
}: ReportAbuseModalProps) {
  const [selectedReason, setSelectedReason] = useState("");
  const [details, setDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await onSubmit(selectedReason, details);
      onClose();
    } catch (error) {
      console.error("Failed to submit report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">Report Abuse</h2>
          <button
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <p className="mb-4 text-sm text-foreground/70">
          Help us keep Guide Validator safe. Your report will be reviewed by our
          moderation team.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Reason selection */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Reason for report *
            </label>
            <div className="space-y-2">
              {ABUSE_REASONS.map((reason) => (
                <label
                  key={reason.value}
                  className="flex items-center gap-3 rounded-lg border border-foreground/10 p-3 hover:bg-background cursor-pointer"
                >
                  <input
                    type="radio"
                    name="reason"
                    value={reason.value}
                    checked={selectedReason === reason.value}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="h-4 w-4 accent-primary"
                  />
                  <span className="text-sm text-foreground">{reason.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Additional details */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Additional details (optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Provide any additional context that might help our review..."
              rows={4}
              className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-foreground/10 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason || isSubmitting}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit Report"}
            </button>
          </div>
        </form>

        <p className="mt-4 text-xs text-foreground/60">
          False reports may result in action against your account. All reports are
          confidential.
        </p>
      </div>
    </div>
  );
}
