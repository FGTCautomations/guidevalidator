"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

type Option = {
  value: string;
  label: string;
};

interface CountryFilterProps {
  countries: Option[];
  selectedCountry?: string;
  locale: string;
  label: string;
  placeholder: string;
}

export function CountryFilter({
  countries,
  selectedCountry,
  locale,
  label,
  placeholder,
}: CountryFilterProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(selectedCountry || "");

  const handleChange = (newValue: string) => {
    setValue(newValue);

    // Create fresh params - clear ALL filters when country changes
    const params = new URLSearchParams();

    if (newValue) {
      // Only set country - all other filters are cleared
      params.set("country", newValue);
    }
    // If no value, params will be empty, clearing everything

    startTransition(() => {
      const search = params.toString();
      const target = search ? `${pathname}?${search}` : pathname;
      router.push(target as any);
    });
  };

  return (
    <div className="rounded-xl border border-foreground/10 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <label htmlFor="country-filter" className="block text-sm font-medium text-foreground mb-2">
            {label}
          </label>
          <select
            id="country-filter"
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isPending}
            className="w-full rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-4 py-2.5 text-sm text-foreground focus:border-foreground/40 focus:outline-none disabled:opacity-50"
          >
            <option value="">{placeholder}</option>
            {countries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>

        {value && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleChange("")}
              disabled={isPending}
              className="rounded-lg border border-foreground/20 bg-white px-4 py-2 text-sm font-medium text-foreground hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Clear Filter
            </button>
          </div>
        )}
      </div>

      {value && (
        <div className="mt-3 text-xs text-foreground/60">
          Showing results for{" "}
          <span className="font-medium text-foreground">
            {countries.find((c) => c.value === value)?.label || value}
          </span>
        </div>
      )}

      {isPending && (
        <div className="mt-4 flex items-center gap-2 text-sm text-foreground/60">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-foreground/20 border-t-primary" />
          <span>Loading filter options...</span>
        </div>
      )}
    </div>
  );
}
