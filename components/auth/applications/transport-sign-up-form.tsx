"use client";

import { useState } from "react";
import { useFormState } from "react-dom";

import { submitTransportApplicationAction, TRANSPORT_APPLICATION_INITIAL_STATE, type TransportApplicationState } from "@/app/[locale]/auth/sign-up/transport/actions";
import { TimezoneSelect } from "@/components/form/timezone-select";
import { WorkingHoursInput } from "@/components/form/working-hours-input";
import { PlanSelector } from "@/components/form/plan-selector";
import { CustomLanguageInput } from "@/components/form/custom-language-input";
import { LoginCredentialsInput } from "@/components/form/login-credentials-input";
import { MultiCountryLocationSelectorDB, type LocationSelection } from "@/components/form/multi-country-location-selector-db";

export type TransportSignUpFormProps = {
  locale: string;
  countries: Array<{ code: string; name: string }>;
  preselectedPlan?: string;
};

const COUNTRY_PLACEHOLDER = "--";

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

export function TransportSignUpForm({ locale, countries, preselectedPlan }: TransportSignUpFormProps) {
  const [state, formAction] = useFormState<TransportApplicationState, FormData>(submitTransportApplicationAction, TRANSPORT_APPLICATION_INITIAL_STATE);

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

      <Section title="Company registration" description="Provide the legal details of your transport organisation.">
        <TextInput label="Legal entity name" name="legalEntityName" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Registration / trade license number" name="registrationNumber" required />
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">Country of registration <span className="text-red-500">*</span></span>
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
          label="Company address"
          name="companyAddress"
          rows={3}
          required />
      </Section>

      <Section title="Official contact details" description="Primary channels we will use for verification and billing.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Official email" name="contactEmail" type="email" required autoComplete="email" />
          <TextInput label="Phone / WhatsApp" name="contactPhone" required />
        </div>
        <TextInput label="Website URL" name="websiteUrl" required placeholder="https://..." />
        <TextInput label="Logo URL" name="logoUrl" required placeholder="https://..." />
        <TextArea
          label="Short description / tagline"
          name="shortDescription"
          rows={3}
          required
          placeholder="Safe and reliable fleet serving Central Vietnam since 2008."
        />
      </Section>

      <Section title="Fleet licensing & insurance" description="Share the documents that prove your fleet is licensed and covered.">
        <TextArea
          label="Fleet documents (title | link per line)"
          name="fleetDocuments"
          rows={3}
          required
          placeholder="Vehicle registration | https://...\nOperating permit | https://..."
        />
        <TextArea
          label="Insurance documents (title | link per line)"
          name="insuranceDocuments"
          rows={3}
          required
          placeholder="Passenger liability insurance | https://..."
        />
        <TextArea
          label="Safety certifications (one per line)"
          name="safetyCertifications"
          rows={3}
          required
          placeholder="ISO 39001\nLocal transport authority certificate"
        />
      </Section>

      <Section title="Representative" description="Who can we contact about this application?">
        <TextInput label="Contact person name" name="representativeName" required />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Position / role" name="representativeRole" required />
          <TextInput label="Email" name="representativeEmail" required type="email" />
        </div>
        <TextInput label="Phone" name="representativePhone" required />
      </Section>

      <Section title="Services & coverage" description="Help partners understand where and how you operate.">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Service Coverage <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-foreground/60">
            Select all countries, regions, cities, and areas where you provide transport services
          </p>
          <MultiCountryLocationSelectorDB
            value={locationData}
            onChange={setLocationData}
            required
          />
        </div>
        <TextArea
          label="Fleet overview (vehicle type | capacity per line)"
          name="fleetOverview"
          rows={3}
          required
          placeholder="Luxury van | 7 seats\nMini coach | 24 seats"
        />
        <TextArea
          label="Service types"
          name="serviceTypes"
          rows={3}
          required
          placeholder="Airport transfers\nCorporate shuttles\nPrivate chauffeur"
        />
        <TextArea
          label="Safety & comfort features"
          name="safetyFeatures"
          rows={3}
          required
          placeholder="Wi-Fi\nChild seats on request\nWheelchair accessible"
        />
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Languages spoken by drivers / staff</label>
          <p className="text-xs text-foreground/60">Select every language your staff can communicate in.</p>
          <CustomLanguageInput value={languages} onChange={setLanguages} />
        </div>
      </Section>

      <Section title="Portfolio & references">
        <TextArea
          label="Media gallery (title | link per line)"
          name="mediaGallery"
          rows={3}
          required
          placeholder="Luxury coach interior | https://..."
        />
        <TextArea
          label="Client references (name | testimonial or link per line)"
          name="clientReferences"
          rows={3}
          required
          placeholder="Atlas Travel | Provided 20-coach convoy for MICE 2024"
        />
      </Section>

      <Section title="Availability & booking" description="Let partners know how to work with you.">
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
          <p className="text-xs text-foreground/60">Set your typical operating hours for each day of the week.</p>
          <WorkingHoursInput value={workingHours} onChange={(value) => setWorkingHours(value as any)} />
        </div>
        <TextArea
          label="Availability notes"
          name="availabilityNotes"
          rows={2}
          required
          placeholder="Available daily 06:00-22:00. Peak season surcharges apply."
        />
        <TextArea
          label="Booking channels (channel | details per line)"
          name="bookingInfo"
          rows={3}
          required
          placeholder="Email | bookings@yourtransport.com\nWhatsApp | +84 000 000 000"
        />
        <TextArea
          label="Pricing summary (service | rate notes per line)"
          name="pricingSummary"
          rows={3}
          required
          placeholder="Airport transfer | from EUR 45\nFull-day charter | from EUR 220"
        />
      </Section>

      <Section title="Subscription & billing">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Select your plan</label>
          <PlanSelector
            role="transport"
            value={subscriptionPlan}
            onChange={setSubscriptionPlan}
            preselectedPlan={preselectedPlan}
          />
        </div>
        <TextArea
          label="Billing notes"
          name="billingNotes"
          rows={2}
          required placeholder="Billing entity, VAT requirements, etc" />
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
          Submit transport application
        </button>
      </div>
    </form>
  );
}



