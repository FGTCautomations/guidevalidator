"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
  addHours,
  setHours,
  setMinutes,
} from "date-fns";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { SupportedLocale } from "@/i18n/config";
import { TimeSlotPicker } from "./time-slot-picker";

interface AvailabilitySlot {
  id: string;
  guide_id: string;
  starts_at: string;
  ends_at: string;
  source: string;
  is_all_day: boolean;
  capacity: number | null;
  created_at: string;
  updated_at: string;
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
  request_message: string | null;
  response_message: string | null;
  expires_at: string;
  created_at: string;
  requester: {
    name: string;
  };
}

interface Props {
  locale: SupportedLocale;
  userId: string;
  userRole: "guide" | "transport";
  initialSlots: AvailabilitySlot[];
  initialHolds: AvailabilityHold[];
}

export function EnhancedAvailabilityCalendar({
  locale,
  userId,
  userRole,
  initialSlots,
  initialHolds,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState(initialSlots);
  const [holds, setHolds] = useState(initialHolds);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createSupabaseBrowserClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get slots for a specific day
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

  // Create availability slot
  const createAvailabilitySlot = async (
    startDate: Date,
    endDate: Date
  ) => {
    setIsLoading(true);
    try {
      const starts_at = startDate.toISOString();
      const ends_at = endDate.toISOString();

      // Check if it's an all-day slot (00:00:00 to 23:59:59)
      const isAllDay =
        startDate.getHours() === 0 &&
        startDate.getMinutes() === 0 &&
        endDate.getHours() === 23 &&
        endDate.getMinutes() === 59;

      const { data, error } = await supabase
        .from("availability_slots")
        .insert({
          guide_id: userId,
          starts_at,
          ends_at,
          source: "manual",
          is_all_day: isAllDay,
          capacity: 1,
        })
        .select()
        .single();

      if (error) throw error;

      setSlots((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error creating availability slot:", error);
      alert("Failed to create availability slot");
    } finally {
      setIsLoading(false);
    }
  };

  // Note: Update is not supported in the current schema
  // Availability slots can only be created or deleted

  // Delete availability slot
  const deleteAvailabilitySlot = async (slotId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase.from("availability_slots").delete().eq("id", slotId);

      if (error) throw error;

      setSlots((prev) => prev.filter((slot) => slot.id !== slotId));
    } catch (error) {
      console.error("Error deleting availability slot:", error);
      alert("Failed to delete availability slot");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle hold response (accept/decline) via API
  const handleHoldResponse = async (holdId: string, action: "accepted" | "declined", message?: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/holds/${holdId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          responseMessage: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to respond to hold");
      }

      // Update holds list
      setHolds((prev) => prev.map((hold) => (hold.id === holdId ? { ...hold, ...data.hold } : hold)));

      // Refresh slots if accepted
      if (action === "accepted") {
        const { data: newSlots } = await supabase
          .from("availability_slots")
          .select("*")
          .eq("guide_id", userId);

        if (newSlots) setSlots(newSlots);
      }

      alert(`Hold ${action} successfully!`);
    } catch (error: any) {
      console.error("Error handling hold:", error);
      alert(error.message || "Failed to respond to hold");
    } finally {
      setIsLoading(false);
    }
  };


  // Auto-refresh holds to check for expiry
  useEffect(() => {
    const interval = setInterval(async () => {
      // Call the auto-expire function
      await supabase.rpc("expire_pending_holds");

      // Refresh holds
      const { data } = await supabase
        .from("availability_holds")
        .select(`
          *,
          requester:profiles!availability_holds_requester_id_fkey(
            id,
            full_name,
            role
          )
        `)
        .eq("target_id", userId);

      if (data) setHolds(data);
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [supabase, userId]);

  return (
    <div className="flex flex-col gap-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            disabled={isLoading}
          >
            ← Previous
          </button>
          <h2 className="text-xl font-semibold">{format(currentDate, "MMMM yyyy")}</h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            disabled={isLoading}
          >
            Next →
          </button>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-200 border rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-200 border rounded"></div>
            <span>Unavailable</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-gray-300 border rounded"></div>
            <span>Blocked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-purple-200 border rounded"></div>
            <span>Has Holds</span>
          </div>
        </div>
      </div>


      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
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

          let bgColor = "bg-white hover:bg-gray-50";

          // Show red if there are blocked times (unavailable)
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
                {dayHolds.length > 0 && (
                  <div className="text-xs text-purple-600 font-medium">
                    {dayHolds.length} hold{dayHolds.length > 1 ? "s" : ""}
                  </div>
                )}
                {daySlots.slice(0, 2).map((slot) => (
                  <div key={slot.id} className="text-xs text-green-700 truncate">
                    {format(new Date(slot.starts_at), "HH:mm")}-{format(new Date(slot.ends_at), "HH:mm")}
                  </div>
                ))}
                {daySlots.length > 2 && (
                  <div className="text-xs text-gray-500">+{daySlots.length - 2} more</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Details Sidebar */}
      {selectedDate && (
        <div className="mt-6 space-y-6">
          {/* Time Slot Picker for Hourly Availability */}
          <TimeSlotPicker
            date={selectedDate}
            existingSlots={slots.map((slot) => ({
              starts_at: slot.starts_at,
              ends_at: slot.ends_at,
              id: slot.id,
            }))}
            onCreateSlot={async (startTime: string, endTime: string) => {
              await createAvailabilitySlot(new Date(startTime), new Date(endTime));
            }}
            onDeleteSlot={deleteAvailabilitySlot}
            isLoading={isLoading}
          />

          {/* Holds for Selected Day */}
          {getHoldsForDate(selectedDate).length > 0 && (
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h4 className="mb-4 font-semibold text-gray-900">Availability Holds</h4>
              <div className="space-y-3">
                {getHoldsForDate(selectedDate).map((hold) => (
                  <div key={hold.id} className="rounded-lg border border-purple-200 bg-purple-50 p-4">
                    <div className="mb-3 flex items-start justify-between">
                      <div>
                        <div className="font-medium text-gray-900">
                          {hold.requester.name || "Unknown"}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          {format(new Date(hold.start_date), "MMM d, yyyy")} -{" "}
                          {format(new Date(hold.end_date), "MMM d, yyyy")}
                        </div>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          hold.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : hold.status === "accepted"
                            ? "bg-green-100 text-green-800"
                            : hold.status === "declined"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {hold.status}
                      </span>
                    </div>

                    {hold.request_message && (
                      <div className="mb-3 rounded bg-white p-3 text-sm text-gray-700">
                        <span className="font-medium">Request: </span>
                        {hold.request_message}
                      </div>
                    )}

                    {hold.status === "pending" && (
                      <>
                        <div className="mb-3 text-xs text-gray-500">
                          Expires: {format(new Date(hold.expires_at), "MMM d, h:mm a")}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleHoldResponse(hold.id, "accepted")}
                            className="flex-1 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isLoading}
                          >
                            Accept Hold
                          </button>
                          <button
                            onClick={() => handleHoldResponse(hold.id, "declined")}
                            className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                            disabled={isLoading}
                          >
                            Decline Hold
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
