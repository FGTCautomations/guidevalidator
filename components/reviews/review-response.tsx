"use client";

import { useState, useEffect } from "react";

type ReviewResponseProps = {
  reviewId: string;
  canRespond: boolean;
  translations: {
    responseTitle: string;
    responsePlaceholder: string;
    submitResponse: string;
    updateResponse: string;
    submitting: string;
    cancel: string;
    respondLabel: string;
    editResponse: string;
    success: string;
    error: string;
  };
};

export function ReviewResponse({ reviewId, canRespond, translations: t }: ReviewResponseProps) {
  const [response, setResponse] = useState<{
    id: string;
    responderName: string;
    response: string;
    createdAt: string;
    updatedAt?: string;
  } | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponse();
  }, [reviewId]);

  const fetchResponse = async () => {
    try {
      const res = await fetch(`/api/reviews/${reviewId}/response`);
      const data = await res.json();
      if (data.response) {
        setResponse(data.response);
        setResponseText(data.response.response);
      }
    } catch (error) {
      console.error("Failed to fetch response:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!responseText.trim()) {
      setMessage({ type: "error", text: "Response cannot be empty" });
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/reviews/${reviewId}/response`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: responseText.trim() }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: t.success });
        await fetchResponse();
        setIsEditing(false);
      } else {
        setMessage({ type: "error", text: data.error || t.error });
      }
    } catch (error) {
      console.error("Failed to submit response:", error);
      setMessage({ type: "error", text: t.error });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return null;
  }

  // Display existing response
  if (response && !isEditing) {
    return (
      <div className="mt-4 rounded-lg border border-foreground/10 bg-blue-50/50 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="font-semibold text-foreground">{t.responseTitle}</h4>
          {canRespond && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-sm text-secondary hover:underline"
            >
              {t.editResponse}
            </button>
          )}
        </div>
        <p className="text-sm text-foreground/80">{response.response}</p>
        <p className="mt-2 text-xs text-foreground/60">
          — {response.responderName} •{" "}
          {new Date(response.updatedAt || response.createdAt).toLocaleDateString()}
        </p>
      </div>
    );
  }

  // Show response form
  if (canRespond && (isEditing || !response)) {
    return (
      <div className="mt-4 rounded-lg border border-foreground/10 bg-white p-4">
        <h4 className="mb-3 font-semibold text-foreground">{t.responseTitle}</h4>
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={responseText}
            onChange={(e) => setResponseText(e.target.value)}
            placeholder={t.responsePlaceholder}
            rows={4}
            className="w-full rounded-lg border border-foreground/20 px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            disabled={isSubmitting}
          />

          {message && (
            <div
              className={`rounded-lg px-4 py-2 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-800"
                  : "bg-red-50 text-red-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || !responseText.trim()}
              className="rounded-lg bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? t.submitting : response ? t.updateResponse : t.submitResponse}
            </button>
            {(isEditing || response) && (
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                  setResponseText(response?.response || "");
                  setMessage(null);
                }}
                disabled={isSubmitting}
                className="rounded-lg border border-foreground/20 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-foreground/5"
              >
                {t.cancel}
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  return null;
}
