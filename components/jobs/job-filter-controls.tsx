"use client";

import type { Route } from "next";
import { ChangeEvent, FormEvent, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type Option = { value: string; label: string };

type JobFilterControlsProps = {
  labels: {
    search: string;
    country: string;
    region: string;
    city: string;
    languages: string;
    specialties: string;
    status: string;
    startDateFrom: string;
    startDateTo: string;
    budgetMin: string;
    budgetMax: string;
    clear: string;
  };
  countryOptions: Option[];
  regionOptions: Option[];
  cityOptions: Option[];
  languageOptions: Option[];
  specialtyOptions: Option[];
  statusOptions: Option[];
};

export function JobFilterControls({
  labels,
  countryOptions,
  regionOptions,
  cityOptions,
  languageOptions,
  specialtyOptions,
  statusOptions,
}: JobFilterControlsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams?.get("search") ?? "");
  const [budgetMin, setBudgetMin] = useState(searchParams?.get("budgetMin") ?? "");
  const [budgetMax, setBudgetMax] = useState(searchParams?.get("budgetMax") ?? "");
  const [startDateFrom, setStartDateFrom] = useState(searchParams?.get("startDateFrom") ?? "");
  const [startDateTo, setStartDateTo] = useState(searchParams?.get("startDateTo") ?? "");

  const updateParams = (updates: Record<string, string | string[] | null>) => {
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

    router.push(`${pathname}?${params.toString()}` as Route, { scroll: false });
  };

  const currentCountry = searchParams?.get("country") ?? "";
  const currentRegion = searchParams?.get("regionId") ?? "";
  const currentCity = searchParams?.get("cityId") ?? "";
  const currentStatus = searchParams?.get("status") ?? "open";
  const currentLanguages = searchParams?.get("languages")?.split(",").filter(Boolean) ?? [];
  const currentSpecialties = searchParams?.get("specialties")?.split(",").filter(Boolean) ?? [];

  const toggleValue = (current: string[], value: string, checked: boolean) => {
    const next = new Set(current);
    if (checked) {
      next.add(value);
    } else {
      next.delete(value);
    }
    return Array.from(next);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ search: searchValue || null });
  };

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateParams({ country: event.target.value || null, regionId: null, cityId: null });
  };

  const handleRegionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateParams({ regionId: event.target.value || null, cityId: null });
  };

  const handleCityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateParams({ cityId: event.target.value || null });
  };

  const handleStatusChange = (event: ChangeEvent<HTMLSelectElement>) => {
    updateParams({ status: event.target.value || null });
  };

  const handleDateSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ startDateFrom: startDateFrom || null, startDateTo: startDateTo || null });
  };

  const handleBudgetSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateParams({ budgetMin: budgetMin || null, budgetMax: budgetMax || null });
  };

  const clearFilters = () => {
    setSearchValue("");
    setBudgetMin("");
    setBudgetMax("");
    setStartDateFrom("");
    setStartDateTo("");
    updateParams({
      search: null,
      country: null,
      regionId: null,
      cityId: null,
      languages: null,
      specialties: null,
      status: "open",
      startDateFrom: null,
      startDateTo: null,
      budgetMin: null,
      budgetMax: null,
    });
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <input
          type="search"
          value={searchValue}
          onChange={(event) => setSearchValue(event.target.value)}
          placeholder={labels.search}
          className="flex-1 rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
        >
          {labels.search}
        </button>
      </form>

      <label className="flex flex-col gap-2 text-sm text-foreground">
        <span className="font-medium">{labels.country}</span>
        <select
          value={currentCountry}
          onChange={handleCountryChange}
          className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
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
        >
          <option value="">--</option>
          {cityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">{labels.languages}</span>
        <div className="flex flex-wrap gap-3">
          {languageOptions.map((option) => {
            const checked = currentLanguages.includes(option.value);
            return (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => updateParams({ languages: toggleValue(currentLanguages, option.value, event.target.checked) })}
                  className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        <span className="text-sm font-medium text-foreground">{labels.specialties}</span>
        <div className="flex flex-wrap gap-3">
          {specialtyOptions.map((option) => {
            const checked = currentSpecialties.includes(option.value);
            return (
              <label key={option.value} className="inline-flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(event) => updateParams({ specialties: toggleValue(currentSpecialties, option.value, event.target.checked) })}
                  className="h-4 w-4 rounded border-foreground/20 text-primary focus:ring-primary/30"
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>

      <label className="flex flex-col gap-2 text-sm text-foreground">
        <span className="font-medium">{labels.status}</span>
        <select
          value={currentStatus}
          onChange={handleStatusChange}
          className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <form onSubmit={handleDateSubmit} className="space-y-3 rounded-xl border border-foreground/10 bg-background/80 p-3">
        <span className="text-sm font-medium text-foreground">{labels.startDateFrom}</span>
        <input
          type="date"
          value={startDateFrom}
          onChange={(event) => setStartDateFrom(event.target.value)}
          className="w-full rounded-xl border border-foreground/15 bg-white px-3 py-2 text-sm text-foreground"
        />
        <span className="text-sm font-medium text-foreground">{labels.startDateTo}</span>
        <input
          type="date"
          value={startDateTo}
          onChange={(event) => setStartDateTo(event.target.value)}
          className="w-full rounded-xl border border-foreground/15 bg-white px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background"
        >
          Apply dates
        </button>
      </form>

      <form onSubmit={handleBudgetSubmit} className="space-y-3 rounded-xl border border-foreground/10 bg-background/80 p-3">
        <span className="text-sm font-medium text-foreground">{labels.budgetMin}</span>
        <input
          type="number"
          min="0"
          value={budgetMin}
          onChange={(event) => setBudgetMin(event.target.value)}
          className="w-full rounded-xl border border-foreground/15 bg-white px-3 py-2 text-sm text-foreground"
        />
        <span className="text-sm font-medium text-foreground">{labels.budgetMax}</span>
        <input
          type="number"
          min="0"
          value={budgetMax}
          onChange={(event) => setBudgetMax(event.target.value)}
          className="w-full rounded-xl border border-foreground/15 bg-white px-3 py-2 text-sm text-foreground"
        />
        <button
          type="submit"
          className="w-full rounded-xl bg-foreground px-3 py-2 text-sm font-semibold text-background"
        >
          Apply budget
        </button>
      </form>

      <button
        type="button"
        onClick={clearFilters}
        className="text-xs font-medium text-secondary transition hover:text-secondary/80"
      >
        {labels.clear}
      </button>
    </div>
  );
}
