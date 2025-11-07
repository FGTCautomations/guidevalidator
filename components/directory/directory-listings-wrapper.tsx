"use client";

import { useTransition, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingOverlay } from "./loading-state";

interface DirectoryListingsWrapperProps {
  children: React.ReactNode;
}

export function DirectoryListingsWrapper({ children }: DirectoryListingsWrapperProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // This component wraps the listings and shows loading during navigation
  // The isPending state is triggered by Next.js when route changes happen

  if (isPending) {
    return (
      <div className="mx-auto w-full max-w-6xl">
        <LoadingOverlay message="Loading guides for selected letter..." />
      </div>
    );
  }

  return <>{children}</>;
}
