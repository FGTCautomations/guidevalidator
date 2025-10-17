"use client";

import { useTransition } from "react";
import { useFormState } from "react-dom";

import { submitJobApplicationAction, type JobActionState } from "@/app/_actions/jobs";

const INITIAL_STATE: JobActionState = { ok: true };

type Option = { value: string; label: string };

type JobApplicationFormProps = {
  jobId: string;
  locale: string;
  options: {
    languages: Option[];
    specialties: Option[];
  };
  copy: {
    heading: string;
    description: string;
    coverLetterLabel: string;
    coverLetterPlaceholder: string;
    budgetExpectationLabel: string;
    availabilityHeading: string;
    availabilityStartLabel: string;
    availabilityEndLabel: string;
    languagesLabel: string;
    languagesPlaceholder: string;
    specialtiesLabel: string;
    specialtiesPlaceholder: string;
    submitLabel: string;
    successMessage: string;
    errorMessage: string;
    alreadyApplied: string;
  };
  existingApplication?: {
    id: string;
    status: string;
    coverLetter?: string | null;
    budgetExpectationCents?: number | null;
    availabilityStart?: string | null;
    availabilityEnd?: string | null;
    languages: string[];
    specialties: string[];
  } | null;
};

export function JobApplicationForm({ jobId, locale, options, copy, existingApplication }: JobApplicationFormProps) {
  const [formState, formAction] = useFormState(submitJobApplicationAction, INITIAL_STATE);
  const [pending, startTransition] = useTransition();

  const budgetDefault = existingApplication?.budgetExpectationCents != null
    ? String(existingApplication.budgetExpectationCents / 100)
    : "";

  const languagesDefault = existingApplication?.languages ?? [];
  const specialtiesDefault = existingApplication?.specialties ?? [];

  const handleSubmit = (formData: FormData) => {
    formData.append("locale", locale);
    formData.append("jobId", jobId);
    startTransition(() => {
      formAction(formData);
    });
  };

  const isSuccess = formState?.ok && formState?.message === "JOB_APPLICATION_SUBMITTED";

  return (
    <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white p-6 shadow-sm">
      <header className="space-y-2">
        <h2 className="text-lg font-semibold text-foreground">{copy.heading}</h2>
        <p className="text-sm text-foreground/70">{copy.description}</p>
        {existingApplication?.status && (
          <p className="text-xs font-medium text-foreground/80">
            {copy.alreadyApplied.replace("{status}", existingApplication.status)}
          </p>
        )}
      </header>

      <form action={handleSubmit} className="space-y-5">
        <label className="flex flex-col gap-2 text-sm text-foreground">
          <span className="font-medium">{copy.coverLetterLabel}</span>
          <textarea
            name="coverLetter"
            placeholder={copy.coverLetterPlaceholder}
            rows={6}
            defaultValue={existingApplication?.coverLetter ?? ""}
            className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
          />
        </label>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.budgetExpectationLabel}</span>
            <input
              type="number"
              name="budgetExpectation"
              min="0"
              step="0.01"
              defaultValue={budgetDefault}
              className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.availabilityStartLabel}</span>
            <input
              type="date"
              name="availableStart"
              defaultValue={existingApplication?.availabilityStart ?? ""}
              className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.availabilityEndLabel}</span>
            <input
              type="date"
              name="availableEnd"
              defaultValue={existingApplication?.availabilityEnd ?? ""}
              className="rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.languagesLabel}</span>
            <select
              name="applicationLanguages"
              multiple
              defaultValue={languagesDefault}
              className="min-h-[120px] rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
            >
              {options.languages.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              name="applicationLanguagesText"
              placeholder={copy.languagesPlaceholder}
              className="rounded-xl border border-dashed border-foreground/15 bg-background/40 px-3 py-2 text-sm"
            />
          </label>

          <label className="flex flex-col gap-2 text-sm text-foreground">
            <span className="font-medium">{copy.specialtiesLabel}</span>
            <select
              name="applicationSpecialties"
              multiple
              defaultValue={specialtiesDefault}
              className="min-h-[120px] rounded-xl border border-foreground/15 bg-background/60 px-3 py-2 text-sm"
            >
              {options.specialties.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <input
              name="applicationSpecialtiesText"
              placeholder={copy.specialtiesPlaceholder}
              className="rounded-xl border border-dashed border-foreground/15 bg-background/40 px-3 py-2 text-sm"
            />
          </label>
        </div>

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

        <button
          type="submit"
          disabled={pending}
          className="rounded-full bg-secondary px-6 py-2 text-sm font-semibold text-secondary-foreground transition hover:bg-secondary/90 disabled:opacity-60"
        >
          {pending ? `${copy.submitLabel} �` : copy.submitLabel}
        </button>
      </form>
    </section>
  );
}
