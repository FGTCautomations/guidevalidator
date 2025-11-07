"use client";

import { useEffect, useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { LoadingOverlay } from "./loading-state";

interface DirectoryContentProps {
  children: React.ReactNode;
  initialLoading?: boolean;
}

export function DirectoryContent({ children, initialLoading = false }: DirectoryContentProps) {
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(initialLoading);

  // Show loading when search params change (filter changes)
  useEffect(() => {
    setIsLoading(false);
  }, [searchParams]);

  // Show loading indicator when transitioning
  if (isPending || isLoading) {
    return (
      <div className="mx-auto w-full max-w-6xl py-12">
        <LoadingOverlay message="Loading guides..." />
      </div>
    );
  }

  return <>{children}</>;
}
