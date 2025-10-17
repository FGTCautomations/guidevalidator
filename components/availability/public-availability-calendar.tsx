"use client";

import { useState, useCallback } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  startOfDay,
  endOfDay,
} from "date-fns";
import { RequestHoldButton } from "./request-hold-button";
import type { SupportedLocale } from "@/i18n/config";

interface AvailabilitySlot {
  id: string;
  guide_id: string;
  starts_at: string;
  ends_at: string;
  source: string;
  is_all_day: boolean;
  capacity: number | null;
}

interface AvailabilityHold {
  id: string;
  holdee_id: string;
  holdee_type: string;
  requester_id: string;
  requester_type: string;
  start_date: string;
  end_date: string;
  status: "pending" | "accepted" | "declined" | "expired" | "cancelled";
}

interface Props {
  targetId: string;
  targetName: string;
  targetRole: "guide" | "transport";
  initialSlots: AvailabilitySlot[];
  initialHolds: AvailabilityHold[];
  currentUserId?: string; // Agency/DMC user viewing the calendar
  currentUserRole?: string;
  locale: SupportedLocale;
}

export function PublicAvailabilityCalendar({
  targetId,
  targetName,
  targetRole,
  initialSlots,
  initialHolds,
  currentUserId,
  currentUserRole,
  locale,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots] = useState(initialSlots);
  const [holds] = useState(initialHolds);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get slots for a specific day (blocked times)
  const getSlotsForDate = useCallback(
    (date: Date) => {
      const dayStart = startOfDay(date).toISOString();
      const dayEnd = endOfDay(date).toISOString();

      return slots.filter((slot) => {
        const slotStart = new Date(slot.starts_at);
        const slotEnd = new Date(slot.ends_at);
        return slotStart <= new Date(dayEnd) && slotEnd >= new Date(dayStart);
      });
    },
    [slots]
  );

  // Get holds for a specific day
  const getHoldsForDate = useCallback(
    (date: Date) => {
      const dateStr = format(date, "yyyy-MM-dd");
      return holds.filter((hold) => {
        return dateStr >= hold.start_date && dateStr <= hold.end_date;
      });
    },
    [holds]
  );

  // Check if user can request hold (agency/dmc/transport)
  const canRequestHold = currentUserId && ["agency", "dmc", "transport"].includes(currentUserRole || "");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-lg border bg-white p-6 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900">
          {targetName}'s Availability Calendar
        </h2>
        <p className="mt-2 text-sm text-gray-600">
          View available and blocked times. Green indicates available, red indicates unavailable.
        </p>
      </div>

      {/* Month Navigation */}
      <div className="flex items-center justify-between rounded-lg border bg-white p-4 shadow-sm">
        <button
          onClick={() => setCurrentDate(subMonths(currentDate, 1))}
          className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
        >
          ← Previous
        </button>
        <h3 className="text-lg font-semibold">{format(currentDate, "MMMM yyyy")}</h3>
        <button
          onClick={() => setCurrentDate(addMonths(currentDate, 1))}
          className="rounded-lg border px-4 py-2 transition hover:bg-gray-50"
        >
          Next →
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 rounded-lg border bg-white p-4 text-sm shadow-sm">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border bg-white"></div>
          <span>Available (All Day)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-red-50"></div>
          <span>Partially/Fully Blocked</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded bg-purple-100"></div>
          <span>Has Holds</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 rounded border-2 border-blue-500"></div>
          <span>Today</span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 rounded-lg border bg-white p-4 shadow-sm">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {daysInMonth.map((day) => {
          const dayHolds = getHoldsForDate(day);
          const daySlots = getSlotsForDate(day);

          let bgColor = "bg-green-50 hover:bg-green-100"; // Available by default

          // Show red if there are blocked times
          if (daySlots.length > 0) bgColor = "bg-red-50 hover:bg-red-100";

          // Show purple if there are holds
          if (dayHolds.length > 0) bgColor = "bg-purple-100 hover:bg-purple-200";

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[80px] p-2 border cursor-pointer transition-colors
                ${bgColor}
                ${isToday(day) ? "ring-2 ring-blue-500" : ""}
                ${selectedDate && isSameDay(day, selectedDate) ? "ring-2 ring-purple-500" : ""}
              `}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-sm font-medium">{format(day, "d")}</div>
              <div className="mt-1 space-y-1">
                {daySlots.length > 0 && (
                  <div className="text-xs text-red-600 font-medium">
                    {daySlots.length} blocked
                  </div>
                )}
                {dayHolds.length > 0 && (
                  <div className="text-xs text-purple-600 font-medium">
                    {dayHolds.length} hold{dayHolds.length > 1 ? "s" : ""}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Details */}
      {selectedDate && (
        <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold">{format(selectedDate, "EEEE, MMMM d, yyyy")}</h3>

          {/* Blocked Times */}
          {getSlotsForDate(selectedDate).length > 0 ? (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900">Blocked Times (Unavailable):</h4>
              <div className="space-y-2">
                {getSlotsForDate(selectedDate).map((slot) => {
                  const start = new Date(slot.starts_at);
                  const end = new Date(slot.ends_at);

                  return (
                    <div
                      key={slot.id}
                      className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-3"
                    >
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
                        <div className="text-sm text-gray-500">Not available during this time</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-green-300 bg-green-50 p-6 text-center">
              <svg
                className="mx-auto h-12 w-12 text-green-400"
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
              <p className="mt-2 text-sm font-medium text-green-900">Available All Day</p>
              <p className="text-xs text-green-700">No blocked times for this date</p>
            </div>
          )}

          {/* Request Hold Button */}
          {canRequestHold && currentUserId && currentUserRole && getSlotsForDate(selectedDate).length === 0 && (
            <div className="pt-4 border-t">
              <RequestHoldButton
                targetId={targetId}
                targetName={targetName}
                targetRole={targetRole}
                currentUserId={currentUserId}
                currentUserRole={currentUserRole}
                locale={locale}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
