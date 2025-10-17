import Link from "next/link";
import type { Route } from "next";

export type HeroProps = {
  badgeLabel: string;
  title: string;
  description: string;
  primaryCta: { label: string; href: string };
  secondaryCta: { label: string; href: string };
};

export function HeroSection({ badgeLabel, title, description, primaryCta, secondaryCta }: HeroProps) {
  return (
    <section className="mx-auto w-full max-w-6xl space-y-8 rounded-[var(--radius-2xl)] bg-white/80 p-10 shadow-[var(--shadow-soft)] backdrop-blur">
      <span className="inline-flex items-center rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-secondary">
        {badgeLabel}
      </span>
      <div className="space-y-6">
        <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl md:text-6xl">
          {title}
        </h1>
        <p className="max-w-3xl text-lg text-foreground/80 sm:text-xl">{description}</p>
      </div>
      <div className="flex flex-wrap gap-4">
        <Link
          href={primaryCta.href as Route}
          className="rounded-full bg-primary px-6 py-3 text-base font-semibold text-primary-foreground shadow-sm transition hover:shadow-lg"
        >
          {primaryCta.label}
        </Link>
        <Link
          href={secondaryCta.href as Route}
          className="rounded-full border border-secondary px-6 py-3 text-base font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
        >
          {secondaryCta.label}
        </Link>
      </div>
    </section>
  );
}
