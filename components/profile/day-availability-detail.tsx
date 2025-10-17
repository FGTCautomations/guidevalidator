"use client";

import { useState, useEffect } from "react";
import { format, setHours, setMinutes, isSameHour, parseISO, addHours } from "date-fns";
import { createBrowserClient } from "@supabase/ssr";
import type { SupportedLocale } from "@/i18n/config";

interface DayAvailabilityDetailProps {
  selectedDate: Date;
  providerId: string;
  providerName: string;
  providerRole: "guide" | "transport";
  currentUserId: string;
  currentUserRole: string;
  locale: SupportedLocale;
  onClose: () => void;
  onRequestHold: (startTime: Date, endTime: Date) => void;
}

interface TimeSlot {
  hour: number;
  status: "available" | "blocked" | "unavailable" | "unset";
  slots: AvailabilitySlot[];
}

interface AvailabilitySlot {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "available" | "blocked" | "unavailable";
}

export function DayAvailabilityDetail({
  selectedDate,
  providerId,
  providerName,
  providerRole,
  currentUserId,
  currentUserRole,
  locale,
  onClose,
  onRequestHold,
}: DayAvailabilityDetailProps) {
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStartHour, setSelectedStartHour] = useState<number | null>(null);
  const [selectedEndHour, setSelectedEndHour] = useState<number | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const canRequestHold = currentUserRole === "agency" || currentUserRole === "dmc";

  // Generate hours 6 AM to 10 PM (business hours)
  const hours = Array.from({ length: 17 }, (_, i) => i + 6); // 6-22 (6 AM - 10 PM)

  useEffect(() => {
    fetchDayAvailability();
  }, [selectedDate]);

  const fetchDayAvailability = async () => {
    setLoading(true);

    const dayStart = new Date(selectedDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(selectedDate);
    dayEnd.setHours(23, 59, 59, 999);

    const { data } = await supabase
      .from("availability_slots")
      .select("id, starts_at, ends_at, status")
      .eq("owner_id", providerId)
      .eq("owner_role", providerRole)
      .lte("starts_at", dayEnd.toISOString())
      .gte("ends_at", dayStart.toISOString())
      .order("starts_at", { ascending: true });

    if (data) {
      setAvailabilitySlots(data as AvailabilitySlot[]);
    }
    setLoading(false);
  };

  const getHourStatus = (hour: number): "available" | "blocked" | "unavailable" | "unset" => {
    const hourStart = setHours(setMinutes(selectedDate, 0), hour);
    const hourEnd = addHours(hourStart, 1);

    const overlappingSlots = availabilitySlots.filter(slot => {
      const slotStart = parseISO(slot.starts_at);
      const slotEnd = parseISO(slot.ends_at);

      // Check if slot overlaps with this hour
      return slotStart < hourEnd && slotEnd > hourStart;
    });

    if (overlappingSlots.length === 0) return "unset";

    // Priority: blocked > unavailable > available
    if (overlappingSlots.some(s => s.status === "blocked")) return "blocked";
    if (overlappingSlots.some(s => s.status === "unavailable")) return "unavailable";
    if (overlappingSlots.some(s => s.status === "available")) return "available";

    return "unset";
  };

  const handleHourClick = (hour: number) => {
    if (!canRequestHold) return;

    const status = getHourStatus(hour);
    if (status === "blocked") return; // Can't request blocked times

    if (selectedStartHour === null) {
      setSelectedStartHour(hour);
      setSelectedEndHour(hour + 1);
    } else if (selectedEndHour === null) {
      if (hour >= selectedStartHour) {
        setSelectedEndHour(hour + 1);
      } else {
        setSelectedStartHour(hour);
        setSelectedEndHour(selectedStartHour + 1);
      }
    } else {
      // Reset selection
      setSelectedStartHour(hour);
      setSelectedEndHour(hour + 1);
    }
  };

  const handleRequestHold = () => {
    if (selectedStartHour === null || selectedEndHour === null) return;

    const startTime = setHours(setMinutes(selectedDate, 0), selectedStartHour);
    const endTime = setHours(setMinutes(selectedDate, 0), selectedEndHour);

    onRequestHold(startTime, endTime);
  };

  const getHourClassName = (hour: number) => {
    const status = getHourStatus(hour);
    const isSelected = selectedStartHour !== null && selectedEndHour !== null &&
                       hour >= selectedStartHour && hour < selectedEndHour;

    let bgColor = "bg-white";
    let borderColor = "border-gray-200";
    let textColor = "text-foreground";

    if (isSelected) {
      bgColor = "bg-purple-100";
      borderColor = "border-purple-400";
    } else {
      switch (status) {
        case "available":
          bgColor = canRequestHold ? "bg-green-50 hover:bg-green-100 cursor-pointer" : "bg-green-50";
          borderColor = "border-green-300";
          textColor = "text-green-900";
          break;
        case "blocked":
          bgColor = "bg-red-50";
          borderColor = "border-red-300";
          textColor = "text-red-900";
          break;
        case "unavailable":
          bgColor = "bg-gray-100";
          borderColor = "border-gray-300";
          textColor = "text-gray-600";
          break;
        default:
          bgColor = canRequestHold ? "bg-white hover:bg-blue-50 cursor-pointer" : "bg-white";
          borderColor = "border-gray-200";
      }
    }

    return `${bgColor} ${borderColor} ${textColor} border-2 rounded-lg p-3 transition-all`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </h2>
            <p className="text-sm text-foreground/60">{providerName}'s Availability</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-foreground/60">Loading availability...</div>
          </div>
        ) : (
          <>
            {/* Time slots grid */}
            <div className="space-y-2 mb-4">
              <div className="text-sm font-medium text-foreground/70 mb-3">
                {canRequestHold ? "Click hours to select a time range for your hold request" : "Hourly Availability"}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {hours.map(hour => {
                  const status = getHourStatus(hour);
                  const hourClassName = getHourClassName(hour);
                  const isPast = new Date(selectedDate).setHours(hour, 0, 0, 0) < new Date().getTime();

                  return (
                    <button
                      key={hour}
                      onClick={() => !isPast && handleHourClick(hour)}
                      disabled={isPast || !canRequestHold}
                      className={hourClassName}
                      title={status === "blocked" ? "Blocked - Not available" : status}
                    >
                      <div className="flex flex-col items-center">
                        <span className="font-semibold">
                          {format(setHours(new Date(), hour), "h a")}
                        </span>
                        {status === "blocked" && (
                          <span className="text-xs mt-1">🚫 Blocked</span>
                        )}
                        {status === "unavailable" && (
                          <span className="text-xs mt-1">Unavailable</span>
                        )}
                        {status === "available" && (
                          <span className="text-xs mt-1 text-green-600">✓ Available</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-xs text-foreground/60 mb-2 font-medium">Legend:</div>
              <div className="flex flex-wrap gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-green-50 border-2 border-green-300"></span>
                  Available
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-red-50 border-2 border-red-300"></span>
                  Blocked
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-gray-100 border-2 border-gray-300"></span>
                  Unavailable
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-white border-2 border-gray-200"></span>
                  Not Set
                </span>
                {canRequestHold && (
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-purple-100 border-2 border-purple-400"></span>
                    Selected
                  </span>
                )}
              </div>
            </div>

            {/* Selected time display & action buttons */}
            {canRequestHold && (
              <div className="border-t pt-4">
                {selectedStartHour !== null && selectedEndHour !== null ? (
                  <div className="space-y-3">
                    <div className="text-sm text-foreground/70">
                      <span className="font-medium">Selected time:</span>{" "}
                      {format(setHours(selectedDate, selectedStartHour), "h:mm a")} -{" "}
                      {format(setHours(selectedDate, selectedEndHour), "h:mm a")}
                      <span className="ml-2 text-foreground/50">
                        ({selectedEndHour - selectedStartHour} hour{selectedEndHour - selectedStartHour !== 1 ? 's' : ''})
                      </span>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          setSelectedStartHour(null);
                          setSelectedEndHour(null);
                        }}
                        className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        Clear Selection
                      </button>
                      <button
                        onClick={handleRequestHold}
                        className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        Request Hold for This Time
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-foreground/50 text-center py-2">
                    Click on hour(s) above to select a time range
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
