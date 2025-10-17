"use client";

import { useState } from "react";
import { StarRating } from "@/components/ui/star-rating";
import type { SupportedLocale } from "@/i18n/config";

type ReviewModerationQueueProps = {
  pendingReviews: any[];
  reportedReviews: any[];
  locale: SupportedLocale;
  translations: {
    pendingTab: string;
    reportedTab: string;
    noReviews: string;
    reviewer: string;
    reviewee: string;
    rating: string;
    submitted: string;
    actions: string;
    approve: string;
    reject: string;
    approving: string;
    rejecting: string;
    notes: string;
    notesPlaceholder: string;
    cancel: string;
    confirm: string;
    success: string;
    error: string;
    viewDetails: string;
    reportReason: string;
    service: string;
    communication: string;
    value: string;
    professionalism: string;
    paymentSpeed: string;
    trust: string;
    clarity: string;
    support: string;
  };
};

type ModerationAction = {
  reviewId: string;
  action: "approve" | "reject";
};

export function ReviewModerationQueue({
  pendingReviews,
  reportedReviews,
  locale,
  translations: t,
}: ReviewModerationQueueProps) {
  const [activeTab, setActiveTab] = useState<"pending" | "reported">("pending");
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<ModerationAction | null>(null);
  const [notes, setNotes] = useState("");
  const [processingReviews, setProcessingReviews] = useState<Set<string>>(new Set());

  const reviews = activeTab === "pending" ? pendingReviews : reportedReviews;

  const handleAction = async (reviewId: string, action: "approve" | "reject") => {
    setProcessingReviews((prev) => new Set(prev).add(reviewId));

    try {
      const response = await fetch("/api/admin/reviews/moderate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewId,
          action,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process review");
      }

      // Refresh the page to show updated list
      window.location.reload();
    } catch (error) {
      console.error("Review moderation failed:", error);
      alert(t.error);
    } finally {
      setProcessingReviews((prev) => {
        const next = new Set(prev);
        next.delete(reviewId);
        return next;
      });
      setActionInProgress(null);
      setNotes("");
    }
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  };

  const getProfileName = (profile: any) => {
    const p = Array.isArray(profile) ? profile[0] : profile;
    return p?.full_name || "Unknown";
  };

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-foreground/10">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "pending"
              ? "border-b-2 border-primary text-primary"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          {t.pendingTab} ({pendingReviews.length})
        </button>
        <button
          onClick={() => setActiveTab("reported")}
          className={`px-4 py-2 font-semibold transition ${
            activeTab === "reported"
              ? "border-b-2 border-primary text-primary"
              : "text-foreground/60 hover:text-foreground"
          }`}
        >
          {t.reportedTab} ({reportedReviews.length})
        </button>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="rounded-lg border border-foreground/10 bg-white p-12 text-center">
          <p className="text-foreground/60">{t.noReviews}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isExpanded = expandedReview === review.id;
            const isProcessing = processingReviews.has(review.id);

            return (
              <div
                key={review.id}
                className="overflow-hidden rounded-lg border border-foreground/10 bg-white shadow-sm"
              >
                {/* Collapsed view */}
                <div className="flex items-center justify-between gap-4 p-6">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <StarRating rating={review.overall_rating} readonly size="sm" />
                      <h3 className="font-semibold text-foreground">{review.title}</h3>
                    </div>
                    <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                      <span>
                        {t.reviewer}: {getProfileName(review.reviewer)}
                      </span>
                      <span>→</span>
                      <span>
                        {t.reviewee}: {getProfileName(review.reviewee)}
                      </span>
                      <span>•</span>
                      <span>{formatDate(review.created_at)}</span>
                    </div>
                    {review.status === "reported" && review.report_reason && (
                      <div className="mt-2 rounded-lg bg-red-50 p-3">
                        <p className="text-sm font-medium text-red-800">{t.reportReason}:</p>
                        <p className="text-sm text-red-700">{review.report_reason}</p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setExpandedReview(isExpanded ? null : review.id)}
                    className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                    disabled={isProcessing}
                  >
                    {isExpanded ? t.cancel : t.viewDetails}
                  </button>
                </div>

                {/* Expanded view */}
                {isExpanded && (
                  <div className="border-t border-foreground/10 bg-gray-50 p-6">
                    {/* Review content */}
                    <div className="mb-6 space-y-4">
                      <div>
                        <h4 className="mb-2 text-sm font-semibold text-foreground">Comment</h4>
                        <p className="whitespace-pre-wrap rounded-lg bg-white p-4 text-sm text-foreground/80">
                          {review.comment}
                        </p>
                      </div>

                      {/* Category ratings */}
                      {(review.service_rating ||
                        review.communication_rating ||
                        review.value_rating ||
                        review.professionalism_rating ||
                        review.payment_speed_rating ||
                        review.trust_rating ||
                        review.clarity_rating ||
                        review.support_rating) && (
                        <div>
                          <h4 className="mb-2 text-sm font-semibold text-foreground">Category Ratings</h4>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {review.service_rating && (
                              <div className="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
                                <span className="text-foreground/70">{t.service}</span>
                                <StarRating rating={review.service_rating} readonly size="sm" />
                              </div>
                            )}
                            {review.communication_rating && (
                              <div className="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
                                <span className="text-foreground/70">{t.communication}</span>
                                <StarRating rating={review.communication_rating} readonly size="sm" />
                              </div>
                            )}
                            {review.value_rating && (
                              <div className="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
                                <span className="text-foreground/70">{t.value}</span>
                                <StarRating rating={review.value_rating} readonly size="sm" />
                              </div>
                            )}
                            {review.professionalism_rating && (
                              <div className="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
                                <span className="text-foreground/70">{t.professionalism}</span>
                                <StarRating rating={review.professionalism_rating} readonly size="sm" />
                              </div>
                            )}
                            {review.payment_speed_rating && (
                              <div className="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
                                <span className="text-foreground/70">{t.paymentSpeed}</span>
                                <StarRating rating={review.payment_speed_rating} readonly size="sm" />
                              </div>
                            )}
                            {review.trust_rating && (
                              <div className="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
                                <span className="text-foreground/70">{t.trust}</span>
                                <StarRating rating={review.trust_rating} readonly size="sm" />
                              </div>
                            )}
                            {review.clarity_rating && (
                              <div className="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
                                <span className="text-foreground/70">{t.clarity}</span>
                                <StarRating rating={review.clarity_rating} readonly size="sm" />
                              </div>
                            )}
                            {review.support_rating && (
                              <div className="flex items-center justify-between rounded-lg bg-white p-3 text-sm">
                                <span className="text-foreground/70">{t.support}</span>
                                <StarRating rating={review.support_rating} readonly size="sm" />
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action buttons or notes section */}
                    {actionInProgress && actionInProgress.reviewId === review.id ? (
                      <div className="space-y-4">
                        <div>
                          <label htmlFor={`notes-${review.id}`} className="mb-2 block text-sm font-semibold text-foreground">
                            {t.notes}
                          </label>
                          <textarea
                            id={`notes-${review.id}`}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder={t.notesPlaceholder}
                            rows={3}
                            className="w-full rounded-lg border border-foreground/20 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleAction(review.id, actionInProgress.action)}
                            disabled={isProcessing}
                            className={`flex-1 rounded-lg px-6 py-3 font-semibold text-white transition ${
                              actionInProgress.action === "approve"
                                ? "bg-green-600 hover:bg-green-700"
                                : "bg-red-600 hover:bg-red-700"
                            } ${isProcessing ? "cursor-not-allowed opacity-50" : ""}`}
                          >
                            {isProcessing
                              ? actionInProgress.action === "approve"
                                ? t.approving
                                : t.rejecting
                              : t.confirm}
                          </button>
                          <button
                            onClick={() => {
                              setActionInProgress(null);
                              setNotes("");
                            }}
                            disabled={isProcessing}
                            className="rounded-lg border border-foreground/20 px-6 py-3 font-semibold text-foreground transition hover:bg-gray-100"
                          >
                            {t.cancel}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setActionInProgress({ reviewId: review.id, action: "approve" })}
                          disabled={isProcessing}
                          className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                        >
                          {t.approve}
                        </button>
                        <button
                          onClick={() => setActionInProgress({ reviewId: review.id, action: "reject" })}
                          disabled={isProcessing}
                          className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                        >
                          {t.reject}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
