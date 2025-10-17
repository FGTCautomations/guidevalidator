import Link from "next/link";
import type { Route } from "next";

type CallToActionProps = {
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
};

export function CallToAction({ title, body, actionLabel, actionHref }: CallToActionProps) {
  return (
    <section className="mx-auto w-full max-w-6xl">
      <div className="flex flex-col gap-6 rounded-[var(--radius-2xl)] bg-secondary/90 px-8 py-10 text-secondary-foreground shadow-[var(--shadow-soft)] sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{title}</h2>
          <p className="max-w-2xl text-sm sm:text-base">{body}</p>
        </div>
        <Link
          href={actionHref as Route}
          className="inline-flex items-center justify-center rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md"
        >
          {actionLabel}
        </Link>
      </div>
    </section>
  );
}
