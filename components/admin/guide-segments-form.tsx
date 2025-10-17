"use client";

import { useFormState, useFormStatus } from "react-dom";

import { adminUpdateGuideSegmentsAction } from "@/app/_actions/profile";
import type { AdminActionState } from "@/app/_actions/admin";

type Option = {
  value: string;
  label: string;
};

type AdminGuideSegmentsFormProps = {
  locale: string;
  profileId: string;
  initial: {
    languages: string[];
    specialties: string[];
    countries: string[];
    regions: string[];
    cities: string[];
  };
  options: {
    languages: Option[];
    specialtySuggestions: string[];
    countries: Option[];
    regions: Option[];
    cities: Option[];
  };
};

const INITIAL_STATE: AdminActionState = { ok: true };

type SubmitButtonProps = {
  label: string;
};

function SubmitButton({ label }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-full bg-secondary px-4 py-2 text-sm font-semibold text-secondary-foreground shadow-sm transition hover:shadow-md disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Saving." : label}
    </button>
  );
}

function CheckboxGroup({
  name,
  options,
  selected,
  columnsClass = "sm:grid-cols-2 lg:grid-cols-3",
}: {
  name: string;
  options: Option[];
  selected: Set<string>;
  columnsClass?: string;
}) {
  return (
    <div className={`grid gap-2 ${columnsClass}`}>
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={selected.has(option.value)}
            className="h-4 w-4 rounded border-foreground/30 text-primary focus:ring-primary/40"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

function CheckboxScrollGroup({ name, options, selected }: { name: string; options: Option[]; selected: Set<string> }) {
  return (
    <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-foreground/15 bg-background/80 p-3">
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            name={name}
            value={option.value}
            defaultChecked={selected.has(option.value)}
            className="h-4 w-4 rounded border-foreground/30 text-primary focus:ring-primary/40"
          />
          <span>{option.label}</span>
        </label>
      ))}
    </div>
  );
}

export function AdminGuideSegmentsForm({ locale, profileId, initial, options }: AdminGuideSegmentsFormProps) {
  const [state, formAction] = useFormState(adminUpdateGuideSegmentsAction, INITIAL_STATE);

  const selectedLanguages = new Set(initial.languages);
  const selectedSpecialties = new Set(initial.specialties);
  const selectedCountries = new Set(initial.countries);
  const selectedRegions = new Set(initial.regions);
  const selectedCities = new Set(initial.cities);

  return (
    <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Guide languages & locations</h2>
        <p className="text-sm text-foreground/70">Adjust the guide's spoken languages, specialties, and service areas.</p>
      </header>
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="locale" value={locale} />
        <input type="hidden" name="profileId" value={profileId} />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Spoken languages</label>
          <CheckboxGroup name="spokenLanguages" options={options.languages} selected={selectedLanguages} />
          <textarea
            name="spokenLanguagesExtra"
            placeholder="Add additional languages, separated by commas"
            className="w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Specialisations</label>
          <CheckboxGroup
            name="guideSpecialties"
            options={options.specialtySuggestions.map((value) => ({ value, label: value }))}
            selected={selectedSpecialties}
          />
          <textarea
            name="guideSpecialtiesExtra"
            placeholder="Add additional specialties, separated by commas"
            className="w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground">Countries</label>
            <CheckboxScrollGroup name="countries" options={options.countries} selected={selectedCountries} />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground">Regions</label>
            <CheckboxScrollGroup name="regions" options={options.regions} selected={selectedRegions} />
          </div>
          <div className="space-y-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground">Cities</label>
            <CheckboxScrollGroup name="cities" options={options.cities} selected={selectedCities} />
          </div>
        </div>

        <div className="flex items-center justify-end">
          <SubmitButton label="Save guide segments" />
        </div>

        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-red-600"}`}>
            {state.ok ? "Guide segments updated." : `Update failed: ${state.message}`}
          </p>
        ) : null}
      </form>
    </section>
  );
}
