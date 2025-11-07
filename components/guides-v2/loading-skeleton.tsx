export function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      {/* Results count skeleton */}
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-gray-200"></div>
      </div>

      {/* Listings grid skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-lg border border-foreground/10 bg-white p-4 shadow-sm"
          >
            {/* Avatar skeleton */}
            <div className="mb-4 h-48 w-full animate-pulse rounded-lg bg-gray-200"></div>

            {/* Name skeleton */}
            <div className="mb-2 h-6 w-3/4 animate-pulse rounded bg-gray-200"></div>

            {/* Headline skeleton */}
            <div className="mb-3 h-4 w-full animate-pulse rounded bg-gray-200"></div>

            {/* Tags skeleton */}
            <div className="flex flex-wrap gap-2">
              <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200"></div>
              <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200"></div>
              <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
