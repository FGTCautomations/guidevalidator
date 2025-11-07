"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ImportGuidesButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [cleanupResult, setCleanupResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCleanup = async () => {
    if (!confirm("This will delete all previously imported guides and their data. Are you sure? This cannot be undone.")) {
      return;
    }

    setCleaningUp(true);
    setError(null);
    setCleanupResult(null);

    try {
      const response = await fetch("/api/admin/cleanup-failed-imports", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Cleanup failed");
      }

      setCleanupResult(data.results);

      // Refresh the page to show updated counts
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Cleanup error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setCleaningUp(false);
    }
  };

  const handleImport = async () => {
    if (!confirm("Are you sure you want to import guides from the staging table? This will create auth users, profiles, and claim tokens.")) {
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/import-staging-guides", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Import failed");
      }

      setResult(data.results);

      // Refresh the page to show updated counts
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (err) {
      console.error("Import error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <button
          onClick={handleImport}
          disabled={loading || cleaningUp}
          className="flex-1 px-6 py-4 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {loading ? "Importing Guides..." : "Start Import"}
        </button>
        <button
          onClick={handleCleanup}
          disabled={loading || cleaningUp}
          className="px-6 py-4 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {cleaningUp ? "Cleaning..." : "Reset & Clean"}
        </button>
      </div>

      {cleanupResult && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">✓ Cleanup Complete</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-blue-700">Claim Tokens</p>
              <p className="text-2xl font-bold text-blue-900">{cleanupResult.deletedClaimTokens}</p>
            </div>
            <div>
              <p className="text-blue-700">Credentials</p>
              <p className="text-2xl font-bold text-blue-900">{cleanupResult.deletedCredentials}</p>
            </div>
            <div>
              <p className="text-blue-700">Guides</p>
              <p className="text-2xl font-bold text-blue-900">{cleanupResult.deletedGuides}</p>
            </div>
            <div>
              <p className="text-blue-700">Profiles</p>
              <p className="text-2xl font-bold text-blue-900">{cleanupResult.deletedProfiles}</p>
            </div>
            <div>
              <p className="text-blue-700">Auth Users</p>
              <p className="text-2xl font-bold text-blue-900">{cleanupResult.deletedAuthUsers}</p>
            </div>
          </div>
          {cleanupResult.errors && cleanupResult.errors.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm font-semibold text-yellow-900 mb-1">Warnings:</p>
              {cleanupResult.errors.map((err: string, idx: number) => (
                <p key={idx} className="text-xs text-yellow-800">{err}</p>
              ))}
            </div>
          )}
          <p className="mt-4 text-sm text-blue-700">You can now run the import again.</p>
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">✓ Import Complete</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-green-700">Total</p>
              <p className="text-2xl font-bold text-green-900">{result.total}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Imported</p>
              <p className="text-2xl font-bold text-green-900">{result.imported}</p>
            </div>
            <div>
              <p className="text-sm text-green-700">Skipped</p>
              <p className="text-2xl font-bold text-green-900">{result.skipped}</p>
            </div>
          </div>

          {result.details && result.details.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-foreground/80 mb-2">
                Details ({result.details.length}):
              </p>
              <div className="max-h-60 overflow-y-auto space-y-1">
                {result.details.map((detail: any, idx: number) => (
                  <div
                    key={idx}
                    className={`text-xs p-2 rounded ${
                      detail.status === "success"
                        ? "bg-green-50 text-green-800"
                        : detail.status === "error"
                        ? "bg-red-50 text-red-800"
                        : detail.status === "warning"
                        ? "bg-yellow-50 text-yellow-800"
                        : "bg-gray-50 text-gray-800"
                    }`}
                  >
                    <span className="font-semibold">{detail.guide}:</span> {detail.message}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.errors && result.errors.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-red-900 mb-2">
                Errors ({result.errors.length}):
              </p>
              <div className="max-h-40 overflow-y-auto space-y-1">
                {result.errors.map((err: any, idx: number) => (
                  <p key={idx} className="text-xs text-red-800">
                    {err.guide}: {err.error}
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-green-200">
            <a
              href="/admin/guide-invitations"
              className="inline-block px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              Go to Invitations Page →
            </a>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-semibold text-red-900 mb-1">Error</p>
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
    </div>
  );
}
