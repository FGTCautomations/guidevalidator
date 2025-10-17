"use client";

import { useState, useCallback } from "react";
import { format, parseISO, isBefore } from "date-fns";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { SupportedLocale } from "@/i18n/config";

interface Provider {
  id: string;
  email: string;
  role: "guide" | "transport";
  guides?: Array<{
    profile_id: string;
    business_name: string | null;
    hourly_rate_usd: number | null;
  }>;
  organizations?: Array<{
    id: string;
    name: string;
    organization_type: string;
  }>;
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
  target: {
    id: string;
    email: string;
    role: string;
    guides?: Array<{
      business_name: string | null;
    }>;
    organizations?: Array<{
      name: string;
    }>;
  };
}

interface Props {
  locale: SupportedLocale;
  userId: string;
  userRole: "agency" | "dmc";
  availableProviders: Provider[];
  bookingRequests: BookingRequest[];
}

interface NewBookingForm {
  targetId: string;
  targetRole: "guide" | "transport";
  startsAt: string;
  endsAt: string;
  message: string;
}

export function BookingRequestManager({
  locale,
  userId,
  userRole,
  availableProviders,
  bookingRequests: initialRequests,
}: Props) {
  const [requests, setRequests] = useState(initialRequests);
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newBooking, setNewBooking] = useState<NewBookingForm>({
    targetId: "",
    targetRole: "guide",
    startsAt: "",
    endsAt: "",
    message: "",
  });

  const supabase = createSupabaseBrowserClient();

  const createBookingRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("booking_requests")
        .insert({
          requester_id: userId,
          requester_role: userRole,
          target_id: newBooking.targetId,
          target_role: newBooking.targetRole,
          starts_at: new Date(newBooking.startsAt).toISOString(),
          ends_at: new Date(newBooking.endsAt).toISOString(),
          message: newBooking.message || null,
        })
        .select(`
          *,
          target:profiles!booking_requests_target_id_fkey(
            id,
            email,
            role,
            guides(business_name),
            organizations!profiles_organization_id_fkey(name)
          )
        `)
        .single();

      if (error) throw error;

      setRequests(prev => [data, ...prev]);
      setNewBooking({
        targetId: "",
        targetRole: "guide",
        startsAt: "",
        endsAt: "",
        message: "",
      });
      setShowNewRequestForm(false);
    } catch (error) {
      console.error("Error creating booking request:", error);
      alert("Failed to create booking request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const cancelBookingRequest = async (requestId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("booking_requests")
        .delete()
        .eq("id", requestId);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (error) {
      console.error("Error canceling booking request:", error);
      alert("Failed to cancel booking request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getProviderName = (provider: Provider) => {
    if (provider.role === "guide") {
      return provider.guides?.[0]?.business_name || provider.email;
    }
    return provider.organizations?.[0]?.name || provider.email;
  };

  const getRequestTargetName = (request: BookingRequest) => {
    if (request.target_role === "guide") {
      return request.target.guides?.[0]?.business_name || request.target.email;
    }
    return request.target.organizations?.[0]?.name || request.target.email;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "declined": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredProviders = availableProviders.filter(
    provider => provider.role === newBooking.targetRole
  );

  return (
    <div className="space-y-6">
      {/* New Booking Request Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Your Booking Requests</h2>
        <button
          onClick={() => setShowNewRequestForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={isLoading}
        >
          New Booking Request
        </button>
      </div>

      {/* New Booking Request Form */}
      {showNewRequestForm && (
        <div className="p-6 border rounded-lg bg-white shadow-sm">
          <h3 className="text-lg font-medium mb-4">Create New Booking Request</h3>
          <form onSubmit={createBookingRequest} className="space-y-4">
            {/* Provider Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="targetRole"
                    value="guide"
                    checked={newBooking.targetRole === "guide"}
                    onChange={(e) => setNewBooking(prev => ({
                      ...prev,
                      targetRole: e.target.value as "guide" | "transport",
                      targetId: ""
                    }))}
                    className="mr-2"
                  />
                  Guide
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="targetRole"
                    value="transport"
                    checked={newBooking.targetRole === "transport"}
                    onChange={(e) => setNewBooking(prev => ({
                      ...prev,
                      targetRole: e.target.value as "guide" | "transport",
                      targetId: ""
                    }))}
                    className="mr-2"
                  />
                  Transport
                </label>
              </div>
            </div>

            {/* Provider Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select {newBooking.targetRole === "guide" ? "Guide" : "Transport Provider"}
              </label>
              <select
                value={newBooking.targetId}
                onChange={(e) => setNewBooking(prev => ({ ...prev, targetId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select a provider...</option>
                {filteredProviders.map(provider => (
                  <option key={provider.id} value={provider.id}>
                    {getProviderName(provider)}
                    {provider.role === "guide" && provider.guides?.[0]?.hourly_rate_usd && (
                      ` ($${provider.guides[0].hourly_rate_usd}/hr)`
                    )}
                  </option>
                ))}
              </select>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={newBooking.startsAt}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, startsAt: e.target.value }))}
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
                  value={newBooking.endsAt}
                  onChange={(e) => setNewBooking(prev => ({ ...prev, endsAt: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message (Optional)
              </label>
              <textarea
                value={newBooking.message}
                onChange={(e) => setNewBooking(prev => ({ ...prev, message: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Add any additional details or requirements..."
              />
            </div>

            {/* Form Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                disabled={isLoading}
              >
                {isLoading ? "Creating..." : "Send Request"}
              </button>
              <button
                type="button"
                onClick={() => setShowNewRequestForm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                disabled={isLoading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Booking Requests List */}
      <div className="space-y-4">
        {requests.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No booking requests yet. Create your first request above.
          </div>
        ) : (
          requests.map(request => (
            <div key={request.id} className="p-4 border rounded-lg bg-white shadow-sm">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">
                      {getRequestTargetName(request)}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    <span className="text-sm text-gray-500 capitalize">
                      {request.target_role}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <strong>Time:</strong> {format(parseISO(request.starts_at), "PPp")} - {format(parseISO(request.ends_at), "PPp")}
                    </div>
                    <div>
                      <strong>Requested:</strong> {format(parseISO(request.created_at), "PPp")}
                    </div>
                    {request.message && (
                      <div>
                        <strong>Message:</strong> {request.message}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {request.status === "pending" && (
                    <button
                      onClick={() => cancelBookingRequest(request.id)}
                      className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded hover:bg-red-200"
                      disabled={isLoading}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}