"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";

import { GUIDE_SPECIALTY_OPTIONS, PROFILE_LANGUAGE_CODES } from "@/lib/constants/profile";
import { GUIDE_APPLICATION_INITIAL_STATE, type GuideApplicationState } from "@/lib/forms/guide-application-state";
import { submitGuideApplicationAction } from "@/app/[locale]/auth/sign-up/guide/actions";
import { TimezoneSelect } from "@/components/form/timezone-select";
import { WorkingHoursInput } from "@/components/form/working-hours-input";
import { PlanSelector } from "@/components/form/plan-selector";
import { CustomLanguageInput } from "@/components/form/custom-language-input";
import { LoginCredentialsInput } from "@/components/form/login-credentials-input";
import { MultiCountryLocationSelectorDB, type LocationSelection } from "@/components/form/multi-country-location-selector-db";

export type GuideSignUpFormProps = {
  locale: string;
  countries: Array<{ code: string; name: string }>;
  preselectedPlan?: string;
};

const GUIDE_EXPERTISE_OPTIONS = [
  "History & heritage",
  "Art & architecture",
  "Food & gastronomy",
  "Nature & outdoors",
  "Nightlife & entertainment",
  "Wellness & retreats",
  "Family experiences",
  "Adventure & adrenaline",
  "Shopping & markets",
  "Education & workshops",
] as const;

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
  required = false,
  placeholder,
  autoComplete,
  min,
  defaultValue,
  minLength,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  autoComplete?: string;
  min?: number | string;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        min={min}
        defaultValue={defaultValue}
        minLength={minLength}
        maxLength={maxLength}
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
  required = false,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        required={required}
        className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

