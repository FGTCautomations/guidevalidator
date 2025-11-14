"use client";

import { useState } from "react";

export function ExportDatabaseButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      setError(null);

      const response = await fetch("/api/admin/export-database", {
        method: "GET",
      });

      if (!response.ok) {
        // Check if response is JSON or HTML error page
        const contentType = response.headers.get("content-type");

        if (response.status === 504) {
          throw new Error("Export timed out. The database is too large to export in one request. Please contact support for assistance with large exports.");
        }

        if (contentType?.includes("application/json")) {
          const data = await response.json();
          throw new Error(data.error || "Failed to export database");
        } else {
          // HTML error page or other non-JSON response
          throw new Error(`Server error (${response.status}): Unable to export database. Please try again or contact support if the problem persists.`);
        }
      }

      // Get the filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch?.[1] || `database-export-${Date.now()}.xlsx`;

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Export error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex w-full flex-col items-center gap-3">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex flex-col items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <svg
              className="h-8 w-8 animate-spin text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-center text-sm font-semibold text-foreground">Exporting...</span>
          </>
        ) : (
          <>
            <svg
              className="h-8 w-8 text-green-600"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span className="text-center text-sm font-semibold text-foreground">Export to Excel</span>
          </>
        )}
      </button>
      {error && (
        <div className="w-full rounded-lg border border-red-300 bg-red-50 p-2">
          <p className="text-xs font-medium text-red-800 text-center">
            {error}
          </p>
        </div>
      )}
    </div>
  );
}
