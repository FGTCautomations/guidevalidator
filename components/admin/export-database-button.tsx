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
        const data = await response.json();
        throw new Error(data.error || "Failed to export database");
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
    <div className="inline-flex flex-col gap-2">
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="inline-flex items-center gap-3 rounded-2xl bg-green-600 px-8 py-4 text-base font-semibold text-white shadow-md transition hover:bg-green-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isExporting ? (
          <>
            <svg
              className="h-6 w-6 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
            >
              <path
                d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"
                strokeWidth={2}
                strokeLinecap="round"
              />
            </svg>
            <span>Exporting...</span>
          </>
        ) : (
          <>
            <svg
              className="h-6 w-6"
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
            <span>Export to Excel</span>
          </>
        )}
      </button>
      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
