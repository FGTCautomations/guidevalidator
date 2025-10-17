"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function RefreshAntiScrapingStatsButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-full border border-foreground/20 bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-foreground/5 disabled:opacity-60"
      disabled={isPending}
    >
      <svg
        aria-hidden="true"
        className={`h-4 w-4 ${isPending ? "animate-spin" : ""}`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          d="M4 4v5h5M20 20v-5h-5M5.5 13a6.5 6.5 0 0 1 10.5-4.8l2 1.6M18.5 11a6.5 6.5 0 0 1-10.5 4.8l-2-1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{isPending ? "Refreshing..." : "Refresh Stats"}</span>
    </button>
  );
}
