"use client";

import { useState } from "react";
import { format, setHours, setMinutes } from "date-fns";

interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
}

interface TimeSlotPickerProps {
  date: Date;
  existingSlots: Array<{ starts_at: string; ends_at: string; id: string }>;
  onCreateSlot: (startTime: string, endTime: string) => Promise<void>;
  onDeleteSlot: (slotId: string) => Promise<void>;
  isLoading: boolean;
}

export function TimeSlotPicker({
  date,
  existingSlots,
  onCreateSlot,
  onDeleteSlot,
  isLoading,
}: TimeSlotPickerProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [quickSelect, setQuickSelect] = useState<string>("");

  // Generate hourly time options
  const timeOptions: string[] = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      timeOptions.push(timeStr);
    }
  }

  // Quick select presets
  const quickSelectOptions = [
    { label: "Morning (9 AM - 12 PM)", start: "09:00", end: "12:00" },
    { label: "Afternoon (12 PM - 5 PM)", start: "12:00", end: "17:00" },
    { label: "Full Day (9 AM - 5 PM)", start: "09:00", end: "17:00" },
    { label: "Evening (5 PM - 9 PM)", start: "17:00", end: "21:00" },
    { label: "All Day (24 hours)", start: "00:00", end: "23:59" },
  ];

  const handleQuickSelect = (preset: { start: string; end: string }) => {
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  const handleCreateSlot = async () => {
    if (!startTime || !endTime) {
      alert("Please select both start and end times");
      return;
    }

    // Validate that end time is after start time
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      alert("End time must be after start time");
      return;
    }

    // Create ISO datetime strings
    let startDateTime = new Date(date);
    startDateTime = setHours(startDateTime, startHour);
    startDateTime = setMinutes(startDateTime, startMin);

    let endDateTime = new Date(date);
    endDateTime = setHours(endDateTime, endHour);
    endDateTime = setMinutes(endDateTime, endMin);

    await onCreateSlot(startDateTime.toISOString(), endDateTime.toISOString());
  };

  // Get slots for the selected date
  const todaySlots = existingSlots.filter((slot) => {
    const slotDate = new Date(slot.starts_at);
    return (
      slotDate.getDate() === date.getDate() &&
      slotDate.getMonth() === date.getMonth() &&
      slotDate.getFullYear() === date.getFullYear()
    );
  });

  return (
    <div className="space-y-6">
      {/* Date Header */}
      <div className="rounded-lg bg-red-50 p-4">
        <h3 className="font-semibold text-red-900">
          Block Unavailable Times for {format(date, "EEEE, MMMM d, yyyy")}
        </h3>
        <p className="mt-1 text-sm text-red-700">
          Select time slots when you are NOT available
        </p>
      </div>

      {/* Quick Select Presets */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">Quick Select:</label>
        <div className="grid gap-2 sm:grid-cols-2">
          {quickSelectOptions.map((option) => (
            <button
              key={option.label}
              onClick={() => handleQuickSelect(option)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm transition hover:border-blue-500 hover:bg-blue-50"
              disabled={isLoading}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Time Selection */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Start Time */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Start Time <span className="text-red-500">*</span>
          </label>
          <select
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            disabled={isLoading}
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>

        {/* End Time */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            End Time <span className="text-red-500">*</span>
          </label>
          <select
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            disabled={isLoading}
          >
            {timeOptions.map((time) => (
              <option key={time} value={time}>
                {time}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Add Button */}
      <button
        onClick={handleCreateSlot}
        disabled={isLoading}
        className="w-full rounded-lg bg-red-600 px-4 py-3 font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isLoading ? "Blocking..." : "Block This Time"}
      </button>

      {/* Existing Slots */}
      {todaySlots.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Blocked Times (Unavailable):</h4>
          <div className="space-y-2">
            {todaySlots.map((slot) => {
              const start = new Date(slot.starts_at);
              const end = new Date(slot.ends_at);
              const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));

              return (
                <div
                  key={slot.id}
                  className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded bg-red-100 p-2">
                      <svg
                        className="h-5 w-5 text-red-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
                        />
                      </svg>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {format(start, "h:mm a")} - {format(end, "h:mm a")}
                      </div>
                      <div className="text-sm text-gray-500">
                        {duration} hour{duration !== 1 ? "s" : ""} blocked
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => onDeleteSlot(slot.id)}
                    disabled={isLoading}
                    className="rounded-lg bg-green-100 px-3 py-1 text-sm font-medium text-green-700 transition hover:bg-green-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Unblock
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {todaySlots.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">All times available for this date</p>
          <p className="text-xs text-gray-500">Block specific times when you are unavailable</p>
        </div>
      )}

      {/* Help Text */}
      <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
        <h5 className="font-medium text-gray-900">How it works:</h5>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>By default, you are available all day</li>
          <li>Block specific times when you are NOT available</li>
          <li>Agencies and DMCs can only request holds during your available times</li>
          <li>Unblock a time slot to make yourself available again</li>
        </ul>
      </div>
    </div>
  );
}
