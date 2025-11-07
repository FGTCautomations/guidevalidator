"use client";

import { useRef, useState, useTransition } from "react";
import type { ChangeEvent } from "react";

import { createJobPostingAction, type JobActionState } from "@/app/_actions/jobs";
import { useFormState } from "react-dom";

const STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "draft", label: "Draft" },
];

type Option = { value: string; label: string };

type JobPostingFormProps = {
  locale: string;
options: {
    countries: Option[];
    regions: Option[];
    cities: Option[];
    languages: Option[];
    specialties: Option[];
  };
  copy: {
    detailsHeading: string;
    detailsDescription: string;
    titleLabel: string;
    titlePlaceholder: string;
    descriptionLabel: string;
    descriptionPlaceholder: string;
    countryLabel: string;
    regionLabel: string;
    cityLabel: string;
    datesHeading: string;
    startDateLabel: string;
    endDateLabel: string;
    applicationDeadlineLabel: string;
    budgetHeading: string;
    budgetMinLabel: string;
    budgetMaxLabel: string;
    currencyLabel: string;
    requirementsHeading: string;
    languagesLabel: string;
    specialtiesLabel: string;
    statusLabel: string;
    languagesPlaceholder: string;
    specialtiesPlaceholder: string;
    submitLabel: string;
    cancelLabel: string;
    successMessage: string;
    errorMessage: string;
  };
};

const INITIAL_STATE: JobActionState = { ok: true };

export function JobPostingForm({ locale, options, copy }: JobPostingFormProps) {
const [formState, formAction] = useFormState(createJobPostingAction, INITIAL_STATE);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const handleCountryChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedCountry(event.target.value);
    setSelectedRegion("");
  };

  const handleRegionChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedRegion(event.target.value);
  };

  const handleReset = () => {
    formRef.current?.reset();
    setSelectedCountry("");
    setSelectedRegion("");
  };

  return (
    <form
      ref={formRef}
      action={(formData) => {
        formData.append("locale", locale);
        startTransition(() => {
          formAction(formData);
        });
      }}
      className="space-y-8 rounded-[var(--radius-xl)] border border-foreground/10 bg-white p-6 shadow-sm"
    >
      <section className="space-y-3">
        <header>
          <h2 className="text-lg font-semibold text-foreground">{copy.detailsHeading}</h2>
          <p className="text-sm text-foreground/70">{copy.detailsDescription}</p>
        </header>

        <div className="space-y-4">
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.titleLabel}</span>
            <input
              name="title"
              required
              placeholder={copy.titlePlaceholder}
              className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.descriptionLabel}</span>
            <textarea
              name="description"
              required
              placeholder={copy.descriptionPlaceholder}
              rows={6}
              className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
            />
          </label>

          <div className="grid gap-4 md:grid-cols-3">
            <label className="flex flex-col gap-2 text-sm text-foreground">
              <span className="font-medium">{copy.countryLabel}</span>
              <select
                name="country"
                value={selectedCountry}
                onChange={handleCountryChange}
                required
                className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
              >
                <option value="">--</option>
                {options.countries.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-foreground">
              <span className="font-medium">{copy.regionLabel}</span>
              <select
                name="region"
                value={selectedRegion}
                onChange={handleRegionChange}
                className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
              >
                <option value="">--</option>
                {options.regions
                  .filter((option) => !selectedCountry || option.label.endsWith(`(${selectedCountry})`))
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm text-foreground">
              <span className="font-medium">{copy.cityLabel}</span>
              <select
                name="city"
                className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
              >
                <option value="">--</option>
                {options.cities
                  .filter((option) => !selectedCountry || option.label.includes(selectedCountry))
                  .map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{copy.datesHeading}</h2>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.startDateLabel}</span>
            <input type="date" name="startDate" className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.endDateLabel}</span>
            <input type="date" name="endDate" className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm" />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.applicationDeadlineLabel}</span>
            <input type="date" name="applicationDeadline" className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm" />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{copy.budgetHeading}</h2>
        </header>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.budgetMinLabel}</span>
            <input
              type="number"
              name="budgetMin"
              min="0"
              className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.budgetMaxLabel}</span>
            <input
              type="number"
              name="budgetMax"
              min="0"
              className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.currencyLabel}</span>
            <input
              type="text"
              name="currency"
              defaultValue="EUR"
              className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm uppercase"
            />
          </label>
        </div>
      </section>

      <section className="space-y-3">
        <header className="space-y-1">
          <h2 className="text-lg font-semibold text-foreground">{copy.requirementsHeading}</h2>
        </header>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.languagesLabel}</span>
            <div className="min-h-[120px] max-h-[200px] overflow-y-auto rounded-xl border border-foreground/15 bg-background/60 px-3 py-2">
              {options.languages.map((option) => (
                <label key={option.value} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-foreground/5 px-2 rounded">
                  <input
                    type="checkbox"
                    name="languageOptions"
                    value={option.value}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary/20 rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            <input
              name="languages"
              placeholder={copy.languagesPlaceholder}
              className="rounded-xl border border-dashed border-foreground/15 bg-background/40 px-3 py-2 text-sm"
            />
          </div>

          <div className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.specialtiesLabel}</span>
            <div className="min-h-[120px] max-h-[200px] overflow-y-auto rounded-xl border border-foreground/15 bg-background/60 px-3 py-2">
              {options.specialties.map((option) => (
                <label key={option.value} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-foreground/5 px-2 rounded">
                  <input
                    type="checkbox"
                    name="specialtyOptions"
                    value={option.value}
                    className="w-4 h-4 text-primary focus:ring-2 focus:ring-primary/20 rounded"
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
            <input
              name="specialties"
              placeholder={copy.specialtiesPlaceholder}
              className="rounded-xl border border-dashed border-foreground/15 bg-background/40 px-3 py-2 text-sm"
            />
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <label className="flex flex-col gap-2 text-sm text-foreground">
          <span className="font-medium">{copy.statusLabel}</span>
          <select name="status" defaultValue="open" className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm">
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </section>

      {formState?.message ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            formState.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {formState.ok ? copy.successMessage : copy.errorMessage}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:opacity-60"
        >
          {pending ? `${copy.submitLabel} �` : copy.submitLabel}
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="rounded-full border border-foreground/20 px-6 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/5"
        >
          {copy.cancelLabel}
        </button>
      </div>
    </form>
  );
}
