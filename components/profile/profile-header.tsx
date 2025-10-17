import Link from "next/link";
import clsx from "clsx";
import type { Route } from "next";

type ProfileHeaderProps = {
  title: string;
  subtitle?: string;
  breadcrumbs: Array<{ label: string; href: string }>;
  badges?: string[];
  actions?: Array<{ label: string; href: string }>;
};

export function ProfileHeader({ title, subtitle, breadcrumbs, badges = [], actions = [] }: ProfileHeaderProps) {
  return (
    <header className="space-y-6">
      <nav className="flex flex-wrap items-center gap-2 text-xs text-foreground/60">
        {breadcrumbs.map((crumb, index) => (
          <span key={crumb.href} className="flex items-center gap-2">
            <Link href={crumb.href as Route} className="transition hover:text-foreground">
              {crumb.label}
            </Link>
            {index < breadcrumbs.length - 1 ? <span>/</span> : null}
          </span>
        ))}
      </nav>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{title}</h1>
          {subtitle ? <p className="text-sm text-foreground/70">{subtitle}</p> : null}
          {badges.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {badges.map((badge) => (
                <span
                  key={badge}
                  className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-primary"
                >
                  {badge}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        {actions.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {actions.map((action, index) => (
              <Link
                key={action.href}
                href={action.href as Route}
                className={clsx(
                  "rounded-full px-5 py-2 text-sm font-semibold transition",
                  index === 0
                    ? "bg-primary text-primary-foreground shadow-sm hover:shadow-md"
                    : "border border-secondary text-secondary hover:bg-secondary hover:text-secondary-foreground"
                )}
              >
                {action.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
