"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";

export function Hero() {
  const t = useTranslations("home.hero");
  const params = useParams();
  const locale = params.locale as string;

  return (
    <section className="relative flex min-h-[500px] flex-col items-center justify-center gap-8 px-6 py-16 text-center sm:px-12 lg:px-24">
      {/* Background with white color */}
      <div className="absolute inset-0 bg-white -z-10" aria-hidden="true" />

      {/* Content */}
      <div className="mx-auto w-full max-w-5xl space-y-6">
        {/* H1 Title - Roboto Black in Brand Primary Green */}
        <h1 className="font-roboto text-4xl font-black leading-tight text-brand-primary sm:text-5xl md:text-6xl lg:text-7xl">
          {t("title")}
        </h1>

        {/* Subtitle - Inter Regular in Navy Blue */}
        <p className="font-inter mx-auto max-w-3xl text-lg text-brand-navy sm:text-xl md:text-2xl">
          {t("subtitle")}
        </p>

        {/* Primary CTA Button */}
        <div className="pt-4">
          <Link
            href={`/${locale}/directory`}
            className="inline-flex items-center justify-center rounded-2xl bg-brand-primary px-8 py-4 text-lg font-medium text-brand-ink transition-all hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50 sm:px-10 sm:py-5 sm:text-xl"
          >
            {t("primaryCta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
