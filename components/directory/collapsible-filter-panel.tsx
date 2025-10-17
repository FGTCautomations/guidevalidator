"use client";

import { useState } from "react";
import type { ReactNode } from "react";

interface CollapsibleFilterPanelProps {
  title: string;
  subtitle?: string;
  activeFiltersCount: number;
  children: ReactNode;
}

export function CollapsibleFilterPanel({
  title,
  subtitle,
  activeFiltersCount,
  children,
}: CollapsibleFilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Filter Toggle Button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 rounded-lg border border-gray-300 bg-white px-4 py-3 text-left shadow-sm transition hover:border-blue-500 hover:shadow-md"
        >
          <svg
            className="h-5 w-5 text-gray-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          <div>
            <span className="font-semibold text-gray-900">
              {isOpen ? "Hide Filters" : "Show Filters"}
            </span>
            {activeFiltersCount > 0 && (
              <span className="ml-2 rounded-full bg-blue-600 px-2 py-0.5 text-xs font-semibold text-white">
                {activeFiltersCount} active
              </span>
            )}
          </div>
          <svg
            className={`h-5 w-5 text-gray-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {subtitle && !isOpen && (
          <p className="text-sm text-gray-600">{subtitle}</p>
        )}
      </div>

      {/* Collapsible Filter Content */}
      {isOpen && (
        <div className="animate-in slide-in-from-top-2 fade-in-0 duration-200 rounded-lg border bg-white p-6 shadow-md">
          <div className="mb-4 flex items-center justify-between border-b pb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              {subtitle && <p className="mt-1 text-sm text-gray-600">{subtitle}</p>}
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              aria-label="Close filters"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {children}
        </div>
      )}
    </div>
  );
}
