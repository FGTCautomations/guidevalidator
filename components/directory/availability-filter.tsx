"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import type { Route } from "next";

type AvailabilityFilterProps = {
  labels: {
    title: string;
    startDate: string;
    endDate: string;
    search: string;
    clear: string;
  };
};

export function AvailabilityFilter({ labels }: AvailabilityFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [startDate, setStartDate] = useState(searchParams?.get("availableFrom") || "");
  const [endDate, setEndDate] = useState(searchParams?.get("availableTo") || "");

  const handleSearch = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    if (startDate) {
      params.set("availableFrom", startDate);
    } else {
      params.delete("availableFrom");
    }

    if (endDate) {
      params.set("availableTo", endDate);
    } else {
      params.delete("availableTo");
    }

    router.push(`${pathname}?${params.toString()}` as Route);
  };

  const handleClear = () => {
    setStartDate("");
    setEndDate("");

    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("availableFrom");
    params.delete("availableTo");

    router.push(`${pathname}?${params.toString()}` as Route);
  };

  const hasFilters = startDate || endDate;

  return (
    <div className="space-y-4 rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="font-semibold text-gray-900">{labels.title}</h3>
      <p className="text-sm text-gray-600">
        Search for guides or transport available during a specific time period
      </p>

      <div className="space-y-3">
        {/* Start Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {labels.startDate}
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            {labels.endDate}
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={startDate || undefined}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleSearch}
            disabled={!startDate || !endDate}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {labels.search}
          </button>
          {hasFilters && (
            <button
              onClick={handleClear}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
            >
              {labels.clear}
            </button>
          )}
        </div>
      </div>

      {hasFilters && (
        <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">
          <p className="font-medium">Active Filter:</p>
          <p className="mt-1">
            Available from{" "}
            <span className="font-semibold">
              {startDate ? format(new Date(startDate), "MMM d, yyyy") : "any date"}
            </span>{" "}
            to{" "}
            <span className="font-semibold">
              {endDate ? format(new Date(endDate), "MMM d, yyyy") : "any date"}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
