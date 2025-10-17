"use client";

import { useState, useCallback, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfDay, endOfDay } from "date-fns";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { SupportedLocale } from "@/i18n/config";

interface AvailabilitySlot {
  id: string;
  owner_id: string;
  owner_role: string;
  starts_at: string;
  ends_at: string;
  status: "available" | "blocked" | "unavailable";
  created_at: string;
  updated_at: string;
}

interface BookingRequest {
  id: string;
  requester_id: string;
  requester_role: string;
  target_id: string;
  target_role: string;
  job_id: string | null;
  starts_at: string;
  ends_at: string;
  status: "pending" | "accepted" | "declined" | "expired";
  message: string | null;
  created_at: string;
  updated_at: string;
  requester: {
    id: string;
    email: string;
    role: string;
  };
}

interface Props {
  locale: SupportedLocale;
  userId: string;
  userRole: "guide" | "transport";
  initialSlots: AvailabilitySlot[];
  pendingRequests: BookingRequest[];
}

export function AvailabilityCalendar({
  locale,
  userId,
  userRole,
  initialSlots,
  pendingRequests,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState(initialSlots);
  const [requests, setRequests] = useState(pendingRequests);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const supabase = createSupabaseBrowserClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get slots for a specific day
  const getSlotsForDate = useCallback((date: Date) => {
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();

    return slots.filter(slot => {
      const slotStart = new Date(slot.starts_at);
      const slotEnd = new Date(slot.ends_at);
      return slotStart <= new Date(dayEnd) && slotEnd >= new Date(dayStart);
    });
  }, [slots]);

  // Get booking requests for a specific day
  const getRequestsForDate = useCallback((date: Date) => {
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();

    return requests.filter(request => {
      const requestStart = new Date(request.starts_at);
      const requestEnd = new Date(request.ends_at);
      return requestStart <= new Date(dayEnd) && requestEnd >= new Date(dayStart);
    });
  }, [requests]);

  const createAvailabilitySlot = async (date: Date, status: "available" | "blocked" | "unavailable") => {
    setIsLoading(true);
    try {
      const starts_at = startOfDay(date).toISOString();
      const ends_at = endOfDay(date).toISOString();

      const { data, error } = await supabase
        .from("availability_slots")
        .insert({
          owner_id: userId,
          owner_role: userRole,
          starts_at,
          ends_at,
          status,
        })
        .select()
        .single();

      if (error) throw error;

      setSlots(prev => [...prev, data]);
    } catch (error) {
      console.error("Error creating availability slot:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateAvailabilitySlot = async (slotId: string, status: "available" | "blocked" | "unavailable") => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("availability_slots")
        .update({ status })
        .eq("id", slotId)
        .select()
        .single();

      if (error) throw error;

      setSlots(prev => prev.map(slot => slot.id === slotId ? data : slot));
    } catch (error) {
      console.error("Error updating availability slot:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAvailabilitySlot = async (slotId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("availability_slots")
        .delete()
        .eq("id", slotId);

      if (error) throw error;

      setSlots(prev => prev.filter(slot => slot.id !== slotId));
    } catch (error) {
      console.error("Error deleting availability slot:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingRequest = async (requestId: string, action: "accepted" | "declined") => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("booking_requests")
        .update({ status: action })
        .eq("id", requestId)
        .select(`
          *,
          requester:profiles!booking_requests_requester_id_fkey(
            id,
            email,
            role
          )
        `)
        .single();

      if (error) throw error;

      setRequests(prev => prev.map(req => req.id === requestId ? data : req));

      // If accepted, create a blocked availability slot
      if (action === "accepted") {
        const request = requests.find(r => r.id === requestId);
        if (request) {
          await supabase
            .from("availability_slots")
            .insert({
              owner_id: userId,
              owner_role: userRole,
              starts_at: request.starts_at,
              ends_at: request.ends_at,
              status: "blocked",
            });

          // Refresh slots
          const { data: newSlots } = await supabase
            .from("availability_slots")
            .select("*")
            .eq("owner_id", userId)
            .eq("owner_role", userRole);

          if (newSlots) setSlots(newSlots);
        }
      }
    } catch (error) {
      console.error("Error handling booking request:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayStatus = (date: Date) => {
    const daySlots = getSlotsForDate(date);
    const dayRequests = getRequestsForDate(date);

    if (dayRequests.some(req => req.status === "pending")) return "has-requests";
    if (daySlots.some(slot => slot.status === "blocked")) return "blocked";
    if (daySlots.some(slot => slot.status === "available")) return "available";
    if (daySlots.some(slot => slot.status === "unavailable")) return "unavailable";
    return "unset";
  };

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
          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
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
            <div className="w-3 h-3 bg-yellow-200 border rounded"></div>
            <span>Has Requests</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {daysInMonth.map(day => {
          const status = getDayStatus(day);
          const dayRequests = getRequestsForDate(day);
          const daySlots = getSlotsForDate(day);

          let bgColor = "bg-white hover:bg-gray-50";
          if (status === "available") bgColor = "bg-green-100 hover:bg-green-200";
          if (status === "unavailable") bgColor = "bg-red-100 hover:bg-red-200";
          if (status === "blocked") bgColor = "bg-gray-200 hover:bg-gray-300";
          if (status === "has-requests") bgColor = "bg-yellow-100 hover:bg-yellow-200";

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
              <div className="text-sm font-medium">
                {format(day, "d")}
              </div>
              <div className="mt-1 space-y-1">
                {dayRequests.length > 0 && (
                  <div className="text-xs text-orange-600">
                    {dayRequests.length} request{dayRequests.length > 1 ? "s" : ""}
                  </div>
                )}
                {daySlots.map(slot => (
                  <div key={slot.id} className="text-xs capitalize">
                    {slot.status}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Details Sidebar */}
      {selectedDate && (
        <div className="mt-6 p-4 border rounded-lg bg-white">
          <h3 className="text-lg font-semibold mb-4">
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </h3>

          <div className="space-y-4">
            {/* Availability Actions */}
            <div className="space-y-2">
              <h4 className="font-medium">Set Availability:</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => createAvailabilitySlot(selectedDate, "available")}
                  className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                  disabled={isLoading}
                >
                  Mark Available
                </button>
                <button
                  onClick={() => createAvailabilitySlot(selectedDate, "unavailable")}
                  className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                  disabled={isLoading}
                >
                  Mark Unavailable
                </button>
              </div>
            </div>

            {/* Current Slots */}
            {getSlotsForDate(selectedDate).map(slot => (
              <div key={slot.id} className="p-3 border rounded">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium capitalize">{slot.status}</div>
                    <div className="text-sm text-gray-600">
                      {format(new Date(slot.starts_at), "HH:mm")} -
                      {format(new Date(slot.ends_at), "HH:mm")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {slot.status !== "available" && (
                      <button
                        onClick={() => updateAvailabilitySlot(slot.id, "available")}
                        className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200"
                        disabled={isLoading}
                      >
                        Available
                      </button>
                    )}
                    {slot.status !== "unavailable" && (
                      <button
                        onClick={() => updateAvailabilitySlot(slot.id, "unavailable")}
                        className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded hover:bg-red-200"
                        disabled={isLoading}
                      >
                        Unavailable
                      </button>
                    )}
                    <button
                      onClick={() => deleteAvailabilitySlot(slot.id)}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded hover:bg-gray-200"
                      disabled={isLoading}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {/* Booking Requests for Selected Day */}
            {getRequestsForDate(selectedDate).map(request => (
              <div key={request.id} className="p-3 border rounded bg-yellow-50">
                <div className="font-medium">Booking Request</div>
                <div className="text-sm text-gray-600 mt-1">
                  From: {request.requester.email} ({request.requester.role})
                </div>
                <div className="text-sm text-gray-600">
                  Time: {format(new Date(request.starts_at), "HH:mm")} -
                  {format(new Date(request.ends_at), "HH:mm")}
                </div>
                {request.message && (
                  <div className="text-sm text-gray-600 mt-2">
                    Message: {request.message}
                  </div>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleBookingRequest(request.id, "accepted")}
                    className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded hover:bg-green-200"
                    disabled={isLoading || request.status !== "pending"}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleBookingRequest(request.id, "declined")}
                    className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                    disabled={isLoading || request.status !== "pending"}
                  >
                    Decline
                  </button>
                </div>
                {request.status !== "pending" && (
                  <div className="text-sm mt-2 font-medium capitalize">
                    Status: {request.status}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}