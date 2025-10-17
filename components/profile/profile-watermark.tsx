"use client";

import { useEffect, useState } from "react";

type ProfileWatermarkProps = {
  userEmail: string;
};

export function ProfileWatermark({ userEmail }: ProfileWatermarkProps) {
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    // Update timestamp
    const updateTimestamp = () => {
      const now = new Date();
      setTimestamp(
        now.toLocaleString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };

    updateTimestamp();
    // Update every second
    const interval = setInterval(updateTimestamp, 1000);

    return () => clearInterval(interval);
  }, []);

  const watermarkText = `${userEmail} • ${timestamp}`;

  return (
    <>
      {/* Diagonal watermarks */}
      <div
        className="pointer-events-none fixed inset-0 z-50 select-none"
        style={{
          background: `repeating-linear-gradient(
            45deg,
            transparent,
            transparent 200px,
            rgba(0, 0, 0, 0.015) 200px,
            rgba(0, 0, 0, 0.015) 201px
          )`,
        }}
        aria-hidden="true"
      >
        {/* Multiple watermark instances */}
        {[...Array(20)].map((_, i) => {
          const row = Math.floor(i / 4);
          const col = i % 4;
          return (
            <div
              key={i}
              className="absolute text-xs font-mono opacity-5"
              style={{
                top: `${row * 25 + 10}%`,
                left: `${col * 25 + 5}%`,
                transform: "rotate(-45deg)",
                whiteSpace: "nowrap",
              }}
            >
              {watermarkText}
            </div>
          );
        })}
      </div>

      {/* Corner watermarks */}
      <div
        className="pointer-events-none fixed bottom-2 right-2 z-50 select-none text-[10px] font-mono text-foreground/5"
        aria-hidden="true"
      >
        {watermarkText}
      </div>
      <div
        className="pointer-events-none fixed top-2 left-2 z-50 select-none text-[10px] font-mono text-foreground/5"
        aria-hidden="true"
      >
        {watermarkText}
      </div>

      {/* Hidden metadata for screenshot tracking */}
      <div className="hidden" data-viewer={userEmail} data-timestamp={timestamp} />
    </>
  );
}
