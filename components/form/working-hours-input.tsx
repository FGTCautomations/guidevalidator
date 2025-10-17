"use client";

import { useState } from "react";

interface DayHours {
  enabled: boolean;
  startTime: string;
  endTime: string;
}

interface WorkingHoursData {
  [key: string]: DayHours;
}

interface WorkingHoursInputProps {
  value: WorkingHoursData;
  onChange: (value: WorkingHoursData) => void;
  label?: string;
}

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const TIME_OPTIONS = [
  "00:00", "01:00", "02:00", "03:00", "04:00", "05:00",
  "06:00", "07:00", "08:00", "09:00", "10:00", "11:00",
  "12:00", "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "23:59"
];

export function WorkingHoursInput({ value, onChange, label = "Working Hours" }: WorkingHoursInputProps) {
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkStart, setBulkStart] = useState("09:00");
  const [bulkEnd, setBulkEnd] = useState("17:00");

  const handleDayToggle = (day: string) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        enabled: !value[day]?.enabled,
        startTime: value[day]?.startTime || "09:00",
        endTime: value[day]?.endTime || "17:00",
      },
    });
  };

  const handleTimeChange = (day: string, field: "startTime" | "endTime", time: string) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: time,
      },
    });
  };

  const applyBulkHours = () => {
    const updated = { ...value };
    Object.keys(updated).forEach((day) => {
      if (updated[day].enabled) {
        updated[day].startTime = bulkStart;
        updated[day].endTime = bulkEnd;
      }
    });
    onChange(updated);
  };

  const selectAllDays = () => {
    const updated = { ...value };
    DAYS.forEach((day) => {
      updated[day.key] = {
        enabled: true,
        startTime: updated[day.key]?.startTime || "09:00",
        endTime: updated[day.key]?.endTime || "17:00",
      };
    });
    onChange(updated);
  };

  const clearAllDays = () => {
    const updated = { ...value };
    DAYS.forEach((day) => {
      if (updated[day.key]) {
        updated[day.key].enabled = false;
      }
    });
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={selectAllDays}
            className="text-xs text-primary hover:underline"
          >
            Select All
          </button>
          <span className="text-xs text-foreground/30">|</span>
          <button
            type="button"
            onClick={clearAllDays}
            className="text-xs text-primary hover:underline"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Bulk Mode Toggle */}
      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <input
          type="checkbox"
          id="bulk-mode"
          checked={bulkMode}
          onChange={(e) => setBulkMode(e.target.checked)}
          className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
        />
        <label htmlFor="bulk-mode" className="text-sm font-medium text-foreground cursor-pointer">
          Set same hours for all selected days
        </label>
      </div>

      {/* Bulk Time Selection */}
      {bulkMode && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                Start Time
              </label>
              <select
                value={bulkStart}
                onChange={(e) => setBulkStart(e.target.value)}
                className="w-full rounded border border-foreground/20 bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground/70 mb-1">
                End Time
              </label>
              <select
                value={bulkEnd}
                onChange={(e) => setBulkEnd(e.target.value)}
                className="w-full rounded border border-foreground/20 bg-white px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button
            type="button"
            onClick={applyBulkHours}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/90 transition-colors"
          >
            Apply to All Selected Days
          </button>
        </div>
      )}

      {/* Individual Day Settings */}
      <div className="space-y-2">
        {DAYS.map((day) => {
          const dayData = value[day.key] || { enabled: false, startTime: "09:00", endTime: "17:00" };

          return (
            <div
              key={day.key}
              className={`p-3 rounded-lg border transition-colors ${
                dayData.enabled
                  ? "bg-green-50 border-green-200"
                  : "bg-gray-50 border-gray-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`day-${day.key}`}
                  checked={dayData.enabled}
                  onChange={() => handleDayToggle(day.key)}
                  className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-primary/20"
                />
                <label
                  htmlFor={`day-${day.key}`}
                  className="flex-1 text-sm font-medium text-foreground cursor-pointer"
                >
                  {day.label}
                </label>

                {dayData.enabled && !bulkMode && (
                  <div className="flex items-center gap-2">
                    <select
                      value={dayData.startTime}
                      onChange={(e) => handleTimeChange(day.key, "startTime", e.target.value)}
                      className="px-2 py-1 text-xs border border-foreground/20 rounded bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-foreground/50">to</span>
                    <select
                      value={dayData.endTime}
                      onChange={(e) => handleTimeChange(day.key, "endTime", e.target.value)}
                      className="px-2 py-1 text-xs border border-foreground/20 rounded bg-white focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                    >
                      {TIME_OPTIONS.map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-foreground/60">
        Select the days you're available to work and set your hours for each day.
      </p>
    </div>
  );
}
