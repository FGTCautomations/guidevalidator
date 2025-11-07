"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface FreezeUserFormProps {
  userId: string;
  userType: "guide" | "agency" | "dmc" | "transport";
  userName: string;
  locale: string;
}

export function FreezeUserForm({ userId, userType, userName, locale }: FreezeUserFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleFreeze = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for freezing this account.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userType: userType === "guide" ? "guides" : userType + "s",
          reason: reason.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to freeze account");
      }

      alert("Account frozen successfully!");
      router.refresh();
      setIsOpen(false);
      setReason("");
    } catch (error) {
      console.error("Error freezing account:", error);
      alert(error instanceof Error ? error.message : "Failed to freeze account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
        disabled={isLoading}
      >
        ❄️ Freeze Account
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Freeze Account</h3>
            <p className="text-sm text-foreground/70">
              You are about to freeze the account for <strong>{userName}</strong>. The user will not be able to login or use the platform.
            </p>

            <div className="space-y-2">
              <label htmlFor="freeze-reason" className="block text-sm font-medium text-foreground">
                Reason for freezing (required)
              </label>
              <textarea
                id="freeze-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={4}
                placeholder="Enter the reason for freezing this account..."
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setReason("");
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleFreeze}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
                disabled={isLoading || !reason.trim()}
              >
                {isLoading ? "Freezing..." : "Freeze Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
