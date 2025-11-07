import Link from "next/link";
import { Compass, Building2, MapPin, Bus } from "lucide-react";
import { homeContent } from "@/content/home";

const iconMap = {
  compass: Compass,
  "building-2": Building2,
  "map-pin": MapPin,
  bus: Bus,
};

export function StakeholderGrid() {
  const stakeholders = homeContent.stakeholders;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-12 lg:px-24">
      {/* Grid Container */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {stakeholders.map((stakeholder) => {
          const Icon = iconMap[stakeholder.icon as keyof typeof iconMap];

          return (
            <article
              key={stakeholder.id}
              className="group flex flex-col rounded-2xl border border-brand-neutral bg-brand-bg p-6 transition-all hover:shadow-lg hover:-translate-y-1 focus-within:ring-4 focus-within:ring-brand-primary/20"
            >
              {/* Icon */}
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-navy">
                <Icon className="h-7 w-7 text-white" aria-hidden="true" />
              </div>

              {/* Title - Roboto SemiBold (H3) */}
              <h3 className="font-roboto mb-4 text-xl font-semibold text-brand-navy">
                {stakeholder.title}
              </h3>

              {/* Benefits List - Inter Regular */}
              <ul className="font-inter mb-6 flex-1 space-y-3 text-sm leading-relaxed text-foreground/80">
                {stakeholder.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-brand-primary"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Link */}
              <Link
                href={stakeholder.cta.href}
                className="font-inter inline-flex items-center text-sm font-medium text-brand-ink underline decoration-brand-primary decoration-2 underline-offset-4 transition-colors hover:text-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
              >
                {stakeholder.cta.text}
                <svg
                  className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}