function FileInput({
  label,
  name,
  required = false,
  hint,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <input
        type="file"
        name={name}
        accept="image/*"
        required={required}
        className="cursor-pointer rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {hint ? <p className="text-xs text-foreground/60">{hint}</p> : null}
    </label>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  hint,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  hint?: string;
}) {
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-medium text-foreground">{label}</legend>
      {hint ? <p className="text-xs text-foreground/60">{hint}</p> : null}
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {options.map((option) => (
          <label key={option.value} className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              name={name}
              value={option.value}
              className="h-4 w-4 rounded border-foreground/30 text-primary focus:ring-primary/40"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function GuideSignUpForm({ locale, countries, preselectedPlan }: GuideSignUpFormProps) {
  const [state, formAction] = useFormState<GuideApplicationState, FormData>(
    submitGuideApplicationAction,
    GUIDE_APPLICATION_INITIAL_STATE
  );

  // New form state for components
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [timezone, setTimezone] = useState("");
  const [availabilityTimezone, setAvailabilityTimezone] = useState("");
  const [workingHours, setWorkingHours] = useState({
    monday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    tuesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    wednesday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    thursday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    friday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    saturday: { enabled: false, startTime: "09:00", endTime: "17:00" },
    sunday: { enabled: false, startTime: "09:00", endTime: "17:00" },
  });
  const [subscriptionPlan, setSubscriptionPlan] = useState("");
  const [languages, setLanguages] = useState<string[]>([]);
  const [locationData, setLocationData] = useState<LocationSelection>({ countries: [] });

  const languageOptions = useMemo(() => {
    const formatter = typeof Intl.DisplayNames !== "undefined"
      ? new Intl.DisplayNames([locale], { type: "language" })
      : undefined;

    return PROFILE_LANGUAGE_CODES.map((code) => ({
      value: code,
      label: formatter?.of(code) ?? code.toUpperCase(),
    }));
  }, [locale]);

  const specializationOptions = useMemo(
    () => GUIDE_SPECIALTY_OPTIONS.map((item) => ({ value: item, label: item })),
    []
  );

  const expertiseOptions = useMemo(
    () => GUIDE_EXPERTISE_OPTIONS.map((item) => ({ value: item, label: item })),
    []
  );

  return (
    <form action={formAction} className="space-y-6" encType="multipart/form-data">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="email" value={email} />
      <input type="hidden" name="password" value={password} />
      <input type="hidden" name="timezone" value={timezone} />
      <input type="hidden" name="availabilityTimezone" value={availabilityTimezone} />
      <input type="hidden" name="workingHours" value={JSON.stringify(workingHours)} />
      <input type="hidden" name="subscriptionPlan" value={subscriptionPlan} />
      <input type="hidden" name="languages" value={JSON.stringify(languages)} />
      <input type="hidden" name="locationData" value={JSON.stringify(locationData)} />

      <Section title="Account credentials" description="Create your login credentials. Your account will be activated once approved.">
        <LoginCredentialsInput
          email={email}
          password={password}
          confirmPassword={confirmPassword}
          onEmailChange={setEmail}
          onPasswordChange={setPassword}
          onConfirmPasswordChange={setConfirmPassword}
        />
      </Section>

      <Section title="Personal information">
        <TextInput label="Full legal name" name="fullName" required autoComplete="name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Date of birth" name="dateOfBirth" type="date" required />
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">
              Nationality <span className="text-red-500">*</span>
            </span>
            <select
              name="nationality"
              required
              className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="">-- Please select --</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TextInput label="Phone / WhatsApp" name="contactPhone" required />
        <TextInput label="City of residence" name="cityOfResidence" required />
      </Section>

      <Section
        title="Official license"
        description="These documents stay private and are only visible to (super) admins for verification."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="License number" name="licenseNumber" required />
          <TextInput label="Issuing authority" name="licenseAuthority" required />
        </div>
        <FileInput
          label="Upload official guide license"
          name="licenseProof"
          required
          hint="JPEG or PNG, max 5MB. Required."
        />
        <FileInput
          label="Upload ID / passport copy"
          name="idDocument"
          required
          hint="JPEG or PNG, max 5MB. Required."
        />
      </Section>

      <Section title="Specialisations & expertise">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Languages spoken</label>
          <p className="text-xs text-foreground/60">Select every language you are comfortable guiding in.</p>
          <CustomLanguageInput value={languages} onChange={setLanguages} />
        </div>
        <CheckboxGroup
          label="Tour types / specialisations"
          name="specializations"
          options={specializationOptions}
        />
        <CheckboxGroup
          label="Areas of expertise or themes"
          name="expertiseAreas"
          options={expertiseOptions}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Operating Locations <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-foreground/60">
            Select all countries, regions, cities, and national parks where you are licensed to guide
          </p>
          <MultiCountryLocationSelectorDB
            value={locationData}
            onChange={setLocationData}
            required
          />
        </div>
      </Section>

      <Section title="Profile & portfolio">
        <FileInput
          label="Profile photo"
          name="profilePhoto"
          required
          hint="This image appears on your public profile. JPEG or PNG, max 5MB. Required."
        />
        <TextArea
          label="Short introduction"
          name="professionalIntro"
          rows={3}
          required
          placeholder="Who you are and what visitors can expect"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Years of guiding experience" name="experienceYears" type="number" min="0" required />
        </div>
        <TextArea label="Experience summary" name="experienceSummary" rows={4} required placeholder="Notable clients, training, highlights" />
        <TextArea
          label="Sample itineraries (title | link per line)"
          name="sampleItineraries"
          rows={3}
          required
          placeholder="Old Quarter Food Tour | https://...\nSaigon After Dark | https://..."
        />
        <TextArea
          label="Photos or videos (title | link per line)"
          name="mediaGallery"
          rows={3}
          required
          placeholder="Profile photo | https://...\nTour highlight | https://..."
        />
      </Section>

      <Section title="Availability & contact">
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
          <WorkingHoursInput value={workingHours} onChange={(value) => setWorkingHours(value as any)} />
        </div>
        <TextArea
          label="Availability notes"
          name="availabilityNotes"
          rows={2}
          required
          placeholder="Available daily except Mondays. Peak season surcharges apply"
        />
        <TextArea
          label="Contact methods (channel | value per line)"
          name="contactMethods"
          rows={3}
          required
          placeholder="Email | guide@example.com\nWhatsApp | +84 000 000 000\nBooking link | https://cal.com/guide"
        />
      </Section>

      <Section title="Subscription & billing">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Select your plan</label>
          <PlanSelector
            role="guide"
            value={subscriptionPlan}
            onChange={setSubscriptionPlan}
            preselectedPlan={preselectedPlan}
          />
        </div>
        <TextArea label="Billing notes" name="billingNotes" rows={2} required placeholder="Company billing entity, VAT, etc" />
      </Section>

      {state?.status === "error" ? (
        <p className="rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message ?? "We couldn't submit your application. Please review the form and try again."}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-lg"
        >
          Submit guide application
        </button>
      </div>
    </form>
  );
}




