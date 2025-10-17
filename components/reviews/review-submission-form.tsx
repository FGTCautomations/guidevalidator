"use client";

import { useState } from "react";
import { StarRatingInput } from "@/components/ui/star-rating";
import type { RevieweeType } from "@/lib/reviews/types";

type ReviewSubmissionFormProps = {
  revieweeId: string;
  revieweeType: RevieweeType;
  revieweeName: string;
  reviewerType: "guide" | "agency" | "dmc" | "transport";
  jobReference?: string;
  bookingReference?: string;
  locale?: string;
  onSubmit?: () => void;
  translations: {
    title: string;
    subtitle: string;
    overallRating: string;
    reviewTitle: string;
    reviewTitlePlaceholder: string;
    comment: string;
    commentPlaceholder: string;
    submit: string;
    submitting: string;
    success: string;
    error: string;
    cancel: string;

    // Agency rating guide fields
    serviceRating?: string;
    communicationRating?: string;
    valueRating?: string;
    professionalismRating?: string;

    // Guide rating agency fields
    paymentSpeedRating?: string;
    trustRating?: string;
    clarityRating?: string;
    supportRating?: string;
  };
};

export function ReviewSubmissionForm({
  revieweeId,
  revieweeType,
  revieweeName,
  reviewerType,
  jobReference,
  bookingReference,
  locale = "en",
  onSubmit,
  translations: t,
}: ReviewSubmissionFormProps) {
  const [overallRating, setOverallRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Category ratings based on reviewer/reviewee type
  const [serviceRating, setServiceRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [valueRating, setValueRating] = useState(0);
  const [professionalismRating, setProfessionalismRating] = useState(0);

  const [paymentSpeedRating, setPaymentSpeedRating] = useState(0);
  const [trustRating, setTrustRating] = useState(0);
  const [clarityRating, setClarityRating] = useState(0);
  const [supportRating, setSupportRating] = useState(0);

  const isAgencyRatingGuide = ["agency", "dmc", "transport"].includes(reviewerType) && revieweeType === "guide";
  const isGuideRatingAgency = reviewerType === "guide" && ["agency", "dmc", "transport"].includes(revieweeType);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (overallRating === 0) {
      setMessage({ type: "error", text: "Please provide an overall rating" });
      return;
    }

    if (!title.trim() || !comment.trim()) {
      setMessage({ type: "error", text: "Please provide a title and comment" });
      return;
    }

    setIsSubmitting(true);

    const payload = {
      revieweeId,
      revieweeType,
      overallRating,
      title: title.trim(),
      comment: comment.trim(),
      jobReference,
      bookingReference,
      locale,
      // Category ratings
      ...(isAgencyRatingGuide && {
        serviceRating,
        communicationRating,
        valueRating,
        professionalismRating,
      }),
      ...(isGuideRatingAgency && {
        paymentSpeedRating,
        trustRating,
        clarityRating,
        supportRating,
      }),
    };

    console.log("[ReviewForm] Submitting review with payload:", payload);

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("[ReviewForm] API error:", error);
        console.error("[ReviewForm] Response status:", response.status);
        throw new Error(error.error || error.message || "Failed to submit review");
      }

      console.log("[ReviewForm] Review submitted successfully");

      setMessage({ type: "success", text: t.success });

      // Reset form
      setOverallRating(0);
      setTitle("");
      setComment("");
      setServiceRating(0);
      setCommunicationRating(0);
      setValueRating(0);
      setProfessionalismRating(0);
      setPaymentSpeedRating(0);
      setTrustRating(0);
      setClarityRating(0);
      setSupportRating(0);

      if (onSubmit) {
        setTimeout(onSubmit, 2000);
      }
    } catch (error) {
      console.error("Review submission error:", error);
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : t.error,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 rounded-lg border border-foreground/10 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-xl font-semibold text-foreground">{t.title}</h2>
        <p className="text-sm text-foreground/70">
          {t.subtitle.replace("{name}", revieweeName)}
        </p>
      </div>

      {/* Overall Rating */}
      <StarRatingInput
        label={t.overallRating}
        value={overallRating}
        onChange={setOverallRating}
        required
      />

      {/* Category Ratings for Agency Rating Guide */}
      {isAgencyRatingGuide && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Category Ratings</h3>
          {t.serviceRating && (
            <StarRatingInput
              label={t.serviceRating}
              value={serviceRating}
              onChange={setServiceRating}
            />
          )}
          {t.communicationRating && (
            <StarRatingInput
              label={t.communicationRating}
              value={communicationRating}
              onChange={setCommunicationRating}
            />
          )}
          {t.valueRating && (
            <StarRatingInput
              label={t.valueRating}
              value={valueRating}
              onChange={setValueRating}
            />
          )}
          {t.professionalismRating && (
            <StarRatingInput
              label={t.professionalismRating}
              value={professionalismRating}
              onChange={setProfessionalismRating}
            />
          )}
        </div>
      )}

      {/* Category Ratings for Guide Rating Agency */}
      {isGuideRatingAgency && (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Category Ratings</h3>
          {t.paymentSpeedRating && (
            <StarRatingInput
              label={t.paymentSpeedRating}
              value={paymentSpeedRating}
              onChange={setPaymentSpeedRating}
            />
          )}
          {t.trustRating && (
            <StarRatingInput
              label={t.trustRating}
              value={trustRating}
              onChange={setTrustRating}
            />
          )}
          {t.clarityRating && (
            <StarRatingInput
              label={t.clarityRating}
              value={clarityRating}
              onChange={setClarityRating}
            />
          )}
          {t.supportRating && (
            <StarRatingInput
              label={t.supportRating}
              value={supportRating}
              onChange={setSupportRating}
            />
          )}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <label htmlFor="review-title" className="text-sm font-medium text-foreground">
          {t.reviewTitle} <span className="text-red-500">*</span>
        </label>
        <input
          id="review-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t.reviewTitlePlaceholder}
          required
          maxLength={200}
          className="w-full rounded-lg border border-foreground/20 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <label htmlFor="review-comment" className="text-sm font-medium text-foreground">
          {t.comment} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="review-comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder={t.commentPlaceholder}
          required
          rows={5}
          maxLength={2000}
          className="w-full rounded-lg border border-foreground/20 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        <p className="text-xs text-foreground/60">{comment.length} / 2000 characters</p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-4 text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-800"
              : "bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting || overallRating === 0}
        className="w-full rounded-lg bg-primary px-6 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isSubmitting ? t.submitting : t.submit}
      </button>
    </form>
  );
}
