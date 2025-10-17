"use client";

import { useState, useCallback } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths, startOfDay, endOfDay } from "date-fns";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { SupportedLocale } from "@/i18n/config";

interface AvailabilitySlot {
  id: string;
  starts_at: string;
  ends_at: string;
  status: "available" | "blocked" | "unavailable";
}

interface Provider {
  id: string;
  email: string;
  role: "guide" | "transport";
  guides?: Array<{
    profile_id: string;
    business_name: string | null;
    hourly_rate_usd: number | null;
    specialties: string[] | null;
  }>;
  organizations?: Array<{
    id: string;
    name: string;
    organization_type: string;
    specialties: string[] | null;
  }>;
  availability_slots: AvailabilitySlot[];
}

interface Props {
  locale: SupportedLocale;
  userId: string;
  userRole: "agency" | "dmc";
  providers: Provider[];
}

interface BookingRequestForm {
  providerId: string;
  providerRole: "guide" | "transport";
  startsAt: string;
  endsAt: string;
  message: string;
}

export function ProviderAvailabilityView({
  locale,
  userId,
  userRole,
  providers,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingForm, setBookingForm] = useState<BookingRequestForm>({
    providerId: "",
    providerRole: "guide",
    startsAt: "",
    endsAt: "",
    message: "",
  });

  const supabase = createSupabaseBrowserClient();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getProviderName = (provider: Provider) => {
    if (provider.role === "guide") {
      return provider.guides?.[0]?.business_name || provider.email;
    }
    return provider.organizations?.[0]?.name || provider.email;
  };

  const getProviderAvailabilityForDate = useCallback((provider: Provider, date: Date) => {
    const dayStart = startOfDay(date).toISOString();
    const dayEnd = endOfDay(date).toISOString();

    return provider.availability_slots.filter(slot => {
      const slotStart = new Date(slot.starts_at);
      const slotEnd = new Date(slot.ends_at);
      return slotStart <= new Date(dayEnd) && slotEnd >= new Date(dayStart);
    });
  }, []);

  const getDayStatus = (provider: Provider, date: Date) => {
    const slots = getProviderAvailabilityForDate(provider, date);
    if (slots.some(slot => slot.status === "available")) return "available";
    if (slots.some(slot => slot.status === "blocked")) return "blocked";
    if (slots.some(slot => slot.status === "unavailable")) return "unavailable";
    return "unset";
  };

  const createBookingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("booking_requests")
        .insert({
          requester_id: userId,
          requester_role: userRole,
          target_id: bookingForm.providerId,
          target_role: bookingForm.providerRole,
          starts_at: new Date(bookingForm.startsAt).toISOString(),
          ends_at: new Date(bookingForm.endsAt).toISOString(),
          message: bookingForm.message || null,
        });

      if (error) throw error;

      alert("Booking request sent successfully!");
      setShowBookingForm(false);
      setBookingForm({
        providerId: "",
        providerRole: "guide",
        startsAt: "",
        endsAt: "",
        message: "",
      });
    } catch (error) {
      console.error("Error creating booking request:", error);
      alert("Failed to send booking request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const initBookingRequest = (provider: Provider, date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    setBookingForm({
      providerId: provider.id,
      providerRole: provider.role,
      startsAt: `${dateStr}T09:00`,
      endsAt: `${dateStr}T17:00`,
      message: "",
    });
    setShowBookingForm(true);
  };

  const filteredProviders = selectedProvider
    ? providers.filter(p => p.id === selectedProvider)
    : providers;

  return (
    <div className="space-y-6">
      {/* Provider Filter */}
      <div className="flex flex-wrap gap-4">
        <select
          value={selectedProvider || ""}
          onChange={(e) => setSelectedProvider(e.target.value || null)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Providers</option>
          {providers.map(provider => (
            <option key={provider.id} value={provider.id}>
              {getProviderName(provider)} ({provider.role})
            </option>
          ))}
        </select>
      </div>

      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
          >
            ← Previous
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
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
        </div>
      </div>

      {/* Providers Calendar Grid */}
      <div className="space-y-8">
        {filteredProviders.map(provider => (
          <div key={provider.id} className="border rounded-lg p-4">
            <div className="mb-4">
              <h3 className="text-lg font-semibold">{getProviderName(provider)}</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Role: {provider.role}</div>
                <div>Email: {provider.email}</div>
                {provider.role === "guide" && provider.guides?.[0]?.hourly_rate_usd && (
                  <div>Rate: ${provider.guides[0].hourly_rate_usd}/hour</div>
                )}
                {provider.role === "guide" && provider.guides?.[0]?.specialties && (
                  <div>Specialties: {provider.guides[0].specialties.join(", ")}</div>
                )}
                {provider.role === "transport" && provider.organizations?.[0]?.specialties && (
                  <div>Services: {provider.organizations[0].specialties.join(", ")}</div>
                )}
              </div>
            </div>

            {/* Calendar Grid for this provider */}
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {daysInMonth.map(day => {
                const status = getDayStatus(provider, day);
                const slots = getProviderAvailabilityForDate(provider, day);

                let bgColor = "bg-white hover:bg-gray-50";
                if (status === "available") bgColor = "bg-green-100 hover:bg-green-200 cursor-pointer";
                if (status === "unavailable") bgColor = "bg-red-100";
                if (status === "blocked") bgColor = "bg-gray-200";

                return (
                  <div
                    key={`${provider.id}-${day.toISOString()}`}
                    className={`
                      min-h-[60px] p-2 border transition-colors
                      ${bgColor}
                      ${isToday(day) ? "ring-2 ring-blue-500" : ""}
                    `}
                    onClick={() => {
                      if (status === "available") {
                        initBookingRequest(provider, day);
                      }
                    }}
                  >
                    <div className="text-sm font-medium">
                      {format(day, "d")}
                    </div>
                    <div className="mt-1 space-y-1">
                      {slots.map(slot => (
                        <div key={slot.id} className="text-xs capitalize">
                          {slot.status === "available" && "✓"}
                          {slot.status === "blocked" && "✗"}
                          {slot.status === "unavailable" && "−"}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Booking Request Modal */}
      {showBookingForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Create Booking Request</h3>

            <form onSubmit={createBookingRequest} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provider
                </label>
                <div className="text-sm text-gray-600">
                  {getProviderName(providers.find(p => p.id === bookingForm.providerId)!)} ({bookingForm.providerRole})
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingForm.startsAt}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, startsAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={bookingForm.endsAt}
                    onChange={(e) => setBookingForm(prev => ({ ...prev, endsAt: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={bookingForm.message}
                  onChange={(e) => setBookingForm(prev => ({ ...prev, message: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Add any additional details..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Request"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowBookingForm(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                  disabled={isLoading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}