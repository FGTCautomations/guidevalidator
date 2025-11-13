"use client";

import { useState } from "react";

type DeleteUserModalProps = {
  userId: string;
  userName: string;
  userType: "guides" | "agencies" | "dmcs" | "transport";
  onClose: () => void;
  onConfirm: (userId: string, userType: string) => Promise<void>;
};

export function DeleteUserModal({
  userId,
  userName,
  userType,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  const [confirmText, setConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const expectedText = `DELETE ${userName}`;
  const isConfirmValid = confirmText === expectedText;

  const handleDelete = async () => {
    if (!isConfirmValid) return;

    setIsDeleting(true);
    try {
      await onConfirm(userId, userType);
      onClose();
    } catch (error) {
      console.error("Failed to delete user:", error);
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-red-600">
            ⚠️ Delete Account
          </h2>
          <button
            onClick={onClose}
            className="text-foreground/60 hover:text-foreground"
            disabled={isDeleting}
          >
            ✕
          </button>
        </div>

        <div className="mb-6 space-y-3">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4">
            <p className="text-sm font-semibold text-red-800 mb-2">
              This action cannot be undone!
            </p>
            <p className="text-sm text-red-700">
              You are about to permanently delete the account for <strong>{userName}</strong>.
              This will:
            </p>
            <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
              <li>Remove all user data from the system</li>
              <li>Delete their profile from the directory</li>
              <li>Remove them from admin lists</li>
              <li>Delete their authentication credentials</li>
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Type <span className="font-mono font-semibold text-red-600">{expectedText}</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder={`Type "${expectedText}"`}
              disabled={isDeleting}
              className="w-full rounded-lg border border-foreground/10 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/50 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
              autoFocus
            />
          </div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="flex-1 rounded-lg border border-foreground/10 px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-background disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={!isConfirmValid || isDeleting}
            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? "Deleting..." : "Delete Account"}
          </button>
        </div>

        <p className="mt-4 text-xs text-foreground/60">
          This action is irreversible. Make sure you have downloaded any necessary data before proceeding.
        </p>
      </div>
    </div>
  );
}
