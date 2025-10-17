"use client";

import { useState } from "react";
import { useFormState } from "react-dom";

import { submitDmcApplicationAction } from "@/app/[locale]/auth/sign-up/dmc/actions";
import { DMC_APPLICATION_INITIAL_STATE, type DmcApplicationState } from "@/app/[locale]/auth/sign-up/dmc/types";
import { TimezoneSelect } from "@/components/form/timezone-select";
import { WorkingHoursInput } from "@/components/form/working-hours-input";
import { PlanSelector } from "@/components/form/plan-selector";
import { CustomLanguageInput } from "@/components/form/custom-language-input";
import { LoginCredentialsInput } from "@/components/form/login-credentials-input";
import { MultiCountryLocationSelectorDB, type LocationSelection } from "@/components/form/multi-country-location-selector-db";

export type DmcSignUpFormProps = {
  locale: string;
  countries: Array<{ code: string; name: string }>;
  preselectedPlan?: string;
};

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
  autoComplete,
  defaultValue,
  minLength,
  maxLength,
  required = false,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  autoComplete?: string;
  defaultValue?: string;
  minLength?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">{label}</span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        minLength={minLength}
        maxLength={maxLength}
        required={required}
        className="rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}

export function DmcSignUpForm({ locale, countries, preselectedPlan }: DmcSignUpFormProps) {
  const [state, formAction] = useFormState<DmcApplicationState, FormData>(submitDmcApplicationAction, DMC_APPLICATION_INITIAL_STATE);

  // Form state for components
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

  return (
    <form action={formAction} className="space-y-6">
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

      <Section title="Company registration" description="Provide official details about your destination management company.">
        <TextInput label="Legal entity name" name="legalEntityName" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Registration / trade license number" name="registrationNumber" required />
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">Country of incorporation <span className="text-red-500">*</span></span>
            <select
              name="registrationCountry"
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
        <TextArea
          label="Office address"
          name="officeAddress"
          rows={3}
          required />
      </Section>

      <Section title="Official contact details">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Official email" name="contactEmail" type="email" required />
          <TextInput label="Phone" name="contactPhone" required />
        </div>
        <TextInput label="Website URL" name="websiteUrl" required placeholder="https://..." />
        <TextInput label="Tax / VAT number" name="taxId" required />
        <TextInput label="License / accreditation upload link" name="licenseUrl" required placeholder="https://..." />
        <TextArea
          label="Memberships (one per line)"
          name="memberships"
          rows={2}
          required
          placeholder="PATA
SITE
Local convention bureau"
        />
      </Section>

      <Section title="Public profile" description="Information displayed to partners and visitors.">
        <TextInput label="Logo URL" name="logoUrl" required placeholder="https://..." />
        <TextArea
          label="About us / mission statement"
          name="companyOverview"
          rows={4}
          required />
      </Section>

      <Section title="Representative">
        <TextInput label="Key contact name" name="representativeName" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Position" name="representativeRole" required />
          <TextInput label="Email" name="representativeEmail" required type="email" />
        </div>
        <TextInput label="Phone" name="representativePhone" required />
      </Section>

      <Section title="Destination coverage & services">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Destination Coverage <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-foreground/60">
            Select all countries, regions, cities, and national parks where you provide DMC services
          </p>
          <MultiCountryLocationSelectorDB
            value={locationData}
            onChange={setLocationData}
            required
          />
        </div>
        <TextArea
          label="Services offered"
          name="servicesOffered"
          rows={3}
          required
          placeholder="Ground handling
Incentive trips
Corporate events"
        />
        <TextArea
          label="Specialisations"
          name="specializations"
          rows={3}
          required
          placeholder="Luxury travel
Adventure
Medical tourism"
        />
      </Section>

      <Section title="Portfolio & media">
        <TextArea
          label="Highlight projects (title | link per line)"
          name="portfolioExamples"
          rows={3}
          required
          placeholder="Corporate incentive | https://...
Cultural circuit | https://..."
        />
        <TextArea
          label="Photos or videos (title | link)"
          name="mediaGallery"
          rows={3}
          required
          placeholder="Event highlight | https://..."
        />
        <TextArea
          label="Client references (name | testimonial/link)"
          name="clientReferences"
          rows={3}
          required
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
        <TextInput label="Typical response time" name="responseTime" required placeholder="Within 24 hours" />
        <TextArea
          label="Practical information (office hours, response time)"
          name="practicalInfo"
          rows={3}
          required
        />
      </Section>

      <Section title="Languages & certifications">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Languages spoken by staff</label>
          <p className="text-xs text-foreground/60">Select every language your team can communicate in.</p>
          <CustomLanguageInput value={languages} onChange={setLanguages} />
        </div>
        <TextArea
          label="Certifications"
          name="certifications"
          rows={2}
          required />
      </Section>

      <Section title="Subscription & billing">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Select your plan</label>
          <PlanSelector
            role="dmc"
            value={subscriptionPlan}
            onChange={setSubscriptionPlan}
            preselectedPlan={preselectedPlan}
          />
        </div>
        <TextArea
          label="Preferred contact channels (channel | value per line)"
          name="contactMethods"
          rows={3}
          required
          placeholder="Email | sales@yourdmc.com
WhatsApp | +34 000 000 000"
        />
        <TextArea
          label="Billing notes"
          name="billingNotes"
          rows={2}
          required placeholder="Billing entity, VAT, etc" />
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
          Submit DMC application
        </button>
      </div>
    </form>
  );
}



