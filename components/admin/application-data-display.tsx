"use client";

import { useState } from "react";

interface ApplicationDataDisplayProps {
  applicationData: any;
  guideData: any;
  agencyData: any;
}

export function ApplicationDataDisplay({ applicationData, guideData, agencyData }: ApplicationDataDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!applicationData && !guideData && !agencyData) {
    return null;
  }

  const displayData = applicationData || {};
  const allData = { ...displayData, ...guideData, ...agencyData };

  // Filter out null/undefined values and system fields
  const filteredData = Object.entries(allData).filter(
    ([key, value]) =>
      value !== null &&
      value !== undefined &&
      !key.startsWith("_") &&
      !["id", "created_at", "updated_at", "profile_id"].includes(key)
  );

  const renderValue = (value: any): string => {
    if (typeof value === "boolean") return value ? "Yes" : "No";
    if (Array.isArray(value)) return value.join(", ") || "None";
    if (typeof value === "object") return JSON.stringify(value, null, 2);
    return String(value);
  };

  const formatKey = (key: string): string => {
    return key
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  if (filteredData.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Application Data</h2>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {isExpanded ? "Hide Details" : "Show All Details"}
        </button>
      </div>

      <div className="grid gap-3 text-sm sm:grid-cols-2">
        {(isExpanded ? filteredData : filteredData.slice(0, 10)).map(([key, value]) => (
          <div key={key} className="space-y-1">
            <p className="font-semibold text-foreground/70">{formatKey(key)}</p>
            <p className="text-foreground/90 whitespace-pre-wrap break-words">
              {renderValue(value)}
            </p>
          </div>
        ))}
      </div>

      {!isExpanded && filteredData.length > 10 && (
        <p className="text-xs text-foreground/60">
          Showing 10 of {filteredData.length} fields. Click "Show All Details" to see more.
        </p>
      )}
    </section>
  );
}
