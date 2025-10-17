"use client";

import { useState, useEffect } from "react";
import { StarRating } from "@/components/ui/star-rating";
import type { ReviewWithProfiles } from "@/lib/reviews/types";

type ReviewsListProps = {
  revieweeId: string;
  initialReviews?: any[];
  initialTotal?: number;
  translations: {
    title: string;
    noReviews: string;
    loadMore: string;
    loading: string;
    service: string;
    communication: string;
    value: string;
    professionalism: string;
    paymentSpeed: string;
    trust: string;
    clarity: string;
    support: string;
    report: string;
    reported: string;
  };
};

export function ReviewsList({ revieweeId, initialReviews = [], initialTotal = 0, translations: t }: ReviewsListProps) {
  const [reviews, setReviews] = useState<any[]>(initialReviews);
  const [total, setTotal] = useState(initialTotal);
  const [offset, setOffset] = useState(initialReviews.length);
  const [loading, setLoading] = useState(false);
  const [reportingId, setReportingId] = useState<string | null>(null);

  const hasMore = offset < total;

  const loadMore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reviews?revieweeId=${revieweeId}&limit=10&offset=${offset}`);
      const data = await response.json();

      setReviews((prev) => [...prev, ...data.reviews]);
      setTotal(data.total);
      setOffset((prev) => prev + data.reviews.length);
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReport = async (reviewId: string, reason: string) => {
    setReportingId(reviewId);
    try {
      const response = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason }),
      });

      if (response.ok) {
        // Update review status locally
        setReviews((prev) =>
          prev.map((r) => (r.id === reviewId ? { ...r, status: "reported" } : r))
        );
      }
    } catch (error) {
      console.error("Failed to report review:", error);
    } finally {
      setReportingId(null);
    }
  };

  if (reviews.length === 0) {
    return (
      <div className="rounded-lg border border-foreground/10 bg-white p-8 text-center shadow-sm">
        <p className="text-foreground/60">{t.noReviews}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">
        {t.title} ({total})
      </h2>

      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewCard
            key={review.id}
            review={review}
            onReport={handleReport}
            isReporting={reportingId === review.id}
            translations={t}
          />
        ))}
      </div>

      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={loadMore}
            disabled={loading}
            className="rounded-lg border border-primary px-6 py-3 font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? t.loading : t.loadMore}
          </button>
        </div>
      )}
    </div>
  );
}

function ReviewCard({
  review,
  onReport,
  isReporting,
  translations: t,
}: {
  review: any;
  onReport: (reviewId: string, reason: string) => void;
  isReporting: boolean;
  translations: any;
}) {
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [reportReason, setReportReason] = useState("");

  const reviewer = Array.isArray(review.reviewer) ? review.reviewer[0] : review.reviewer;
  const reviewerName = reviewer?.full_name || "Anonymous";

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
    }).format(new Date(dateString));
  };

  const handleReportSubmit = () => {
    if (reportReason.trim()) {
      onReport(review.id, reportReason.trim());
      setShowReportDialog(false);
      setReportReason("");
    }
  };

  return (
    <div className="rounded-lg border border-foreground/10 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1">
          <div className="mb-2 flex items-center gap-2">
            <StarRating rating={review.overall_rating} readonly size="sm" />
            <span className="text-sm font-medium text-foreground">
              {review.overall_rating.toFixed(1)}
            </span>
          </div>
          <h3 className="font-semibold text-foreground">{review.title}</h3>
          <div className="mt-1 flex items-center gap-2 text-sm text-foreground/60">
            <span>{reviewerName}</span>
            <span>•</span>
            <span>{formatDate(review.created_at)}</span>
          </div>
        </div>

        {review.status !== "reported" && (
          <button
            onClick={() => setShowReportDialog(true)}
            disabled={isReporting}
            className="text-sm text-foreground/60 transition hover:text-foreground disabled:opacity-50"
          >
            {t.report}
          </button>
        )}
        {review.status === "reported" && (
          <span className="text-sm font-medium text-red-600">{t.reported}</span>
        )}
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
        <div className="mb-4 grid gap-2 sm:grid-cols-2">
          {review.service_rating && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">{t.service}</span>
              <StarRating rating={review.service_rating} readonly size="sm" />
            </div>
          )}
          {review.communication_rating && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">{t.communication}</span>
              <StarRating rating={review.communication_rating} readonly size="sm" />
            </div>
          )}
          {review.value_rating && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">{t.value}</span>
              <StarRating rating={review.value_rating} readonly size="sm" />
            </div>
          )}
          {review.professionalism_rating && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">{t.professionalism}</span>
              <StarRating rating={review.professionalism_rating} readonly size="sm" />
            </div>
          )}
          {review.payment_speed_rating && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">{t.paymentSpeed}</span>
              <StarRating rating={review.payment_speed_rating} readonly size="sm" />
            </div>
          )}
          {review.trust_rating && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">{t.trust}</span>
              <StarRating rating={review.trust_rating} readonly size="sm" />
            </div>
          )}
          {review.clarity_rating && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">{t.clarity}</span>
              <StarRating rating={review.clarity_rating} readonly size="sm" />
            </div>
          )}
          {review.support_rating && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-foreground/70">{t.support}</span>
              <StarRating rating={review.support_rating} readonly size="sm" />
            </div>
          )}
        </div>
      )}

      <p className="whitespace-pre-wrap text-sm text-foreground/80">{review.comment}</p>

      {/* Report Dialog */}
      {showReportDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h3 className="mb-4 text-lg font-semibold text-foreground">Report Review</h3>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Please describe why you're reporting this review..."
              rows={4}
              className="mb-4 w-full rounded-lg border border-foreground/20 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <div className="flex gap-3">
              <button
                onClick={handleReportSubmit}
                disabled={!reportReason.trim() || isReporting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Submit Report
              </button>
              <button
                onClick={() => {
                  setShowReportDialog(false);
                  setReportReason("");
                }}
                disabled={isReporting}
                className="flex-1 rounded-lg border border-foreground/20 px-4 py-2 font-semibold text-foreground transition hover:bg-foreground/5"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
