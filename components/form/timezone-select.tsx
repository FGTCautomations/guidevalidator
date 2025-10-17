"use client";

interface TimezoneSelectProps {
  value: string;
  onChange: (value: string) => void;
  label: string;
  required?: boolean;
  id?: string;
}

const TIMEZONES = [
  { value: "UTC", label: "UTC (GMT+0:00)" },
  { value: "Pacific/Midway", label: "Midway Island (GMT-11:00)" },
  { value: "Pacific/Honolulu", label: "Hawaii (GMT-10:00)" },
  { value: "America/Anchorage", label: "Alaska (GMT-09:00)" },
  { value: "America/Los_Angeles", label: "Pacific Time (US & Canada) (GMT-08:00)" },
  { value: "America/Phoenix", label: "Arizona (GMT-07:00)" },
  { value: "America/Denver", label: "Mountain Time (US & Canada) (GMT-07:00)" },
  { value: "America/Chicago", label: "Central Time (US & Canada) (GMT-06:00)" },
  { value: "America/Mexico_City", label: "Mexico City (GMT-06:00)" },
  { value: "America/New_York", label: "Eastern Time (US & Canada) (GMT-05:00)" },
  { value: "America/Bogota", label: "Bogota, Lima, Quito (GMT-05:00)" },
  { value: "America/Caracas", label: "Caracas (GMT-04:00)" },
  { value: "America/Halifax", label: "Atlantic Time (Canada) (GMT-04:00)" },
  { value: "America/Santiago", label: "Santiago (GMT-04:00)" },
  { value: "America/St_Johns", label: "Newfoundland (GMT-03:30)" },
  { value: "America/Sao_Paulo", label: "Brasilia (GMT-03:00)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (GMT-03:00)" },
  { value: "Atlantic/South_Georgia", label: "Mid-Atlantic (GMT-02:00)" },
  { value: "Atlantic/Azores", label: "Azores (GMT-01:00)" },
  { value: "Atlantic/Cape_Verde", label: "Cape Verde Is. (GMT-01:00)" },
  { value: "Europe/London", label: "London, Dublin, Lisbon (GMT+00:00)" },
  { value: "Africa/Casablanca", label: "Casablanca (GMT+00:00)" },
  { value: "Europe/Paris", label: "Paris, Madrid, Rome (GMT+01:00)" },
  { value: "Europe/Berlin", label: "Berlin, Amsterdam, Vienna (GMT+01:00)" },
  { value: "Africa/Lagos", label: "West Central Africa (GMT+01:00)" },
  { value: "Europe/Athens", label: "Athens, Istanbul, Bucharest (GMT+02:00)" },
  { value: "Africa/Cairo", label: "Cairo (GMT+02:00)" },
  { value: "Africa/Johannesburg", label: "Johannesburg, Pretoria (GMT+02:00)" },
  { value: "Europe/Helsinki", label: "Helsinki, Kiev, Riga (GMT+02:00)" },
  { value: "Asia/Jerusalem", label: "Jerusalem (GMT+02:00)" },
  { value: "Europe/Moscow", label: "Moscow, St. Petersburg (GMT+03:00)" },
  { value: "Asia/Baghdad", label: "Baghdad (GMT+03:00)" },
  { value: "Asia/Kuwait", label: "Kuwait, Riyadh (GMT+03:00)" },
  { value: "Africa/Nairobi", label: "Nairobi (GMT+03:00)" },
  { value: "Asia/Tehran", label: "Tehran (GMT+03:30)" },
  { value: "Asia/Dubai", label: "Abu Dhabi, Dubai (GMT+04:00)" },
  { value: "Asia/Baku", label: "Baku (GMT+04:00)" },
  { value: "Asia/Kabul", label: "Kabul (GMT+04:30)" },
  { value: "Asia/Karachi", label: "Islamabad, Karachi (GMT+05:00)" },
  { value: "Asia/Kolkata", label: "Mumbai, Kolkata, New Delhi (GMT+05:30)" },
  { value: "Asia/Colombo", label: "Sri Jayawardenepura (GMT+05:30)" },
  { value: "Asia/Kathmandu", label: "Kathmandu (GMT+05:45)" },
  { value: "Asia/Almaty", label: "Almaty, Dhaka (GMT+06:00)" },
  { value: "Asia/Rangoon", label: "Yangon (Rangoon) (GMT+06:30)" },
  { value: "Asia/Bangkok", label: "Bangkok, Hanoi, Jakarta (GMT+07:00)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong, Beijing, Chongqing (GMT+08:00)" },
  { value: "Asia/Singapore", label: "Singapore, Kuala Lumpur (GMT+08:00)" },
  { value: "Australia/Perth", label: "Perth (GMT+08:00)" },
  { value: "Asia/Taipei", label: "Taipei (GMT+08:00)" },
  { value: "Asia/Tokyo", label: "Tokyo, Osaka, Sapporo (GMT+09:00)" },
  { value: "Asia/Seoul", label: "Seoul (GMT+09:00)" },
  { value: "Australia/Adelaide", label: "Adelaide (GMT+09:30)" },
  { value: "Australia/Darwin", label: "Darwin (GMT+09:30)" },
  { value: "Australia/Sydney", label: "Sydney, Melbourne, Canberra (GMT+10:00)" },
  { value: "Australia/Brisbane", label: "Brisbane (GMT+10:00)" },
  { value: "Pacific/Guam", label: "Guam, Port Moresby (GMT+10:00)" },
  { value: "Australia/Hobart", label: "Hobart (GMT+10:00)" },
  { value: "Pacific/Noumea", label: "Solomon Is., New Caledonia (GMT+11:00)" },
  { value: "Pacific/Fiji", label: "Fiji (GMT+12:00)" },
  { value: "Pacific/Auckland", label: "Auckland, Wellington (GMT+12:00)" },
  { value: "Pacific/Tongatapu", label: "Nuku'alofa (GMT+13:00)" },
];

export function TimezoneSelect({ value, onChange, label, required = false, id }: TimezoneSelectProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-foreground mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-foreground/20 bg-white px-4 py-2 text-sm text-foreground focus:border-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        <option value="">Select timezone...</option>
        {TIMEZONES.map((tz) => (
          <option key={tz.value} value={tz.value}>
            {tz.label}
          </option>
        ))}
      </select>
    </div>
  );
}
