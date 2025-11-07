"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface UnfreezeUserFormProps {
  userId: string;
  userType: "guide" | "agency" | "dmc" | "transport";
  userName: string;
  locale: string;
}

export function UnfreezeUserForm({ userId, userType, userName, locale }: UnfreezeUserFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleUnfreeze = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/users/unfreeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          userType: userType === "guide" ? "guides" : userType + "s",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to unfreeze account");
      }

      alert("Account unfrozen successfully!");
      router.refresh();
      setIsOpen(false);
    } catch (error) {
      console.error("Error unfreezing account:", error);
      alert(error instanceof Error ? error.message : "Failed to unfreeze account");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
        disabled={isLoading}
      >
        🔓 Unfreeze Account
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-semibold text-foreground">Unfreeze Account</h3>
            <p className="text-sm text-foreground/70">
              Are you sure you want to unfreeze the account for <strong>{userName}</strong>? The user will be able to login and use the platform again.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleUnfreeze}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? "Unfreezing..." : "Unfreeze Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
