import { format, addDays, startOfToday } from "date-fns";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { SupportedLocale } from "@/i18n/config";

interface AvailabilityPreviewProps {
  providerId: string;
  providerRole: "guide" | "transport";
  locale: SupportedLocale;
}

export async function AvailabilityPreview({
  providerId,
  providerRole,
  locale,
}: AvailabilityPreviewProps) {
  const supabase = getSupabaseServerClient();

  // Get next 7 days of availability
  const today = startOfToday();
  const nextWeek = addDays(today, 6);

  const { data: availabilitySlots } = await supabase
    .from("availability_slots")
    .select("starts_at, ends_at, status")
    .eq("owner_id", providerId)
    .eq("owner_role", providerRole)
    .gte("starts_at", today.toISOString())
    .lte("ends_at", nextWeek.toISOString())
    .order("starts_at", { ascending: true });

  // Create array of next 7 days
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i));

  const getAvailabilityForDay = (day: Date) => {
    if (!availabilitySlots) return "unset";

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "available": return "✅";
      case "blocked": return "❌";
      case "unavailable": return "🚫";
      default: return "❓";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available": return "text-green-600";
      case "blocked": return "text-red-600";
      case "unavailable": return "text-gray-500";
      default: return "text-gray-400";
    }
  };

  const hasAvailability = availabilitySlots && availabilitySlots.length > 0;

  return (
    <div className="space-y-3">
      <div className="text-xs text-foreground/60 uppercase tracking-wide font-semibold">
        Next 7 Days
      </div>
      {!hasAvailability && (
        <div className="text-xs text-foreground/50 py-2">
          No availability set. This provider has not configured their calendar yet.
        </div>
      )}
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const status = getAvailabilityForDay(day);
          const isToday = day.toDateString() === today.toDateString();

          return (
            <div
              key={day.toISOString()}
              className={`
                text-center p-2 rounded-lg text-xs
                ${isToday ? "ring-2 ring-blue-500 bg-blue-50" : "bg-gray-50"}
              `}
            >
              <div className="font-semibold text-foreground/80">
                {format(day, "EEE")}
              </div>
              <div className="text-xs text-foreground/60 mb-1">
                {format(day, "dd")}
              </div>
              <div className={`text-lg ${getStatusColor(status)}`}>
                {getStatusIcon(status)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="text-xs text-foreground/50">
        <div className="flex flex-wrap items-center gap-2">
          <span className="flex items-center gap-1">
            <span className="text-green-600">✅</span> Available
          </span>
          <span className="flex items-center gap-1">
            <span className="text-red-600">❌</span> Blocked
          </span>
          <span className="flex items-center gap-1">
            <span className="text-gray-500">🚫</span> Unavailable
          </span>
          <span className="flex items-center gap-1">
            <span className="text-gray-400">❓</span> Not Set
          </span>
        </div>
      </div>
    </div>
  );
}