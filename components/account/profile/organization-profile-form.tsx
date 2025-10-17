"use client";

import { useFormState, useFormStatus } from "react-dom";

import { updateOrganizationProfileAction, type ProfileActionState } from "@/app/_actions/profile";

type Option = {
  value: string;
  label: string;
};

type OrganizationProfileFormProps = {
  locale: string;
  organizationType: "agency" | "dmc" | "transport";
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

const INITIAL_STATE: ProfileActionState = { ok: true };

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
      {pending ? "Saving…" : label}
    </button>
  );
}

export function OrganizationProfileForm({ locale, organizationType, initial, options }: OrganizationProfileFormProps) {
  const [state, formAction] = useFormState(updateOrganizationProfileAction, INITIAL_STATE);

  return (
    <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">
          {organizationType === "transport" ? "Transport coverage" : organizationType === "agency" ? "Agency coverage" : "DMC coverage"}
        </h2>
        <p className="text-sm text-foreground/70">
          Maintain the languages your team supports, your focus areas, and the locations you service.
        </p>
      </header>
      <form action={formAction} className="space-y-6">
        <input type="hidden" name="locale" value={locale} />

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Languages your team supports</label>
          <select
            name="organizationLanguages"
            multiple
            defaultValue={initial.languages}
            className="h-32 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
          >
            {options.languages.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <textarea
            name="organizationLanguagesExtra"
            placeholder="Add additional languages, separated by commas"
            className="w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-foreground">Specialisations</label>
          <select
            name="organizationSpecialties"
            multiple
            defaultValue={initial.specialties}
            className="h-32 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
          >
            {options.specialtySuggestions.map((specialty) => (
              <option key={specialty} value={specialty}>
                {specialty}
              </option>
            ))}
          </select>
          <textarea
            name="organizationSpecialtiesExtra"
            placeholder="Add additional specialties, separated by commas"
            className="w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground">Countries</label>
            <select
              name="organizationCountries"
              multiple
              defaultValue={initial.countries}
              className="h-40 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            >
              {options.countries.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground">Regions</label>
            <select
              name="organizationRegions"
              multiple
              defaultValue={initial.regions}
              className="h-40 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            >
              {options.regions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2 sm:col-span-1">
            <label className="block text-sm font-medium text-foreground">Cities</label>
            <select
              name="organizationCities"
              multiple
              defaultValue={initial.cities}
              className="h-40 w-full rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground"
            >
              {options.cities.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <SubmitButton label="Save organisation profile" />
        </div>

        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-red-600"}`}>
            {state.ok ? "Organisation profile updated." : `Update failed: ${state.message}`}
          </p>
        ) : null}
      </form>
    </section>
  );
}

