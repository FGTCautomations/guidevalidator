"use client";

import { useFormStatus } from "react-dom";

import { updateJobApplicationStatusAction } from "@/app/_actions/jobs";
import type { JobApplicationSummary } from "@/lib/jobs/types";

type ButtonVariant = "accept" | "reject" | "reset";

function StatusButton({ value, label, variant }: { value: string; label: string; variant: ButtonVariant }) {
  const { pending } = useFormStatus();
  const base = "rounded-full px-4 py-1 text-xs font-semibold transition";
  const variants: Record<ButtonVariant, string> = {
    accept: "bg-emerald-600 text-white hover:bg-emerald-700",
    reject: "bg-red-600 text-white hover:bg-red-700",
    reset: "bg-foreground/5 text-foreground hover:bg-foreground/10",
  } as const;

  return (
    <button
      type="submit"
      name="status"
      value={value}
      disabled={pending}
      className={`${base} ${variants[variant]} disabled:opacity-60`}
    >
      {pending ? "�" : label}
    </button>
  );
}

type JobApplicantReviewPanelProps = {
  jobId: string;
  locale: string;
  currency: string;
  applications: JobApplicationSummary[];
  copy: {
    heading: string;
    empty: string;
    submittedAt: string;
    budget: string;
    availability: string;
    languages: string;
    specialties: string;
    statusLabel: Record<string, string>;
    accept: string;
    reject: string;
    reset: string;
  };
};

export function JobApplicantReviewPanel({ jobId, locale, currency, applications, copy }: JobApplicantReviewPanelProps) {
  return (
    <section className="space-y-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white p-6 shadow-sm">
      <header className="space-y-1">
        <h2 className="text-lg font-semibold text-foreground">{copy.heading}</h2>
        <p className="text-xs text-foreground/60">
          {applications.length} {applications.length === 1 ? "application" : "applications"}
        </p>
      </header>

      {applications.length === 0 ? (
        <p className="rounded-xl border border-dashed border-foreground/10 bg-background/60 px-4 py-8 text-center text-sm text-foreground/60">
          {copy.empty}
        </p>
      ) : (
        <div className="space-y-4">
          {applications.map((application) => {
            const statusLabel = copy.statusLabel[application.status] ?? application.status;
            const budget =
              typeof application.budgetExpectationCents === "number"
                ? new Intl.NumberFormat(undefined, { style: "currency", currency }).format(application.budgetExpectationCents / 100)
                : "�";

            // Wrap the action to handle form submission
            const handleFormAction = async (formData: FormData) => {
              await updateJobApplicationStatusAction({ ok: true }, formData);
            };

            return (
              <form
                key={application.id}
                action={handleFormAction}
                className="space-y-3 rounded-xl border border-foreground/10 bg-background/80 p-4"
              >
                <input type="hidden" name="locale" value={locale} />
                <input type="hidden" name="jobId" value={jobId} />
                <input type="hidden" name="applicationId" value={application.id} />

                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold text-foreground">{application.guideName ?? "Unknown Guide"}</h3>
                    <p className="text-xs text-foreground/60">
                      {copy.submittedAt.replace("{date}", new Date(application.submittedAt).toLocaleString())}
                    </p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-foreground/10 px-3 py-1 text-xs font-medium text-foreground">
                    {statusLabel}
                  </span>
                </div>

                {application.coverLetter ? (
                  <p className="whitespace-pre-line rounded-xl bg-white px-3 py-3 text-sm text-foreground/80">
                    {application.coverLetter}
                  </p>
                ) : null}

                <dl className="grid gap-3 text-xs text-foreground/70 md:grid-cols-3">
                  <div className="space-y-1">
                    <dt className="font-medium uppercase tracking-wide">{copy.budget}</dt>
                    <dd>{budget}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium uppercase tracking-wide">{copy.availability}</dt>
                    <dd>
                      {[application.availabilityStart, application.availabilityEnd].filter(Boolean).join(" � ") || "�"}
                    </dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium uppercase tracking-wide">{copy.languages}</dt>
                    <dd>{application.languages.length > 0 ? application.languages.join(", ") : "�"}</dd>
                  </div>
                  <div className="space-y-1">
                    <dt className="font-medium uppercase tracking-wide">{copy.specialties}</dt>
                    <dd>{application.specialties.length > 0 ? application.specialties.join(", ") : "�"}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2">
                  <StatusButton value="accepted" label={copy.accept} variant="accept" />
                  <StatusButton value="rejected" label={copy.reject} variant="reject" />
                  {application.status !== "pending" ? (
                    <StatusButton value="pending" label={copy.reset} variant="reset" />
                  ) : null}
                </div>
              </form>
            );
          })}
        </div>
      )}
    </section>
  );
}

