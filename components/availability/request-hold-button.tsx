"use client";

import { useState } from "react";
import { RequestHoldModal } from "./request-hold-modal";
import type { SupportedLocale } from "@/i18n/config";

interface Props {
  targetId: string;
  targetName: string;
  targetRole: "guide" | "transport";
  currentUserId: string;
  currentUserRole: string;
  locale: SupportedLocale;
}

export function RequestHoldButton({
  targetId,
  targetName,
  targetRole,
  currentUserId,
  currentUserRole,
  locale,
}: Props) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Only show for agencies and DMCs
  if (currentUserRole !== "agency" && currentUserRole !== "dmc") {
    return null;
  }

  // Don't show if trying to request hold from self
  if (currentUserId === targetId) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-purple-600"
      >
        <svg
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        Request Hold
      </button>

      <RequestHoldModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetId={targetId}
        targetName={targetName}
        targetRole={targetRole}
        requesterId={currentUserId}
        requesterRole={currentUserRole as "agency" | "dmc"}
        locale={locale}
        onSuccess={() => {
          // Could add a success message or redirect
          console.log("Hold request sent successfully");
        }}
      />
    </>
  );
}
