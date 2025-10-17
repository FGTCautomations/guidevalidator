"use client";

import { useState, useEffect } from "react";
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, addWeeks, subWeeks, parseISO } from "date-fns";
import { createBrowserClient } from "@supabase/ssr";
import { RequestHoldModal } from "@/components/availability/request-hold-modal";
import { DayAvailabilityDetail } from "@/components/profile/day-availability-detail";
import type { SupportedLocale } from "@/i18n/config";

interface InteractiveAvailabilityCalendarProps {
  providerId: string;
  providerName: string;
  providerRole: "guide" | "transport";
  currentUserId: string;
  currentUserRole: string;
  locale: SupportedLocale;
}

interface AvailabilitySlot {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "available" | "blocked" | "unavailable";
}

export function InteractiveAvailabilityCalendar({
  providerId,
  providerName,
  providerRole,
  currentUserId,
  currentUserRole,
  locale,
}: InteractiveAvailabilityCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availabilitySlots, setAvailabilitySlots] = useState<AvailabilitySlot[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [jumpToDate, setJumpToDate] = useState("");
  const [holdStartTime, setHoldStartTime] = useState<Date | null>(null);
  const [holdEndTime, setHoldEndTime] = useState<Date | null>(null);

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const canRequestHold = currentUserRole === "agency" || currentUserRole === "dmc";

  // Get the week boundaries
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 }); // Saturday
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Fetch availability for the current week
  useEffect(() => {
    if (isExpanded) {
      fetchAvailability();
    }
  }, [currentDate, isExpanded]);

  const fetchAvailability = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("availability_slots")
      .select("id, starts_at, ends_at, status")
      .eq("owner_id", providerId)
      .eq("owner_role", providerRole)
      .gte("starts_at", weekStart.toISOString())
      .lte("ends_at", weekEnd.toISOString())
      .order("starts_at", { ascending: true });

    if (data) {
      setAvailabilitySlots(data as AvailabilitySlot[]);
    }
    setLoading(false);
  };

  const getAvailabilityForDay = (day: Date): "available" | "blocked" | "unavailable" | "unset" => {
    const dayStart = new Date(day);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(day);
    dayEnd.setHours(23, 59, 59, 999);

    const daySlots = availabilitySlots.filter(slot => {
      const slotStart = new Date(slot.starts_at);
      const slotEnd = new Date(slot.ends_at);
      return slotStart <= dayEnd && slotEnd >= dayStart;
    });

    if (daySlots.some(slot => slot.status === "available")) return "available";
    if (daySlots.some(slot => slot.status === "blocked")) return "blocked";
    if (daySlots.some(slot => slot.status === "unavailable")) return "unavailable";
    return "unset";
  };

  const handleDateClick = (day: Date) => {
    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
    if (isPast) return;

    setSelectedDate(day);
    setShowDayDetail(true);
  };

  const handleRequestHoldFromDay = (startTime: Date, endTime: Date) => {
    setHoldStartTime(startTime);
    setHoldEndTime(endTime);
    setShowDayDetail(false);
    setIsModalOpen(true);
  };

  const handleJumpToDate = () => {
    if (!jumpToDate) return;

    try {
      const targetDate = parseISO(jumpToDate);
      setCurrentDate(targetDate);
      setJumpToDate("");
    } catch (error) {
      console.error("Invalid date format");
    }
  };

  const getDayClassName = (day: Date) => {
    const status = getAvailabilityForDay(day);
    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
    const isToday = isSameDay(day, new Date());

    let bgColor = "bg-white";
    let textColor = "text-foreground";
    let borderColor = "border-gray-200";

    if (isPast) {
      textColor = "text-foreground/30";
      bgColor = "bg-gray-50";
    } else {
      switch (status) {
        case "available":
          bgColor = "bg-green-50 hover:bg-green-100 cursor-pointer";
          borderColor = "border-green-300";
          textColor = "text-green-900";
          break;
        case "blocked":
          bgColor = "bg-red-50 hover:bg-red-100 cursor-pointer";
          borderColor = "border-red-300";
          textColor = "text-red-900";
          break;
        case "unavailable":
          bgColor = "bg-gray-100 hover:bg-gray-200 cursor-pointer";
          borderColor = "border-gray-300";
          textColor = "text-gray-600";
          break;
        default:
          bgColor = "bg-white hover:bg-blue-50 cursor-pointer";
          borderColor = "border-gray-200";
      }
    }

    if (isToday) {
      borderColor = "border-blue-500";
      return `${bgColor} ${textColor} border-2 ${borderColor} font-semibold`;
    }

    return `${bgColor} ${textColor} border ${borderColor}`;
  };

  if (!isExpanded) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-foreground/70">
          View the provider's availability calendar to request holds for specific dates.
        </div>
        <button
          onClick={() => setIsExpanded(true)}
          className="w-full px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
        >
          View Availability Calendar
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Week Navigation & Date Picker */}
        <div className="space-y-3">
          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentDate(subWeeks(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Previous week"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="text-center">
              <h3 className="text-lg font-semibold text-foreground">
                {format(weekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
              </h3>
              <p className="text-xs text-foreground/60">Week View</p>
            </div>

            <button
              onClick={() => setCurrentDate(addWeeks(currentDate, 1))}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Next week"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Jump to Date */}
          <div className="flex gap-2">
            <div className="flex-1">
              <input
                type="date"
                value={jumpToDate}
                onChange={(e) => setJumpToDate(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-200"
                placeholder="Jump to date..."
              />
            </div>
            <button
              onClick={handleJumpToDate}
              disabled={!jumpToDate}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Go
            </button>
          </div>

          {/* Quick Jump Buttons */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded-md hover:bg-purple-200 transition-colors"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(addWeeks(new Date(), 1))}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Next Week
            </button>
            <button
              onClick={() => setCurrentDate(addWeeks(new Date(), 2))}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              2 Weeks
            </button>
            <button
              onClick={() => setCurrentDate(addWeeks(new Date(), 4))}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              1 Month
            </button>
          </div>
        </div>

        {/* Week View Grid */}
        <div className="space-y-2">
          {/* Day headers */}
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
              <div key={day} className="text-center text-xs font-semibold text-foreground/60 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Week days */}
          <div className="grid grid-cols-7 gap-2">
            {weekDays.map(day => {
              const dayClassName = getDayClassName(day);
              const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));
              const canClick = !isPast;
              const isToday = isSameDay(day, new Date());

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => canClick && handleDateClick(day)}
                  disabled={!canClick}
                  className={`
                    p-4 rounded-lg transition-all
                    ${dayClassName}
                    ${canClick ? "transform hover:scale-105" : ""}
                  `}
                  title="Click to see hourly availability"
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={`text-2xl ${isToday ? "font-bold" : "font-semibold"}`}>
                      {format(day, "d")}
                    </span>
                    <span className="text-xs text-foreground/60">
                      {format(day, "MMM")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-gray-200">
          <div className="text-xs text-foreground/50">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-green-50 border border-green-300"></span>
                Available
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-red-50 border border-red-300"></span>
                Blocked
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-gray-100 border border-gray-300"></span>
                Unavailable
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-4 h-4 rounded bg-white border border-gray-200"></span>
                Not Set
              </span>
            </div>
          </div>
          <div className="mt-2 text-xs text-purple-600 font-medium">
            💡 Click on any future date to see hourly availability details
          </div>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsExpanded(false)}
          className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
        >
          Collapse Calendar
        </button>
      </div>

      {/* Day Detail Modal */}
      {selectedDate && showDayDetail && (
        <DayAvailabilityDetail
          selectedDate={selectedDate}
          providerId={providerId}
          providerName={providerName}
          providerRole={providerRole}
          currentUserId={currentUserId}
          currentUserRole={currentUserRole}
          locale={locale}
          onClose={() => {
            setShowDayDetail(false);
            setSelectedDate(null);
          }}
          onRequestHold={handleRequestHoldFromDay}
        />
      )}

      {/* Hold Request Modal */}
      {isModalOpen && holdStartTime && holdEndTime && (
        <RequestHoldModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setHoldStartTime(null);
            setHoldEndTime(null);
            setSelectedDate(null);
          }}
          targetId={providerId}
          targetName={providerName}
          targetRole={providerRole}
          requesterId={currentUserId}
          requesterRole={currentUserRole as "agency" | "dmc"}
          locale={locale}
          preselectedStartDate={holdStartTime}
          preselectedEndDate={holdEndTime}
          onSuccess={() => {
            fetchAvailability();
          }}
        />
      )}
    </>
  );
}
