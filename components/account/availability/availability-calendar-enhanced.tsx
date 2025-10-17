"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfDay, endOfDay, isBefore, isAfter, isWithinInterval } from "date-fns";
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
  created_at: string;
  expires_at: string;
  responded_at: string | null;
  requester_name?: string;
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
  initialHolds?: AvailabilityHold[];
}

export function AvailabilityCalendarEnhanced({
  locale,
  userId,
  userRole,
  initialSlots,
  pendingRequests,
  initialHolds = [],
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [slots, setSlots] = useState(initialSlots);
  const [requests, setRequests] = useState(pendingRequests);
  const [holds, setHolds] = useState<AvailabilityHold[]>(initialHolds);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Drag-to-create state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Date | null>(null);
  const [dragEnd, setDragEnd] = useState<Date | null>(null);
  const [dragMode, setDragMode] = useState<"available" | "unavailable">("available");

  const supabase = createSupabaseBrowserClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Fetch holds on mount and when month changes
  useEffect(() => {
    fetchHolds();
  }, [currentDate]);

  const fetchHolds = async () => {
    try {
      const { data, error } = await supabase
        .from("availability_holds")
        .select(`
          *,
          requester:agencies!availability_holds_requester_id_fkey(name)
        `)
        .eq("holdee_id", userId)
        .in("status", ["pending", "accepted"])
        .gte("end_date", format(monthStart, "yyyy-MM-dd"))
        .lte("start_date", format(monthEnd, "yyyy-MM-dd"));

      if (error) throw error;

      const holdsWithNames = (data || []).map((hold: any) => ({
        ...hold,
        requester_name: hold.requester?.name || "Unknown",
      }));

      setHolds(holdsWithNames);
    } catch (error) {
      console.error("Error fetching holds:", error);
    }
  };

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

  // Get holds for a specific day
  const getHoldsForDate = useCallback((date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return holds.filter(hold => {
      return dateStr >= hold.start_date && dateStr <= hold.end_date;
    });
  }, [holds]);

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

  // Drag handlers
  const handleMouseDown = (date: Date, mode: "available" | "unavailable") => {
    setIsDragging(true);
    setDragStart(date);
    setDragEnd(date);
    setDragMode(mode);
  };

  const handleMouseEnter = (date: Date) => {
    if (isDragging && dragStart) {
      setDragEnd(date);
    }
  };

  const handleMouseUp = async () => {
    if (isDragging && dragStart && dragEnd) {
      const start = isBefore(dragStart, dragEnd) ? dragStart : dragEnd;
      const end = isAfter(dragStart, dragEnd) ? dragStart : dragEnd;

      await createBulkAvailabilitySlots(start, end, dragMode);
    }

    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const createBulkAvailabilitySlots = async (
    startDate: Date,
    endDate: Date,
    status: "available" | "unavailable"
  ) => {
    setIsLoading(true);
    try {
      const days = eachDayOfInterval({ start: startDate, end: endDate });

      const newSlots = days.map(day => ({
        owner_id: userId,
        owner_role: userRole,
        starts_at: startOfDay(day).toISOString(),
        ends_at: endOfDay(day).toISOString(),
        status,
      }));

      const { data, error } = await supabase
        .from("availability_slots")
        .insert(newSlots)
        .select();

      if (error) throw error;

      if (data) {
        setSlots(prev => [...prev, ...data]);
      }
    } catch (error) {
      console.error("Error creating bulk availability slots:", error);
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleHoldResponse = async (
    holdId: string,
    action: "accepted" | "declined",
    message?: string
  ) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("availability_holds")
        .update({
          status: action,
          response_message: message || null,
          responded_at: new Date().toISOString(),
        })
        .eq("id", holdId)
        .select()
        .single();

      if (error) throw error;

      setHolds(prev => prev.map(h => h.id === holdId ? { ...data, requester_name: h.requester_name } : h));

      // If accepted, create blocked slots for the date range
      if (action === "accepted") {
        const hold = holds.find(h => h.id === holdId);
        if (hold) {
          const days = eachDayOfInterval({
            start: new Date(hold.start_date),
            end: new Date(hold.end_date),
          });

          const newSlots = days.map(day => ({
            owner_id: userId,
            owner_role: userRole,
            starts_at: startOfDay(day).toISOString(),
            ends_at: endOfDay(day).toISOString(),
            status: "blocked" as const,
          }));

          const { data: slotsData } = await supabase
            .from("availability_slots")
            .insert(newSlots)
            .select();

          if (slotsData) {
            setSlots(prev => [...prev, ...slotsData]);
          }
        }
      }
    } catch (error) {
      console.error("Error responding to hold:", error);
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
    const dayHolds = getHoldsForDate(date);

    if (dayRequests.some(req => req.status === "pending")) return "has-requests";
    if (dayHolds.some(h => h.status === "pending")) return "has-pending-hold";
    if (dayHolds.some(h => h.status === "accepted")) return "has-accepted-hold";
    if (daySlots.some(slot => slot.status === "blocked")) return "blocked";
    if (daySlots.some(slot => slot.status === "available")) return "available";
    if (daySlots.some(slot => slot.status === "unavailable")) return "unavailable";
    return "unset";
  };

  const isDateInDragRange = (date: Date) => {
    if (!isDragging || !dragStart || !dragEnd) return false;
    const start = isBefore(dragStart, dragEnd) ? dragStart : dragEnd;
    const end = isAfter(dragStart, dragEnd) ? dragStart : dragEnd;
    return isWithinInterval(date, { start, end });
  };

  return (
    <div className="flex flex-col gap-6" onMouseUp={handleMouseUp} onMouseLeave={handleMouseUp}>
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
            <span>Requests</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-200 border rounded"></div>
            <span>Hold</span>
          </div>
        </div>
      </div>

      {/* Drag Mode Selection */}
      <div className="flex items-center gap-4 p-3 bg-blue-50 border border-blue-200 rounded">
        <span className="text-sm font-medium">Drag to create:</span>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="dragMode"
            checked={dragMode === "available"}
            onChange={() => setDragMode("available")}
            className="cursor-pointer"
          />
          <span className="text-sm">Available dates</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="dragMode"
            checked={dragMode === "unavailable"}
            onChange={() => setDragMode("unavailable")}
            className="cursor-pointer"
          />
          <span className="text-sm">Unavailable dates</span>
        </label>
        <span className="text-xs text-gray-600 ml-auto">
          Click and drag across dates to set bulk availability
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 select-none">
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
          const dayHolds = getHoldsForDate(day);
          const inDragRange = isDateInDragRange(day);

          let bgColor = "bg-white hover:bg-gray-50";
          if (status === "available") bgColor = "bg-green-100 hover:bg-green-200";
          if (status === "unavailable") bgColor = "bg-red-100 hover:bg-red-200";
          if (status === "blocked") bgColor = "bg-gray-200 hover:bg-gray-300";
          if (status === "has-requests") bgColor = "bg-yellow-100 hover:bg-yellow-200";
          if (status === "has-pending-hold") bgColor = "bg-blue-100 hover:bg-blue-200";
          if (status === "has-accepted-hold") bgColor = "bg-blue-200 hover:bg-blue-300";

          if (inDragRange) {
            bgColor = dragMode === "available"
              ? "bg-green-300 border-green-500"
              : "bg-red-300 border-red-500";
          }

          return (
            <div
              key={day.toISOString()}
              className={`
                min-h-[80px] p-2 border cursor-pointer transition-colors
                ${bgColor}
                ${isToday(day) ? "ring-2 ring-blue-500" : ""}
                ${selectedDate && isSameDay(day, selectedDate) ? "ring-2 ring-purple-500" : ""}
              `}
              onMouseDown={() => handleMouseDown(day, dragMode)}
              onMouseEnter={() => handleMouseEnter(day)}
              onClick={() => setSelectedDate(day)}
            >
              <div className="text-sm font-medium">
                {format(day, "d")}
              </div>
              <div className="mt-1 space-y-1">
                {dayHolds.length > 0 && (
                  <div className="text-xs text-blue-600 font-medium">
                    {dayHolds.length} hold{dayHolds.length > 1 ? "s" : ""}
                  </div>
                )}
                {dayRequests.length > 0 && (
                  <div className="text-xs text-orange-600">
                    {dayRequests.length} request{dayRequests.length > 1 ? "s" : ""}
                  </div>
                )}
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
            {/* Availability Holds for Selected Day */}
            {getHoldsForDate(selectedDate).map(hold => (
              <div key={hold.id} className={`p-3 border rounded ${
                hold.status === "pending" ? "bg-blue-50 border-blue-200" :
                hold.status === "accepted" ? "bg-blue-100 border-blue-300" :
                "bg-gray-50 border-gray-200"
              }`}>
                <div className="font-medium">
                  Availability Hold {hold.status === "pending" ? "(Pending Response)" : `(${hold.status})`}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  From: {hold.requester_name} ({hold.requester_type})
                </div>
                <div className="text-sm text-gray-600">
                  Dates: {format(new Date(hold.start_date), "MMM d")} - {format(new Date(hold.end_date), "MMM d")}
                </div>
                <div className="text-sm text-gray-600">
                  Expires: {format(new Date(hold.expires_at), "MMM d, HH:mm")}
                </div>
                {hold.request_message && (
                  <div className="text-sm text-gray-700 mt-2 p-2 bg-white rounded">
                    Message: {hold.request_message}
                  </div>
                )}
                {hold.status === "pending" && (
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleHoldResponse(hold.id, "accepted")}
                      className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      disabled={isLoading}
                    >
                      Accept Hold
                    </button>
                    <button
                      onClick={() => handleHoldResponse(hold.id, "declined")}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      disabled={isLoading}
                    >
                      Decline Hold
                    </button>
                  </div>
                )}
                {hold.response_message && (
                  <div className="text-sm text-gray-700 mt-2 p-2 bg-white rounded">
                    Your response: {hold.response_message}
                  </div>
                )}
              </div>
            ))}

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
