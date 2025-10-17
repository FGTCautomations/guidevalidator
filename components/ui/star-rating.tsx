"use client";

import { useState } from "react";

type StarRatingProps = {
  rating?: number;
  maxRating?: number;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
  showValue?: boolean;
  onChange?: (rating: number) => void;
  label?: string;
};

export function StarRating({
  rating = 0,
  maxRating = 5,
  size = "md",
  readonly = false,
  showValue = false,
  onChange,
  label,
}: StarRatingProps) {
  const [hoverRating, setHoverRating] = useState(0);

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  const sizeClass = sizeClasses[size];

  const handleClick = (value: number) => {
    if (!readonly && onChange) {
      onChange(value);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <div className="flex items-center gap-2">
      {label && (
        <span className="text-sm font-medium text-foreground">{label}</span>
      )}
      <div
        className="flex items-center gap-0.5"
        onMouseLeave={() => !readonly && setHoverRating(0)}
      >
        {Array.from({ length: maxRating }, (_, i) => {
          const starValue = i + 1;
          const isFilled = starValue <= displayRating;
          const isPartiallyFilled =
            starValue > displayRating &&
            starValue - 1 < displayRating &&
            !hoverRating;

          return (
            <button
              key={i}
              type="button"
              disabled={readonly}
              onClick={() => handleClick(starValue)}
              onMouseEnter={() => !readonly && setHoverRating(starValue)}
              className={`${readonly ? "cursor-default" : "cursor-pointer transition hover:scale-110"} focus:outline-none`}
              aria-label={`Rate ${starValue} out of ${maxRating}`}
            >
              {isPartiallyFilled ? (
                <PartialStar className={sizeClass} fillPercent={(displayRating % 1) * 100} />
              ) : (
                <svg
                  className={sizeClass}
                  fill={isFilled ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth={isFilled ? 0 : 1.5}
                  viewBox="0 0 24 24"
                  style={{ color: isFilled ? "#fbbf24" : "#d1d5db" }}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-foreground/70">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function PartialStar({ className, fillPercent }: { className: string; fillPercent: number }) {
  return (
    <svg className={className} viewBox="0 0 24 24">
      <defs>
        <linearGradient id={`starGradient-${fillPercent}`}>
          <stop offset={`${fillPercent}%`} stopColor="#fbbf24" />
          <stop offset={`${fillPercent}%`} stopColor="#d1d5db" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#starGradient-${fillPercent})`}
        stroke="#d1d5db"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
      />
    </svg>
  );
}

export function StarRatingInput({
  label,
  value,
  onChange,
  required = false,
  error,
}: {
  label: string;
  value: number;
  onChange: (rating: number) => void;
  required?: boolean;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2 text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <StarRating rating={value} onChange={onChange} size="lg" />
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
