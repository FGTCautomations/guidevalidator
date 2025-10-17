"use client";

import { useState, useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { format, addDays } from "date-fns";
import type { SupportedLocale } from "@/i18n/config";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetId: string;
  targetName: string;
  targetRole: "guide" | "transport";
  requesterId: string;
  requesterRole: "agency" | "dmc";
  locale: SupportedLocale;
  preselectedStartDate?: Date;
  preselectedEndDate?: Date;
  onSuccess?: () => void;
}

export function RequestHoldModal({
  isOpen,
  onClose,
  targetId,
  targetName,
  targetRole,
  requesterId,
  requesterRole,
  locale,
  preselectedStartDate,
  preselectedEndDate,
  onSuccess,
}: Props) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Set preselected dates when modal opens
  useEffect(() => {
    if (isOpen && preselectedStartDate) {
      const formattedStartDate = format(preselectedStartDate, "yyyy-MM-dd'T'HH:mm");
      setStartDate(formattedStartDate);

      if (preselectedEndDate) {
        // Use preselected end date if provided
        const formattedEndDate = format(preselectedEndDate, "yyyy-MM-dd'T'HH:mm");
        setEndDate(formattedEndDate);
      } else {
        // Default end date to same day at 5 PM
        const formattedEndDate = format(preselectedStartDate, "yyyy-MM-dd'T'17:00");
        setEndDate(formattedEndDate);
      }
    }
  }, [isOpen, preselectedStartDate, preselectedEndDate]);
  const [message, setMessage] = useState("");
  const [jobReference, setJobReference] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createSupabaseBrowserClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!startDate || !endDate) {
      setError("Please select start and end dates");
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end <= start) {
      setError("End date must be after start date");
      return;
    }

    if (start < new Date()) {
      setError("Start date cannot be in the past");
      return;
    }

    setIsLoading(true);

    try {
      // Use API endpoint instead of direct database insert
      const response = await fetch("/api/holds", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          holdeeId: targetId,
          holdeeType: targetRole,
          startDate: format(start, "yyyy-MM-dd"),
          endDate: format(end, "yyyy-MM-dd"),
          requestMessage: message.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create hold request");
      }

      // Success!
      alert(
        `Hold request sent to ${targetName}! They have 48 hours to respond. You will receive an email notification when they respond.`
      );

      // Reset form
      setStartDate("");
      setEndDate("");
      setMessage("");
      setJobReference("");

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error creating hold:", err);
      setError(err.message || "Failed to create hold request");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Request Availability Hold</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        {/* Info */}
        <div className="mb-4 rounded-lg bg-blue-50 p-3 text-sm">
          <p className="font-medium text-blue-900">Requesting hold from:</p>
          <p className="text-blue-800">
            {targetName} ({targetRole})
          </p>
          <p className="mt-2 text-blue-700">
            The {targetRole} will have 48 hours to accept or decline your request. If they don't
            respond, the hold will automatically expire.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Start Date */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              Start Date<span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
              disabled={isLoading}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="mb-1 block text-sm font-medium">
              End Date<span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              min={startDate || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
              className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              required
              disabled={isLoading}
            />
          </div>

          {/* Job Reference */}
          <div>
            <label className="mb-1 block text-sm font-medium">Job Reference (Optional)</label>
            <input
              type="text"
              value={jobReference}
              onChange={(e) => setJobReference(e.target.value)}
              placeholder="e.g., Tour #12345, Event ABC"
              className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isLoading}
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div>
            <label className="mb-1 block text-sm font-medium">Message (Optional)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add any additional details about the booking..."
              rows={4}
              className="w-full rounded border px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
              disabled={isLoading}
              maxLength={500}
            />
            <div className="mt-1 text-xs text-gray-500">{message.length}/500 characters</div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-800">
              <p className="font-medium">Error:</p>
              <p>{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded border px-4 py-2 hover:bg-gray-50"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? "Sending..." : "Send Hold Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
