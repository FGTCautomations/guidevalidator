import Link from "next/link";
import { homeContent } from "@/content/home";

export function GlobalCTA() {
  const { title, subtitle, buttons } = homeContent.globalCta;

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-16 sm:px-12 lg:px-24">
      {/* Container with background */}
      <div className="rounded-2xl bg-brand-bg border border-brand-neutral p-8 text-center shadow-lg sm:p-12 lg:p-16">
        {/* Title - Roboto Bold (H2) */}
        <h2 className="font-roboto mb-6 text-3xl font-bold text-brand-navy sm:text-4xl md:text-5xl">
          {title}
        </h2>

        {/* Subtitle - Inter Regular */}
        <p className="font-inter mx-auto mb-10 max-w-3xl text-lg text-foreground/80 sm:text-xl">
          {subtitle}
        </p>

        {/* CTA Buttons Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {buttons.map((button) => (
            <Link
              key={button.text}
              href={button.href}
              className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-6 py-4 text-base font-medium text-brand-ink transition-all hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 sm:text-lg"
            >
              {button.text}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
