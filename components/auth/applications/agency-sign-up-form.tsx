"use client";

import { useMemo, useState } from "react";
import { useFormState } from "react-dom";

import { ORGANIZATION_SPECIALTY_OPTIONS, PROFILE_LANGUAGE_CODES } from "@/lib/constants/profile";
import { AGENCY_APPLICATION_INITIAL_STATE, type AgencyApplicationState } from "@/lib/forms/agency-application-state";
import { submitAgencyApplicationAction } from "@/app/[locale]/auth/sign-up/agency/actions";
import { TimezoneSelect } from "@/components/form/timezone-select";
import { WorkingHoursInput } from "@/components/form/working-hours-input";
import { PlanSelector } from "@/components/form/plan-selector";
import { CustomLanguageInput } from "@/components/form/custom-language-input";
import { LoginCredentialsInput } from "@/components/form/login-credentials-input";
import { MultiCountryLocationSelector, type LocationSelection } from "@/components/form/multi-country-location-selector";

export type AgencySignUpFormProps = {
  locale: string;
  countries: Array<{ code: string; name: string }>;
  preselectedPlan?: string;
};

const COUNTRY_PLACEHOLDER = "--";

const AGENCY_FOCUS_OPTIONS = [
  "Adventure travel",
  "Luxury experiences",
  "Cultural immersion",
  "Sustainable travel",
  "Medical tourism",
  "MICE & corporate",
  "Educational travel",
  "Sports & events",
  "Cruise operations",
  "Faith-based travel",
] as const;

function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
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
  hint,
  required = false,
}: {
  label: string;
  name: string;
  hint?: string;
  required?: boolean;
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

export function AgencySignUpForm({ locale, countries, preselectedPlan }: AgencySignUpFormProps) {
  const [state, formAction] = useFormState<AgencyApplicationState, FormData>(
    submitAgencyApplicationAction,
    AGENCY_APPLICATION_INITIAL_STATE
  );

  // New form state
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

  const specialtyOptions = useMemo(
    () => ORGANIZATION_SPECIALTY_OPTIONS.map((value) => ({ value, label: value })),
    []
  );

  const focusOptions = useMemo(
    () => AGENCY_FOCUS_OPTIONS.map((value) => ({ value, label: value })),
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

      <Section title="Company Registration" description="Provide the legal information for your organisation.">
        <TextInput label="Legal company name" name="legalCompanyName" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Registration number / business license" name="registrationNumber" required />
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">
              Country of registration <span className="text-red-500">*</span>
            </span>
            <select
              name="registrationCountry"
              required
              defaultValue={COUNTRY_PLACEHOLDER}
              className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value={COUNTRY_PLACEHOLDER}>-- Please select --</option>
              {countries.map((country) => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </label>
        </div>
        <TextArea
          label="Business address"
          name="businessAddress"
          rows={3}
          required />
      </Section>

      <Section title="Official contact details" description="These details stay private and are used for verification.">
        <TextInput label="Business email" name="contactEmail" type="email" required autoComplete="email" />
        <TextInput label="Phone / WhatsApp" name="contactPhone" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Website URL" name="websiteUrl" required placeholder="https://" />
          <TextInput label="Tax ID / VAT number" name="taxId" required />
        </div>
        <TextArea
          label="Social media links"
          name="socialLinks"
          rows={3}
          required
          placeholder="instagram | https://instagram.com/youragency\nlinkedin | https://linkedin.com/company/youragency"
        />
        <FileInput
          label="Upload agency license"
          name="licenseProof"
          required
          hint="JPEG or PNG, max 5MB. Required. Visible to (super) admins only."
        />
      </Section>

      <Section title="Public profile" description="Assets displayed on your marketplace profile.">
        <TextInput label="Logo URL" name="logoUrl" required placeholder="https://..." />
        <TextInput label="Proof of activity URL" name="proofOfActivityUrl" required placeholder="https://..." />
      </Section>

      <Section title="Representative" description="Who should we contact about this application?">
        <TextInput label="Contact person name" name="representativeName" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Position / role" name="representativeRole" required />
          <TextInput label="Email" name="representativeEmail" required type="email" />
        </div>
        <TextInput label="Phone" name="representativePhone" required />
        <FileInput
          label="ID / passport copy"
          name="representativeIdDocument"
          required
          hint="JPEG or PNG, max 5MB. Required. Visible only to (super) admins."
        />
      </Section>

      <Section title="Services & portfolio" description="Share what you offer visitors and partners.">
        <CheckboxGroup
          label="Services offered"
          name="servicesOffered"
          options={specialtyOptions}
        />
        <CheckboxGroup
          label="Niche focus"
          name="nicheFocus"
          options={focusOptions}
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Destination Coverage <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-foreground/60">
            Select all countries, regions, and cities where you offer travel services
          </p>
          <MultiCountryLocationSelector
            value={locationData}
            onChange={setLocationData}
            countries={countries}
            required
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Languages spoken</label>
          <CustomLanguageInput value={languages} onChange={setLanguages} />
        </div>
        <TextArea
          label="Certifications & memberships"
          name="certifications"
          rows={2}
          required
          placeholder="IATA\nASTA\nLocal tourism board"
        />
        <TextArea
          label="Portfolio links"
          name="portfolioLinks"
          rows={3}
          required
          placeholder="https://youragency.com/sample-tour\nhttps://youragency.com/case-study"
        />
        <TextArea
          label="Testimonials"
          name="testimonials"
          rows={3}
          required
          placeholder="Client name - short testimonial"
        />
        <TextArea
          label="Company description / mission"
          name="companyDescription"
          rows={4}
          required />
      </Section>

      <Section title="Availability & contact" description="Let partners know how and when to reach you.">
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
          label="Preferred contact channels"
          name="contactMethods"
          rows={3}
          required
          placeholder="Email | partnerships@youragency.com\nWhatsApp | +34 000 000 000\nBooking link | https://cal.com/your-agency"
        />
      </Section>

      <Section title="Subscription & billing">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Select your plan</label>
          <PlanSelector
            role="agency"
            value={subscriptionPlan}
            onChange={setSubscriptionPlan}
            preselectedPlan={preselectedPlan}
          />
        </div>
        <TextArea
          label="Billing notes"
          name="billingNotes"
          rows={3}
          required
          placeholder="Legal billing entity, VAT rules, etc" />
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
          Submit travel agency application
        </button>
      </div>
    </form>
  );
}


