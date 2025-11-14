"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";

import { updateGuideProfileAction, type ProfileActionState } from "@/app/_actions/profile";
import { TimezoneSelect } from "@/components/form/timezone-select";
import { WorkingHoursInput } from "@/components/form/working-hours-input";
import { CustomLanguageInput } from "@/components/form/custom-language-input";
import { GUIDE_SPECIALTY_OPTIONS } from "@/lib/constants/profile";

type Option = {
  value: string;
  label: string;
};

type GuideProfileFormProps = {
  locale: string;
  initial: {
    languages: string[];
    specialties: string[];
    countries: string[];
    regions: string[];
    cities: string[];
    businessName?: string | null;
    bio?: string | null;
    yearsExperience?: number | null;
    hourlyRateCents?: number | null;
    currency?: string | null;
    avatarUrl?: string | null;
    timezone?: string | null;
    availabilityTimezone?: string | null;
    workingHours?: any | null;
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

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{title}</h2>
        {description ? <p className="text-sm text-foreground/70">{description}</p> : null}
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function TextInput({
  label,
  name,
  type = "text",
  placeholder,
  defaultValue,
  min,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  defaultValue?: string | number;
  min?: number | string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        name={name}
        placeholder={placeholder}
        defaultValue={defaultValue || ""}
        min={min}
        className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function TextArea({
  label,
  name,
  rows = 4,
  placeholder,
  defaultValue,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        defaultValue={defaultValue || ""}
        className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function FileInput({
  label,
  name,
  hint,
  currentFile,
}: {
  label: string;
  name: string;
  hint?: string;
  currentFile?: string | null;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      {currentFile && (
        <div className="text-xs text-foreground/60 mb-1">
          Current: <a href={currentFile} target="_blank" rel="noopener noreferrer" className="text-primary underline">View file</a>
        </div>
      )}
      <input
        type="file"
        name={name}
        accept="image/jpeg,image/png,image/jpg"
        className="cursor-pointer rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {hint ? <p className="text-xs text-foreground/60">{hint}</p> : null}
    </label>
  );
}

function CheckboxGroup({
  label,
  hint,
  name,
  options,
  defaultChecked = [],
}: {
  label: string;
  hint?: string;
  name: string;
  options: readonly string[] | string[];
  defaultChecked?: string[];
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      {hint ? <p className="text-xs text-foreground/60">{hint}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => {
          const value = typeof option === "string" ? option : option;
          const isChecked = defaultChecked.some(checked =>
            checked.toLowerCase().replace(/\s+/g, "-") === value.toLowerCase().replace(/\s+/g, "-") ||
            checked.toLowerCase() === value.toLowerCase()
          );
          return (
            <label key={value} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                name={name}
                value={value}
                defaultChecked={isChecked}
                className="h-4 w-4 rounded border-foreground/30 text-primary focus:ring-primary/40"
              />
              {value}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

type SubmitButtonProps = {
  label: string;
};

function SubmitButton({ label }: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
    >
      {pending ? "Saving…" : label}
    </button>
  );
}

export function GuideProfileForm({ locale, initial, options }: GuideProfileFormProps) {
  const [state, formAction] = useFormState(updateGuideProfileAction, INITIAL_STATE);

  const [languages, setLanguages] = useState<string[]>(initial.languages || []);
  const [timezone, setTimezone] = useState<string>(initial.timezone || "");
  const [availabilityTimezone, setAvailabilityTimezone] = useState<string>(initial.availabilityTimezone || "");
  const [workingHours, setWorkingHours] = useState(initial.workingHours || {
    monday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    tuesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    wednesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    thursday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    friday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    saturday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    sunday: { enabled: false, startTime: "09:00", endTime: "17:00" },
  });

  // Convert countries, regions, cities arrays to formatted string for textarea
  const formatLocations = () => {
    const locations = [];
    if (initial.countries && initial.countries.length > 0) {
      const countryNames = initial.countries.map(code => {
        const country = options.countries.find(c => c.value === code);
        return country ? country.label : code;
      });
      locations.push(...countryNames);
    }
    if (initial.regions && initial.regions.length > 0) {
      const regionNames = initial.regions.map(id => {
        const region = options.regions.find(r => r.value === id);
        return region ? region.label : id;
      });
      locations.push(...regionNames);
    }
    if (initial.cities && initial.cities.length > 0) {
      const cityNames = initial.cities.map(id => {
        const city = options.cities.find(c => c.value === id);
        return city ? city.label : id;
      });
      locations.push(...cityNames);
    }
    return locations.join("\n");
  };

  return (
    <form action={formAction} className="space-y-6" encType="multipart/form-data">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="languages" value={JSON.stringify(languages)} />
      <input type="hidden" name="timezone" value={timezone} />
      <input type="hidden" name="availabilityTimezone" value={availabilityTimezone} />
      <input type="hidden" name="workingHours" value={JSON.stringify(workingHours)} />

      <Section title="Basic Information" description="Update your professional details">
        <TextInput
          label="Business Name / Full Name"
          name="businessName"
          placeholder="Your professional name"
          defaultValue={initial.businessName || ""}
        />
        <TextInput
          label="Years of Guiding Experience"
          name="yearsExperience"
          type="number"
          min="0"
          defaultValue={initial.yearsExperience || ""}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Hourly Rate (in dollars)"
            name="hourlyRate"
            type="number"
            min="0"
            placeholder="e.g., 50"
            defaultValue={initial.hourlyRateCents ? (initial.hourlyRateCents / 100).toString() : ""}
          />
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">Currency</span>
            <select
              name="currency"
              defaultValue={initial.currency || "USD"}
              className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="VND">VND (₫)</option>
              <option value="THB">THB (฿)</option>
              <option value="GBP">GBP (£)</option>
            </select>
          </label>
        </div>
      </Section>

      <Section title="Credentials & Licensing">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="License number" name="licenseNumber" placeholder="Enter N/A if not available" />
          <TextInput label="Issuing authority" name="licenseAuthority" placeholder="Enter N/A if not available" />
        </div>
        <FileInput
          label="Upload official guide license"
          name="licenseProof"
          hint="JPEG or PNG, max 5MB."
        />
        <FileInput
          label="Upload ID / passport copy"
          name="idDocument"
          hint="JPEG or PNG, max 5MB."
        />
      </Section>

      <Section title="Specializations & Expertise">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Languages spoken</label>
          <p className="text-xs text-foreground/60">Select every language you are comfortable guiding in.</p>
          <CustomLanguageInput value={languages} onChange={setLanguages} />
        </div>
        <CheckboxGroup
          label="Tour specializations"
          name="guideSpecialties"
          options={GUIDE_SPECIALTY_OPTIONS}
          defaultChecked={initial.specialties || []}
        />
        <TextArea
          label="Regions / destinations licensed to operate"
          name="operatingRegions"
          rows={3}
          placeholder="Hanoi&#10;Ho Chi Minh City&#10;Halong Bay"
          defaultValue={formatLocations()}
        />
      </Section>

      <Section title="Profile & Portfolio">
        <FileInput
          label="Profile photo"
          name="profilePhoto"
          hint="This image appears on your public profile. JPEG or PNG, max 5MB."
          currentFile={initial.avatarUrl}
        />
        <TextArea
          label="Short introduction"
          name="professionalIntro"
          rows={3}
          placeholder="Who you are and what visitors can expect."
          defaultValue={initial.bio || ""}
        />
        <TextArea
          label="Experience summary"
          name="experienceSummary"
          rows={4}
          placeholder="Notable clients, training, highlights."
        />
        <TextArea
          label="Sample itineraries (title | link per line)"
          name="sampleItineraries"
          rows={3}
          placeholder="Old Quarter Food Tour | https://...&#10;Saigon After Dark | https://..."
        />
        <TextArea
          label="Photos or videos (title | link per line)"
          name="mediaGallery"
          rows={3}
          placeholder="Profile photo | https://...&#10;Tour highlight | https://..."
        />
      </Section>

      <Section title="Availability & Contact" description="Set your timezone and working hours">
        <TimezoneSelect
          label="Primary timezone"
          value={timezone}
          onChange={setTimezone}
          id="timezone"
        />
        <TimezoneSelect
          label="Availability timezone"
          value={availabilityTimezone}
          onChange={setAvailabilityTimezone}
          id="availabilityTimezone"
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Working hours</label>
          <p className="text-xs text-foreground/60">Set your typical working hours for each day of the week.</p>
          <WorkingHoursInput value={workingHours} onChange={setWorkingHours} />
        </div>
        <TextArea
          label="Availability notes"
          name="availabilityNotes"
          rows={2}
          placeholder="Any additional notes about your availability"
        />
      </Section>

      <div className="flex items-center justify-end gap-4">
        {state.message ? (
          <p className={`text-sm ${state.ok ? "text-emerald-600" : "text-red-600"}`}>
            {state.ok ? "Profile updated successfully!" : `Update failed: ${state.message}`}
          </p>
        ) : null}
        <SubmitButton label="Save Profile" />
      </div>
    </form>
  );
}
