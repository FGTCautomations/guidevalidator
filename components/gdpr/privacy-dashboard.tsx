"use client";

import { useState } from "react";
import { format } from "date-fns";
import type { SupportedLocale } from "@/i18n/config";

interface Consent {
  id: string;
  consent_type: string;
  granted: boolean;
  consent_date: string;
  created_at: string;
}

interface DSARRequest {
  id: string;
  request_type: string;
  status: string;
  requested_at: string;
  completed_at?: string;
  notes?: string;
}

interface DeletionInfo {
  deleted_at?: string;
  deletion_requested_at?: string;
  deletion_reason?: string;
}

interface PrivacyDashboardProps {
  locale: SupportedLocale;
  userId: string;
  userEmail: string;
  consents: Consent[];
  dsarRequests: DSARRequest[];
  deletionInfo?: DeletionInfo | null;
}

export function PrivacyDashboard({
  locale,
  userId,
  userEmail,
  consents,
  dsarRequests,
  deletionInfo,
}: PrivacyDashboardProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletionReason, setDeletionReason] = useState("");

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const response = await fetch("/api/privacy/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error("Failed to export data");
      }

      const data = await response.json();

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `my-data-${format(new Date(), "yyyy-MM-dd")}.json`;

      if (document.body) {
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      URL.revokeObjectURL(url);

      alert("Your data has been exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/privacy/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, reason: deletionReason }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete account");
      }

      alert(
        "Your account deletion request has been submitted. You will be logged out and your account will be permanently deleted within 30 days."
      );

      // Redirect to homepage
      window.location.href = `/${locale}`;
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const getConsentIcon = (granted: boolean) => {
    return granted ? (
      <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
          clipRule="evenodd"
        />
      </svg>
    ) : (
      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
          clipRule="evenodd"
        />
      </svg>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800",
      processing: "bg-blue-100 text-blue-800",
      completed: "bg-green-100 text-green-800",
      rejected: "bg-red-100 text-red-800",
      cancelled: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
          colors[status as keyof typeof colors] || colors.pending
        }`}
      >
        {status}
      </span>
    );
  };

  if (deletionInfo?.deleted_at) {
    return (
      <div className="rounded-lg bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">Account Deleted</h2>
        <p className="mt-2 text-sm text-red-700">
          This account was deleted on {format(new Date(deletionInfo.deleted_at), "PPP")}.
        </p>
        {deletionInfo.deletion_reason && (
          <p className="mt-1 text-sm text-red-600">Reason: {deletionInfo.deletion_reason}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cookie Consent Preferences */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Cookie Preferences</h2>
        <p className="mt-1 text-sm text-gray-600">
          Your current consent preferences for cookies and tracking.
        </p>

        <div className="mt-4 space-y-3">
          {consents.length > 0 ? (
            consents.map((consent) => (
              <div key={consent.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getConsentIcon(consent.granted)}
                  <div>
                    <p className="text-sm font-medium capitalize text-gray-900">
                      {consent.consent_type} Cookies
                    </p>
                    <p className="text-xs text-gray-500">
                      Last updated: {format(new Date(consent.consent_date), "PPp")}
                    </p>
                  </div>
                </div>
                <span className="text-sm text-gray-600">
                  {consent.granted ? "Granted" : "Denied"}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500">No consent preferences set yet.</p>
          )}
        </div>

        <div className="mt-4">
          <button
            onClick={() => {
              localStorage.removeItem("cookie_consent_given");
              window.location.reload();
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Update Cookie Preferences
          </button>
        </div>
      </div>

      {/* Export Your Data */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="text-lg font-semibold text-gray-900">Export Your Data</h2>
        <p className="mt-1 text-sm text-gray-600">
          Download a copy of all your personal data in JSON format. This includes your profile,
          reviews, bookings, and all other data we have about you.
        </p>

        <button
          onClick={handleExportData}
          disabled={isExporting}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isExporting ? (
            <span className="flex items-center gap-2">
              <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Exporting...
            </span>
          ) : (
            "Download My Data"
          )}
        </button>
      </div>

      {/* DSAR Request History */}
      {dsarRequests.length > 0 && (
        <div className="rounded-lg bg-white p-6 shadow">
          <h2 className="text-lg font-semibold text-gray-900">Request History</h2>
          <p className="mt-1 text-sm text-gray-600">
            Your data subject access requests and their status.
          </p>

          <div className="mt-4 space-y-3">
            {dsarRequests.map((request) => (
              <div
                key={request.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="text-sm font-medium capitalize text-gray-900">
                    {request.request_type.replace("_", " ")} Request
                  </p>
                  <p className="text-xs text-gray-500">
                    Requested: {format(new Date(request.requested_at), "PPp")}
                  </p>
                  {request.completed_at && (
                    <p className="text-xs text-gray-500">
                      Completed: {format(new Date(request.completed_at), "PPp")}
                    </p>
                  )}
                </div>
                {getStatusBadge(request.status)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Delete Account */}
      <div className="rounded-lg border-2 border-red-200 bg-red-50 p-6">
        <h2 className="text-lg font-semibold text-red-900">Delete Account</h2>
        <p className="mt-1 text-sm text-red-700">
          Permanently delete your account and all associated data. This action cannot be undone.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="mt-4 rounded-lg border-2 border-red-600 bg-white px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-600 hover:text-white"
          >
            Delete My Account
          </button>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-lg bg-white p-4">
              <p className="text-sm font-medium text-gray-900">
                Are you absolutely sure?
              </p>
              <p className="mt-1 text-sm text-gray-600">
                This will permanently delete your account, including:
              </p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
                <li>Your profile and all personal information</li>
                <li>All reviews you've written</li>
                <li>All bookings and availability data</li>
                <li>All messages and communications</li>
              </ul>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700">
                  Reason for deletion (optional)
                </label>
                <textarea
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                  placeholder="Help us improve by telling us why you're leaving..."
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Yes, Delete My Account"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
