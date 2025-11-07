export function LoadingSpinner({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  return (
    <div className={`${sizeClasses[size]} animate-spin rounded-full border-primary border-t-transparent`} />
  );
}

interface LoadingProgressProps {
  current: number;
  total: number;
  message?: string;
}

export function LoadingProgress({ current, total, message }: LoadingProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full space-y-3">
      {/* Message */}
      {message && (
        <div className="flex items-center justify-center gap-3">
          <LoadingSpinner size="sm" />
          <p className="text-sm text-foreground/70">{message}</p>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full">
        <div className="mb-2 flex items-center justify-between text-xs text-foreground/60">
          <span>Loading guides...</span>
          <span>{percentage}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="mt-2 text-center text-xs text-foreground/60">
          {current.toLocaleString()} / {total.toLocaleString()} guides
        </p>
      </div>
    </div>
  );
}

interface LoadingOverlayProps {
  message: string;
  progress?: { current: number; total: number };
}

export function LoadingOverlay({ message, progress }: LoadingOverlayProps) {
  return (
    <div className="rounded-xl border border-foreground/10 bg-white p-8 shadow-sm">
      <div className="flex flex-col items-center justify-center space-y-6">
        {progress ? (
          <LoadingProgress
            current={progress.current}
            total={progress.total}
            message={message}
          />
        ) : (
          <>
            <LoadingSpinner size="lg" />
            <p className="text-sm text-foreground/70">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}
