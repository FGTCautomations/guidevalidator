"use client";

import { useState } from "react";
import Image from "next/image";
import { type PendingVerificationItem } from "@/lib/admin/queries";
import { type SupportedLocale } from "@/i18n/config";

type VerificationQueueProps = {
  items: PendingVerificationItem[];
  locale: SupportedLocale;
  translations: {
    noItems: string;
    type: string;
    applicant: string;
    email: string;
    submitted: string;
    actions: string;
    viewDetails: string;
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
    selfie: string;
    license: string;
    idDocument: string;
    logo: string;
    noImage: string;
    guide: string;
    agency: string;
    dmc: string;
    transport: string;
  };
};

type VerificationAction = {
  itemId: string;
  action: "approve" | "reject";
};

export function VerificationQueue({ items, locale, translations }: VerificationQueueProps) {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<VerificationAction | null>(null);
  const [notes, setNotes] = useState("");
  const [processingItems, setProcessingItems] = useState<Set<string>>(new Set());

  const handleAction = async (itemId: string, type: string, action: "approve" | "reject") => {
    setProcessingItems((prev) => new Set(prev).add(itemId));

    try {
      const response = await fetch("/api/admin/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          type,
          action,
          notes: notes.trim() || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process verification");
      }

      // Refresh the page to show updated list
      window.location.reload();
    } catch (error) {
      console.error("Verification action failed:", error);
      alert(translations.error);
    } finally {
      setProcessingItems((prev) => {
        const next = new Set(prev);
        next.delete(itemId);
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

  const getTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      guide: translations.guide,
      agency: translations.agency,
      dmc: translations.dmc,
      transport: translations.transport,
    };
    return typeMap[type] || type;
  };

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-foreground/10 bg-white p-12 text-center">
        <p className="text-foreground/60">{translations.noItems}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const isExpanded = expandedItem === item.id;
        const isProcessing = processingItems.has(item.id);

        return (
          <div
            key={item.id}
            className="overflow-hidden rounded-lg border border-foreground/10 bg-white shadow-sm"
          >
            {/* Collapsed view */}
            <div className="flex items-center justify-between gap-4 p-6">
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                    {getTypeLabel(item.type)}
                  </span>
                  <h3 className="font-semibold text-foreground">{item.applicantName}</h3>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-foreground/60">
                  <span>{item.applicantEmail}</span>
                  <span>•</span>
                  <span>{formatDate(item.createdAt)}</span>
                </div>
              </div>
              <button
                onClick={() => setExpandedItem(isExpanded ? null : item.id)}
                className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
                disabled={isProcessing}
              >
                {isExpanded ? translations.cancel : translations.viewDetails}
              </button>
            </div>

            {/* Expanded view */}
            {isExpanded && (
              <div className="border-t border-foreground/10 bg-gray-50 p-6">
                {/* Images section */}
                <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {item.selfieUrl && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{translations.selfie}</p>
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-foreground/10 bg-white">
                        <Image
                          src={item.selfieUrl}
                          alt="Selfie"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {item.licenseProofUrl && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{translations.license}</p>
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-foreground/10 bg-white">
                        <Image
                          src={item.licenseProofUrl}
                          alt="License"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {item.idDocumentUrl && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{translations.idDocument}</p>
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-foreground/10 bg-white">
                        <Image
                          src={item.idDocumentUrl}
                          alt="ID Document"
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {item.logoUrl && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-foreground">{translations.logo}</p>
                      <div className="relative aspect-square overflow-hidden rounded-lg border border-foreground/10 bg-white">
                        <Image
                          src={item.logoUrl}
                          alt="Logo"
                          fill
                          className="object-contain"
                          unoptimized
                        />
                      </div>
                    </div>
                  )}

                  {!item.selfieUrl && !item.licenseProofUrl && !item.idDocumentUrl && !item.logoUrl && (
                    <div className="col-span-full rounded-lg bg-gray-100 p-8 text-center">
                      <p className="text-sm text-foreground/60">{translations.noImage}</p>
                    </div>
                  )}
                </div>

                {/* Action buttons or notes section */}
                {actionInProgress && actionInProgress.itemId === item.id ? (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor={`notes-${item.id}`} className="mb-2 block text-sm font-semibold text-foreground">
                        {translations.notes}
                      </label>
                      <textarea
                        id={`notes-${item.id}`}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={translations.notesPlaceholder}
                        rows={4}
                        className="w-full rounded-lg border border-foreground/20 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleAction(item.id, item.type, actionInProgress.action)}
                        disabled={isProcessing}
                        className={`flex-1 rounded-lg px-6 py-3 font-semibold text-white transition ${
                          actionInProgress.action === "approve"
                            ? "bg-green-600 hover:bg-green-700"
                            : "bg-red-600 hover:bg-red-700"
                        } ${isProcessing ? "cursor-not-allowed opacity-50" : ""}`}
                      >
                        {isProcessing
                          ? actionInProgress.action === "approve"
                            ? translations.approving
                            : translations.rejecting
                          : translations.confirm}
                      </button>
                      <button
                        onClick={() => {
                          setActionInProgress(null);
                          setNotes("");
                        }}
                        disabled={isProcessing}
                        className="rounded-lg border border-foreground/20 px-6 py-3 font-semibold text-foreground transition hover:bg-gray-100"
                      >
                        {translations.cancel}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActionInProgress({ itemId: item.id, action: "approve" })}
                      disabled={isProcessing}
                      className="flex-1 rounded-lg bg-green-600 px-6 py-3 font-semibold text-white transition hover:bg-green-700"
                    >
                      {translations.approve}
                    </button>
                    <button
                      onClick={() => setActionInProgress({ itemId: item.id, action: "reject" })}
                      disabled={isProcessing}
                      className="flex-1 rounded-lg bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
                    >
                      {translations.reject}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
