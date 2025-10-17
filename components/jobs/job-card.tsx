import Link from "next/link";
import type { Route } from "next";
import type { JobListItem } from "@/lib/jobs/types";

type JobCardProps = {
  job: JobListItem;
  ctaLabel: string;
  localeHrefPrefix: string;
};

function formatDateRange(job: JobListItem) {
  const { startDate, endDate } = job;
  if (!startDate && !endDate) return null;

  if (startDate && endDate) {
    return `${startDate} – ${endDate}`;
  }

  return startDate ?? endDate;
}

function formatBudget(job: JobListItem) {
  const { minCents, maxCents, currency } = job.budget;

  if (minCents == null && maxCents == null) {
    return null;
  }

  const formatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });

  if (minCents != null && maxCents != null) {
    return `${formatter.format(minCents / 100)} – ${formatter.format(maxCents / 100)}`;
  }

  if (minCents != null) {
    return `${formatter.format(minCents / 100)}+`;
  }

  return formatter.format((maxCents ?? 0) / 100);
}

function formatPostedLabel(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return createdAt;
  }

  const diffMs = Date.now() - date.getTime();
  const minute = 1000 * 60;
  const hour = minute * 60;
  const day = hour * 24;
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  if (Math.abs(diffMs) < hour) {
    const minutes = Math.round(diffMs / minute);
    return rtf.format(-minutes, "minute");
  }

  if (Math.abs(diffMs) < day) {
    const hours = Math.round(diffMs / hour);
    return rtf.format(-hours, "hour");
  }

  const days = Math.round(diffMs / day);
  return rtf.format(-days, "day");
}

function formatLocation(job: JobListItem) {
  const { location } = job;
  if (!location) {
    return null;
  }

  const segments = [location.cityName, location.regionName, location.countryName ?? location.countryCode];
  const label = segments.filter(Boolean).join(", ");
  return label || null;
}

export function JobCard({ job, ctaLabel, localeHrefPrefix }: JobCardProps) {
  const postedLabel = formatPostedLabel(job.createdAt);
  const dateRange = formatDateRange(job);
  const budget = formatBudget(job);
  const locationLabel = formatLocation(job);

  return (
    <article className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/85 p-6 shadow-sm">
      <header className="flex flex-col gap-1">
        <div className="flex items-start justify-between">
          <h3 className="text-lg font-semibold text-foreground">{job.title}</h3>
          <span className="text-xs text-foreground/60">{postedLabel}</span>
        </div>
        <p className="text-sm text-foreground/70">{job.agencyName}</p>
      </header>

      <p className="line-clamp-3 text-sm text-foreground/75">{job.description}</p>

      <div className="flex flex-wrap gap-2 text-xs text-foreground/60">
        {locationLabel ? (
          <span className="rounded-full bg-foreground/5 px-3 py-1">{locationLabel}</span>
        ) : null}
        {dateRange ? <span className="rounded-full bg-foreground/5 px-3 py-1">{dateRange}</span> : null}
        {budget ? <span className="rounded-full bg-foreground/5 px-3 py-1">{budget}</span> : null}
      </div>

      {job.specialties.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {job.specialties.map((specialty) => (
            <span key={specialty} className="rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              {specialty}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-foreground/60">
        {job.languages.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {job.languages.map((lang) => (
              <span key={lang} className="rounded-full bg-foreground/5 px-3 py-1 uppercase">
                {lang}
              </span>
            ))}
          </div>
        ) : <span />}
        <Link
          href={`${localeHrefPrefix}${job.href}` as Route}
          className="rounded-full border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
        >
          {ctaLabel}
        </Link>
      </div>
    </article>
  );
}
