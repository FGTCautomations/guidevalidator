"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { GUIDE_SPECIALTY_OPTIONS, PROFILE_LANGUAGE_CODES } from "@/lib/constants/profile";
import { CustomLanguageInput } from "@/components/form/custom-language-input";
import { TimezoneSelect } from "@/components/form/timezone-select";
import { WorkingHoursInput } from "@/components/form/working-hours-input";
import { MultiCountryLocationSelectorDB, type LocationSelection } from "@/components/form/multi-country-location-selector-db";
import { PlanSelector } from "@/components/form/plan-selector";

// GUIDE_EXPERTISE_OPTIONS removed - now consolidated into GUIDE_SPECIALTY_OPTIONS

type ProfileCompletionFormProps = {
  guideId: string;
  profileId: string;
  token: string | null;
  locale: string;
  countries: Array<{ code: string; name: string }>;
  claimedProfile?: boolean;
  initialData: {
    full_name: string;
    headline: string;
    bio: string;
    years_experience: number;
    specialties: string[];
    spoken_languages: string[];
    license_number: string;
    license_authority: string;
    avatar_url: string | null;
  };
};

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
  value,
  onChange,
  min,
  minLength,
  maxLength,
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  value: string | number;
  onChange: (value: string) => void;
  min?: number | string;
  minLength?: number;
  maxLength?: number;
  autoComplete?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        minLength={minLength}
        maxLength={maxLength}
        autoComplete={autoComplete}
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
  value,
  onChange,
}: {
  label: string;
  name: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <textarea
        name={name}
        rows={rows}
        placeholder={placeholder}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
  onChange,
}: {
  label: string;
  name: string;
  required?: boolean;
  hint?: string;
  onChange: (file: File | null) => void;
}) {
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setError(null);

    if (file && file.size > 5 * 1024 * 1024) {
      setError("File size must be less than 5MB");
      e.target.value = "";
      onChange(null);
      return;
    }

    onChange(file);
  };

  return (
    <label className="flex flex-col gap-2 text-sm text-foreground">
      <span className="font-medium">
        {label} {required && <span className="text-red-500">*</span>}
      </span>
      <input
        type="file"
        name={name}
        accept="image/*"
        required={required}
        onChange={handleFileChange}
        className="cursor-pointer rounded-xl border border-foreground/15 bg-background/80 px-3 py-2 text-sm text-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      {error && <p className="text-xs text-red-600">{error}</p>}
      {hint && !error ? <p className="text-xs text-foreground/60">{hint}</p> : null}
    </label>
  );
}

