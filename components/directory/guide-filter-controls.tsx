"use client";

import type { Route } from "next";
import {
  ChangeEvent,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export type Option = {
  value: string;
  label: string;
};

export type PriceBounds = {
  min: number;
  max: number;
};

type GuideFilterControlsProps = {
  countries: Option[];
  regions: Option[];
  cities: Option[];
  languageOptions: Option[];
  specialtyOptions: Option[];
  genderOptions: Option[];
  priceBounds: PriceBounds | null;
  labels: {
    country: string;
    region: string;
    city: string;
    languages: string;
    specialties: string;
    genders: string;
    verified: string;
    license: string;
    insurance: string;
    childFriendly: string;
    price: string;
    priceReset: string;
    rating: string;
  };
};

function toList(value: string | null): string[] {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function GuideFilterControls({
  countries,
  regions,
  cities,
  languageOptions,
  specialtyOptions,
  genderOptions,
  priceBounds,
  labels,
}: GuideFilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const bounds = priceBounds ?? { min: 0, max: 500 };
  const minBound = bounds.min;
  const maxBound = Math.max(bounds.max, bounds.min + 10);

  const currentCountry = searchParams?.get("country") ?? "";
  const currentRegion = searchParams?.get("region") ?? "";
  const currentCity = searchParams?.get("city") ?? "";

  // Local state for pending filter selections (before Apply button clicked)
  const [pendingLanguages, setPendingLanguages] = useState<Set<string>>(() =>
    new Set(toList(searchParams?.get("languages") ?? "").map((value) => value.toLowerCase()))
  );
  const [pendingSpecialties, setPendingSpecialties] = useState<Set<string>>(() =>
    new Set(toList(searchParams?.get("specialties") ?? "").map((value) => value.toLowerCase()))
  );
  const [pendingGenders, setPendingGenders] = useState<Set<string>>(() =>
    new Set(toList(searchParams?.get("gender") ?? "").map((value) => value.toLowerCase()))
  );

  // Applied filters from URL
  const currentLanguages = useMemo(
    () => new Set(toList(searchParams?.get("languages") ?? "").map((value) => value.toLowerCase())),
    [searchParams]
  );

  const currentSpecialties = useMemo(
    () => new Set(toList(searchParams?.get("specialties") ?? "").map((value) => value.toLowerCase())),
    [searchParams]
  );

  const currentGenders = useMemo(
    () => new Set(toList(searchParams?.get("gender") ?? "").map((value) => value.toLowerCase())),
    [searchParams]
  );

  // Sync pending state when URL changes (e.g., from Clear All Filters)
  useEffect(() => {
    setPendingLanguages(new Set(currentLanguages));
    setPendingSpecialties(new Set(currentSpecialties));
    setPendingGenders(new Set(currentGenders));
  }, [currentLanguages, currentSpecialties, currentGenders]);

  const verifiedOnly = searchParams?.get("verified") === "true";
  const licenseOnly = searchParams?.get("license") === "true";
  const minRating = searchParams?.get("minRating") ?? "";

  const minRateParam = searchParams?.get("minRate");
  const maxRateParam = searchParams?.get("maxRate");

  const parseRate = (value: string | null, fallback: number) => {
    if (!value) return fallback;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const [minValue, setMinValue] = useState(() =>
    clamp(parseRate(minRateParam, minBound), minBound, maxBound)
  );
  const [maxValue, setMaxValue] = useState(() =>
    clamp(parseRate(maxRateParam, maxBound), minBound, maxBound)
  );

  useEffect(() => {
    const nextMin = clamp(parseRate(minRateParam, minBound), minBound, maxBound);
    const nextMax = clamp(parseRate(maxRateParam, maxBound), minBound, maxBound);
    setMinValue(Math.min(nextMin, nextMax));
    setMaxValue(Math.max(nextMin, nextMax));
  }, [minRateParam, maxRateParam, minBound, maxBound]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams?.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.replace(nextUrl as Route, { scroll: false });
    });
  };

  // Toggle checkbox in local state (doesn't update URL yet)
  const toggleLocalFilter = (filterType: 'languages' | 'specialties' | 'genders', value: string, checked: boolean) => {
    if (filterType === 'languages') {
      const updated = new Set(pendingLanguages);
      if (checked) {
        updated.add(value.toLowerCase());
      } else {
        updated.delete(value.toLowerCase());
      }
      setPendingLanguages(updated);
    } else if (filterType === 'specialties') {
      const updated = new Set(pendingSpecialties);
      if (checked) {
        updated.add(value.toLowerCase());
      } else {
        updated.delete(value.toLowerCase());
      }
      setPendingSpecialties(updated);
    } else if (filterType === 'genders') {
      const updated = new Set(pendingGenders);
      if (checked) {
        updated.add(value.toLowerCase());
      } else {
        updated.delete(value.toLowerCase());
      }
      setPendingGenders(updated);
    }
  };

  // Apply all pending filters to URL (triggers data fetch)
  const handleApplyFilters = () => {
    const updates: Record<string, string | null> = {
      languages: pendingLanguages.size > 0 ? Array.from(pendingLanguages).join(",") : null,
      specialties: pendingSpecialties.size > 0 ? Array.from(pendingSpecialties).join(",") : null,
      gender: pendingGenders.size > 0 ? Array.from(pendingGenders).join(",") : null,
    };
    updateParams(updates);
  };

  const commitPriceRange = (nextMin: number, nextMax: number) => {
    const normalizedMin = clamp(nextMin, minBound, maxBound);
    const normalizedMax = clamp(nextMax, normalizedMin, maxBound);
    const minParam = normalizedMin <= minBound ? null : String(Math.round(normalizedMin));
    const maxParam = normalizedMax >= maxBound ? null : String(Math.round(normalizedMax));
    updateParams({ minRate: minParam, maxRate: maxParam });
  };

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (!value) {
      updateParams({ country: null, region: null, city: null });
    } else {
      updateParams({ country: value.toUpperCase(), region: null, city: null });
    }
  };

  const handleRegionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    updateParams({ region: value || null, city: null });
  };

  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    updateParams({ city: value || null });
  };

  const handlePriceReset = () => {
    setMaxValue(maxBound);
    updateParams({ minRate: null, maxRate: null });
  };

  const step = Math.max(1, Math.round((maxBound - minBound) / 20));

  const countryOptions = countries.length > 0 ? countries : [];
  const regionOptions = regions.length > 0 ? regions : [];
  const cityOptions = cities.length > 0 ? cities : [];

  // Use pending selections for UI (show checked immediately)
  const selectedLanguageIds = useMemo(() => pendingLanguages, [pendingLanguages]);
  const selectedSpecialtyIds = useMemo(() => pendingSpecialties, [pendingSpecialties]);
  const selectedGenderIds = useMemo(() => pendingGenders, [pendingGenders]);

  // Check if any filters are active
  const hasActiveFilters =
    currentLanguages.size > 0 ||
    currentSpecialties.size > 0 ||
    currentGenders.size > 0 ||
    verifiedOnly ||
    licenseOnly ||
    minRating ||
    maxRateParam !== null;

  const handleClearAllFilters = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");

    // Keep country, region, city - clear everything else
    const country = params.get("country");
    const region = params.get("region");
    const city = params.get("city");

    // Clear all filter params
    params.delete("languages");
    params.delete("specialties");
    params.delete("gender");
    params.delete("verified");
    params.delete("license");
    params.delete("insurance");
    params.delete("child");
    params.delete("minRate");
    params.delete("maxRate");
    params.delete("minRating");
    params.delete("availableFrom");
    params.delete("availableTo");
    params.delete("search");

    const query = params.toString();
    const nextUrl = query ? `${pathname}?${query}` : pathname;

    startTransition(() => {
      router.replace(nextUrl as Route, { scroll: false });
    });
  };

  return (
    <div className="grid gap-6">
      {/* Clear All Filters Button */}
      {hasActiveFilters && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleClearAllFilters}
            disabled={isPending}
            className="rounded-lg border-2 border-red-500 bg-white px-4 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
          >
            Clear All Filters
          </button>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-foreground">
          <span className="font-medium">{labels.country}</span>
          <select
            value={currentCountry}
            onChange={handleCountryChange}
            className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            disabled={isPending && !countryOptions.length}
          >
            <option value="">--</option>
            {countryOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2 text-sm text-foreground">
          <span className="font-medium">{labels.region}</span>
          <select
            value={currentRegion}
            onChange={handleRegionChange}
            className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            disabled={regionOptions.length === 0}
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
          <select
            value={currentCity}
            onChange={handleCityChange}
            className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            disabled={cityOptions.length === 0}
          >
            <option value="">--</option>
            {cityOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">{labels.languages}</legend>
        <div className="flex flex-wrap gap-3">
          {languageOptions.map((option) => {
            const value = option.value.toLowerCase();
            const checked = selectedLanguageIds.has(value);
            return (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  value={value}
                  checked={checked}
                  onChange={(event) => toggleLocalFilter("languages", value, event.target.checked)}
                  className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">{labels.specialties}</legend>
        <div className="flex flex-wrap gap-3">
          {specialtyOptions.map((option) => {
            const value = option.value.toLowerCase();
            const checked = selectedSpecialtyIds.has(value);
            return (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  value={value}
                  checked={checked}
                  onChange={(event) => toggleLocalFilter("specialties", value, event.target.checked)}
                  className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </fieldset>

      {genderOptions.length > 0 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-foreground">{labels.genders}</legend>
          <div className="flex flex-wrap gap-3">
            {genderOptions.map((option) => {
              const value = option.value.toLowerCase();
              const checked = selectedGenderIds.has(value);
              return (
                <label key={option.value} className="inline-flex items-center gap-2 text-sm text-foreground/70">
                  <input
                    type="checkbox"
                    value={value}
                    checked={checked}
                    onChange={(event) => toggleLocalFilter("genders", value, event.target.checked)}
                    className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                  />
                  {option.label}
                </label>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="inline-flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={verifiedOnly}
            onChange={(event) => updateParams({ verified: event.target.checked ? "true" : null })}
            className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
          />
          {labels.verified}
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={licenseOnly}
            onChange={(event) => updateParams({ license: event.target.checked ? "true" : null })}
            className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
          />
          {labels.license}
        </label>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-foreground">{labels.rating}</legend>
        <div className="flex flex-wrap gap-3">
          {[5, 4, 3].map((rating) => (
            <label key={rating} className="inline-flex items-center gap-2 text-sm text-foreground/70 cursor-pointer">
              <input
                type="checkbox"
                checked={minRating === String(rating)}
                onChange={(event) => {
                  if (event.target.checked) {
                    updateParams({ minRating: String(rating) });
                  } else {
                    updateParams({ minRating: null });
                  }
                }}
                className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
              />
              <span className="flex items-center gap-1">
                {rating}+ ⭐
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{labels.price}</p>
            <p className="text-xs text-foreground/60">
              Up to {Math.round(maxValue)}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePriceReset}
            className="text-xs font-medium text-secondary transition hover:text-secondary/80"
            disabled={maxRateParam === null}
          >
            {labels.priceReset}
          </button>
        </div>
        <div className="space-y-2">
          <input
            type="range"
            min={minBound}
            max={maxBound}
            step={step}
            value={maxValue}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (!Number.isFinite(value)) return;
              setMaxValue(clamp(value, minBound, maxBound));
            }}
            onMouseUp={() => commitPriceRange(minBound, maxValue)}
            onTouchEnd={() => commitPriceRange(minBound, maxValue)}
            className="w-full"
          />
          <div className="flex items-center gap-2 text-xs text-foreground/60">
            <span>Max Price:</span>
            <input
              type="number"
              value={Math.round(maxValue)}
              min={minBound}
              max={maxBound}
              step={step}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isFinite(value)) return;
                setMaxValue(clamp(value, minBound, maxBound));
              }}
              onBlur={() => commitPriceRange(minBound, maxValue)}
              className="w-24 rounded-md border border-foreground/20 bg-background px-2 py-1"
            />
          </div>
        </div>
      </div>

      {/* Apply Filters Button */}
      <div className="mt-6 flex justify-end gap-3 border-t border-foreground/10 pt-6">
        <button
          type="button"
          onClick={handleApplyFilters}
          disabled={isPending}
          className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-50"
        >
          {isPending ? "Applying..." : "Apply Filters"}
        </button>
      </div>
    </div>
  );
}






