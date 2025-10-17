"use client";

import type { Route } from "next";
import { ChangeEvent, FocusEvent, KeyboardEvent, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type FilterControlsProps = {
  locale: string;
  labels: {
    region: string;
    city: string;
    languages: string;
    specialties?: string;
    verified: string;
  };
  regionOptions: Array<{ value: string; label: string }>;
  cityOptions: Array<{ value: string; label: string }>;
  languageOptions: Array<{ value: string; label: string }>;
  specialtyOptions?: Array<{ value: string; label: string }>;
};

export function FilterControls({
  locale,
  labels,
  regionOptions,
  cityOptions,
  languageOptions,
  specialtyOptions = [],
}: FilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleUpdate = (updates: Record<string, string | string[] | null>) => {
    const params = new URLSearchParams(searchParams?.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || (Array.isArray(value) && value.length === 0) || value === "") {
        params.delete(key);
      } else if (Array.isArray(value)) {
        params.set(key, value.join(","));
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    const nextUrl = (query ? `${pathname}?${query}` : pathname) as Route;
    router.push(nextUrl, { scroll: false });
  };

  const currentLanguages = useMemo(() => {
    return (
      searchParams?.get("languages")?.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean) ?? []
    );
  }, [searchParams]);

  const currentSpecialties = useMemo(() => {
    return (
      searchParams?.get("specialties")?.split(",").map((value) => value.trim().toLowerCase()).filter(Boolean) ?? []
    );
  }, [searchParams]);

  const currentRegion = searchParams?.get("region") ?? "";
  const currentCity = searchParams?.get("city") ?? "";
  const verifiedOnly = searchParams?.get("verified") === "true";

  const toggleLanguage = (value: string, checked: boolean) => {
    const next = new Set(currentLanguages);
    if (checked) {
      next.add(value);
    } else {
      next.delete(value);
    }
    handleUpdate({ languages: Array.from(next) });
  };

  const toggleSpecialty = (value: string, checked: boolean) => {
    const next = new Set(currentSpecialties);
    if (checked) {
      next.add(value);
    } else {
      next.delete(value);
    }
    handleUpdate({ specialties: Array.from(next) });
  };

  const handleRegionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    handleUpdate({ region: value || null, city: null });
  };

  const handleCityCommit = (value: string) => {
    const normalized = value.trim();
    handleUpdate({ city: normalized.length > 0 ? normalized : null });
  };

  const handleCityBlur = (event: FocusEvent<HTMLInputElement>) => {
    handleCityCommit(event.target.value ?? "");
  };

  const handleCityKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      handleCityCommit(event.currentTarget.value ?? "");
    }
  };

  const handleVerifiedChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleUpdate({ verified: event.target.checked ? "true" : null });
  };

  const datalistId = `city-options-${locale}`;

  return (
    <div className="grid gap-4">
      <label className="flex flex-col gap-2 text-sm text-foreground">
        <span className="font-medium">{labels.region}</span>
        <select
          value={currentRegion}
          onChange={handleRegionChange}
          className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
        >
          <option value="">--</option>
          {regionOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-2 text-sm text-foreground">
        <span className="font-medium">{labels.city}</span>
        <input
          type="text"
          defaultValue={currentCity}
          placeholder="Berlin, Barcelona, Tokyo..."
          list={cityOptions.length > 0 ? datalistId : undefined}
          onBlur={handleCityBlur}
          onKeyDown={handleCityKeyDown}
          className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground placeholder:text-foreground/40"
        />
        {cityOptions.length > 0 ? (
          <datalist id={datalistId}>
            {cityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </datalist>
        ) : null}
      </label>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">{labels.languages}</legend>
        <div className="flex flex-wrap gap-3">
          {languageOptions.map((option) => {
            const value = option.value.toLowerCase();
            const checked = currentLanguages.includes(value);
            return (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  value={value}
                  checked={checked}
                  onChange={(event) => toggleLanguage(value, event.target.checked)}
                  className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {specialtyOptions.length > 0 && labels.specialties ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">{labels.specialties}</legend>
          <div className="flex flex-wrap gap-3">
            {specialtyOptions.map((option) => {
              const value = option.value.toLowerCase();
              const checked = currentSpecialties.includes(value);
              return (
                <label key={option.value} className="inline-flex items-center gap-2 text-sm text-foreground/70">
                  <input
                    type="checkbox"
                    value={value}
                    checked={checked}
                    onChange={(event) => toggleSpecialty(value, event.target.checked)}
                    className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <label className="inline-flex items-center gap-2 text-sm text-foreground/70">
        <input
          type="checkbox"
          checked={verifiedOnly}
          onChange={handleVerifiedChange}
          className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
        />
        {labels.verified}
      </label>
    </div>
  );
}