function CheckboxGroup({
  label,
  name,
  options,
  hint,
  value,
  onChange,
}: {
  label: string;
  name: string;
  options: Array<{ value: string; label: string }>;
  hint?: string;
  value: string[];
  onChange: (value: string[]) => void;
}) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...value, optionValue]);
    } else {
      onChange(value.filter(v => v !== optionValue));
    }
  };

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
              checked={value.includes(option.value)}
              onChange={(e) => handleChange(option.value, e.target.checked)}
              className="h-4 w-4 rounded border-foreground/30 text-primary focus:ring-primary/40"
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function ProfileCompletionForm({
  guideId,
  profileId,
  token,
  locale,
  countries,
  initialData,
}: ProfileCompletionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Personal information
  const [fullName, setFullName] = useState(initialData.full_name);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationality, setNationality] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [cityOfResidence, setCityOfResidence] = useState("");

  // Official license
  const [licenseNumber, setLicenseNumber] = useState(initialData.license_number);
  const [licenseAuthority, setLicenseAuthority] = useState(initialData.license_authority);
  const [licenseProof, setLicenseProof] = useState<File | null>(null);
  const [idDocument, setIdDocument] = useState<File | null>(null);

  // Specialisations & expertise
  const [languages, setLanguages] = useState<string[]>(initialData.spoken_languages);
  const [specializations, setSpecializations] = useState<string[]>(initialData.specialties);
  const [locationData, setLocationData] = useState<LocationSelection>({ countries: [] });

  // Profile & portfolio
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [professionalIntro, setProfessionalIntro] = useState("");
  const [experienceYears, setExperienceYears] = useState(initialData.years_experience.toString());
  const [experienceSummary, setExperienceSummary] = useState("");
  const [sampleItineraries, setSampleItineraries] = useState("");
  const [mediaGallery, setMediaGallery] = useState("");

  // Availability & contact
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
  const [availabilityNotes, setAvailabilityNotes] = useState("");
  const [contactMethods, setContactMethods] = useState("");

  // Subscription & billing
  const [subscriptionPlan, setSubscriptionPlan] = useState("free");
  const [billingNotes, setBillingNotes] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Create FormData for file uploads
      const formData = new FormData();
      if (token) {
        formData.append("token", token);
      }
      formData.append("guideId", guideId);
      formData.append("profileId", profileId);

      // Personal information
      formData.append("fullName", fullName);
      formData.append("dateOfBirth", dateOfBirth);
      formData.append("nationality", nationality);
      formData.append("contactPhone", contactPhone);
      formData.append("cityOfResidence", cityOfResidence);

      // Official license
      formData.append("licenseNumber", licenseNumber);
      formData.append("licenseAuthority", licenseAuthority);
      if (licenseProof) formData.append("licenseProof", licenseProof);
      if (idDocument) formData.append("idDocument", idDocument);

      // Specialisations & expertise
      formData.append("languages", JSON.stringify(languages));
      formData.append("specializations", JSON.stringify(specializations));
      formData.append("locationData", JSON.stringify(locationData));

      // Profile & portfolio
      if (profilePhoto) formData.append("profilePhoto", profilePhoto);
      formData.append("professionalIntro", professionalIntro);
      formData.append("experienceYears", experienceYears);
      formData.append("experienceSummary", experienceSummary);
      formData.append("sampleItineraries", sampleItineraries);
      formData.append("mediaGallery", mediaGallery);

      // Availability & contact
      formData.append("timezone", timezone);
      formData.append("availabilityTimezone", availabilityTimezone);
      formData.append("workingHours", JSON.stringify(workingHours));
      formData.append("availabilityNotes", availabilityNotes);
      formData.append("contactMethods", contactMethods);

      // Subscription & billing
      formData.append("subscriptionPlan", subscriptionPlan);
      formData.append("billingNotes", billingNotes);

      const response = await fetch("/api/onboarding/complete-profile", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update profile");
      }

      setSuccess(true);

      // Redirect to edit profile page after 2 seconds
      setTimeout(() => {
        router.push(`/${locale}/account/profile`);
      }, 2000);
    } catch (err) {
      console.error("Profile update error:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-green-600 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-green-900 mb-2">Profile Updated!</h2>
        <p className="text-green-700">
          Your profile has been successfully updated. Redirecting you to your profile page...
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Personal information">
        <TextInput
          label="Full legal name"
          name="fullName"
          required
          autoComplete="name"
          value={fullName}
          onChange={setFullName}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Date of birth"
            name="dateOfBirth"
            type="date"
            required
            value={dateOfBirth}
            onChange={setDateOfBirth}
          />
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">
              Nationality <span className="text-red-500">*</span>
            </span>
            <select
              name="nationality"
              required
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
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
        <TextInput
          label="Phone / WhatsApp"
          name="contactPhone"
          required
          value={contactPhone}
          onChange={setContactPhone}
        />
        <TextInput
          label="City of residence"
          name="cityOfResidence"
          value={cityOfResidence}
          onChange={setCityOfResidence}
        />
      </Section>

      <Section
        title="Official license"
        description="These documents stay private and are only visible to (super) admins for verification."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="License number"
            name="licenseNumber"
            required
            value={licenseNumber}
            onChange={setLicenseNumber}
          />
          <TextInput
            label="Issuing authority"
            name="licenseAuthority"
            required
            value={licenseAuthority}
            onChange={setLicenseAuthority}
          />
        </div>
        <FileInput
          label="Upload official guide license"
          name="licenseProof"
          hint="JPEG or PNG, max 5MB. Optional if already uploaded."
          onChange={setLicenseProof}
        />
        <FileInput
          label="Upload ID / passport copy"
          name="idDocument"
          hint="JPEG or PNG, max 5MB. Optional if already uploaded."
          onChange={setIdDocument}
        />
      </Section>

      <Section title="Specialisations & expertise">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Languages spoken <span className="text-red-500">*</span>
          </label>
          <p className="text-xs text-foreground/60">Select every language you are comfortable guiding in.</p>
          <CustomLanguageInput value={languages} onChange={setLanguages} />
        </div>
        <CheckboxGroup
          label="Tour specializations"
          name="specializations"
          options={specializationOptions}
          value={specializations}
          onChange={setSpecializations}
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
        {initialData.avatar_url && (
          <div className="flex items-start gap-4 rounded-lg border border-foreground/10 bg-background/50 p-4">
            <img
              src={initialData.avatar_url}
              alt="Current profile photo"
              className="h-20 w-20 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Current Profile Photo</p>
              <p className="text-xs text-foreground/60 mt-1">
                You already have a profile photo. Upload a new one below if you want to replace it.
              </p>
            </div>
          </div>
        )}
        <FileInput
          label="Profile photo"
          name="profilePhoto"
          hint="This image appears on your public profile. JPEG or PNG, max 5MB. Optional if already uploaded."
          onChange={setProfilePhoto}
        />
        <TextArea
          label="Short introduction"
          name="professionalIntro"
          rows={3}
          required
          placeholder="Who you are and what visitors can expect"
          value={professionalIntro}
          onChange={setProfessionalIntro}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput
            label="Years of guiding experience"
            name="experienceYears"
            type="number"
            min="0"
            required
            value={experienceYears}
            onChange={setExperienceYears}
          />
        </div>
        <TextArea
          label="Experience summary"
          name="experienceSummary"
          rows={4}
          required
          placeholder="Notable clients, training, highlights"
          value={experienceSummary}
          onChange={setExperienceSummary}
        />
        <TextArea
          label="Sample itineraries (title | link per line)"
          name="sampleItineraries"
          rows={3}
          required
          placeholder="Old Quarter Food Tour | https://...
Saigon After Dark | https://..."
          value={sampleItineraries}
          onChange={setSampleItineraries}
        />
        <TextArea
          label="Photos or videos (title | link per line)"
          name="mediaGallery"
          rows={3}
          required
          placeholder="Profile photo | https://...
Tour highlight | https://..."
          value={mediaGallery}
          onChange={setMediaGallery}
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
          value={availabilityNotes}
          onChange={setAvailabilityNotes}
        />
        <TextArea
          label="Contact methods (channel | value per line)"
          name="contactMethods"
          rows={3}
          required
          placeholder="Email | guide@example.com
WhatsApp | +84 000 000 000
Booking link | https://cal.com/guide"
          value={contactMethods}
          onChange={setContactMethods}
        />
      </Section>

      <Section title="Subscription & billing">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Select your plan</label>
          <PlanSelector
            role="guide"
            value={subscriptionPlan}
            onChange={setSubscriptionPlan}
          />
        </div>
        <TextArea
          label="Billing notes"
          name="billingNotes"
          rows={2}
          placeholder="Company billing entity, VAT, etc (optional)"
          value={billingNotes}
          onChange={setBillingNotes}
        />
      </Section>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-sm transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Saving..." : "Complete Profile"}
        </button>
      </div>
    </form>
  );
}
