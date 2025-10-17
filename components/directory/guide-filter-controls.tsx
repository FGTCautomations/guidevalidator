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

  const verifiedOnly = searchParams?.get("verified") === "true";
  const licenseOnly = searchParams?.get("license") === "true";
  const insuranceOnly = searchParams?.get("insurance") === "true";
  const childFriendlyOnly = searchParams?.get("child") === "true";

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

  const toggleCommaSeparated = (key: string, candidate: string, checked: boolean) => {
    const currentValues = new Set(toList(searchParams?.get(key) ?? "").map((value) => value.toLowerCase()));
    if (checked) {
      currentValues.add(candidate.toLowerCase());
    } else {
      currentValues.delete(candidate.toLowerCase());
    }
    updateParams({ [key]: currentValues.size > 0 ? Array.from(currentValues).join(",") : null });
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
    setMinValue(minBound);
    setMaxValue(maxBound);
    updateParams({ minRate: null, maxRate: null });
  };

  const step = Math.max(1, Math.round((maxBound - minBound) / 20));

  const countryOptions = countries.length > 0 ? countries : [];
  const regionOptions = regions.length > 0 ? regions : [];
  const cityOptions = cities.length > 0 ? cities : [];

  const selectedLanguageIds = useMemo(() => new Set(currentLanguages), [currentLanguages]);
  const selectedSpecialtyIds = useMemo(() => new Set(currentSpecialties), [currentSpecialties]);
  const selectedGenderIds = useMemo(() => new Set(currentGenders), [currentGenders]);

  return (
    <div className="grid gap-6">
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
                  onChange={(event) => toggleCommaSeparated("languages", value, event.target.checked)}
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
                  onChange={(event) => toggleCommaSeparated("specialties", value, event.target.checked)}
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
                    onChange={(event) => toggleCommaSeparated("gender", value, event.target.checked)}
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
        <label className="inline-flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={insuranceOnly}
            onChange={(event) => updateParams({ insurance: event.target.checked ? "true" : null })}
            className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
          />
          {labels.insurance}
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            checked={childFriendlyOnly}
            onChange={(event) => updateParams({ child: event.target.checked ? "true" : null })}
            className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
          />
          {labels.childFriendly}
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">{labels.price}</p>
            <p className="text-xs text-foreground/60">
              {Math.round(minValue)} – {Math.round(maxValue)}
            </p>
          </div>
          <button
            type="button"
            onClick={handlePriceReset}
            className="text-xs font-medium text-secondary transition hover:text-secondary/80"
            disabled={minRateParam === null && maxRateParam === null}
          >
            {labels.priceReset}
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min={minBound}
            max={maxBound}
            step={step}
            value={minValue}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (!Number.isFinite(value)) return;
              setMinValue((prev) => clamp(value, minBound, Math.min(maxValue, maxBound)));
            }}
            onMouseUp={() => commitPriceRange(minValue, maxValue)}
            onTouchEnd={() => commitPriceRange(minValue, maxValue)}
            className="w-full"
          />
          <input
            type="range"
            min={minBound}
            max={maxBound}
            step={step}
            value={maxValue}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (!Number.isFinite(value)) return;
              setMaxValue((prev) => clamp(value, Math.max(minValue, minBound), maxBound));
            }}
            onMouseUp={() => commitPriceRange(minValue, maxValue)}
            onTouchEnd={() => commitPriceRange(minValue, maxValue)}
            className="w-full"
          />
        </div>
        <div className="flex items-center gap-3 text-xs text-foreground/60">
          <label className="flex items-center gap-2">
            <span>Min</span>
            <input
              type="number"
              value={Math.round(minValue)}
              min={minBound}
              max={maxBound}
              step={step}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isFinite(value)) return;
                setMinValue((prev) => clamp(value, minBound, Math.min(maxValue, maxBound)));
              }}
              onBlur={() => commitPriceRange(minValue, maxValue)}
              className="w-20 rounded-md border border-foreground/20 bg-background px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-2">
            <span>Max</span>
            <input
              type="number"
              value={Math.round(maxValue)}
              min={minBound}
              max={maxBound}
              step={step}
              onChange={(event) => {
                const value = Number(event.target.value);
                if (!Number.isFinite(value)) return;
                setMaxValue((prev) => clamp(value, Math.max(minValue, minBound), maxBound));
              }}
              onBlur={() => commitPriceRange(minValue, maxValue)}
              className="w-20 rounded-md border border-foreground/20 bg-background px-2 py-1"
            />
          </label>
        </div>
      </div>
    </div>
  );
}






