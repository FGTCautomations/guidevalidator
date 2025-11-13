"use client";

import { useEffect } from "react";

type ToastType = "success" | "error" | "info";

type ToastNotificationProps = {
  message: string;
  type?: ToastType;
  onClose: () => void;
  duration?: number;
};

export function ToastNotification({
  message,
  type = "info",
  onClose,
  duration = 5000,
}: ToastNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor =
    type === "success"
      ? "bg-green-600"
      : type === "error"
      ? "bg-red-600"
      : "bg-blue-600";

  const icon =
    type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";

  return (
    <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-top-2">
      <div
        className={`${bgColor} text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md`}
      >
        <span className="text-xl font-bold">{icon}</span>
        <p className="flex-1 text-sm font-medium">{message}</p>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white transition"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
