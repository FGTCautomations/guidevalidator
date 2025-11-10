export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Route } from "next";

import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";

const ROLE_CARDS = [
  {
    key: "guide",
    title: "Licensed Guide",
    description: "Submit your credentials, specialties, and availability to join the directory.",
    href: (locale: string) => `/${locale}/auth/sign-up/guide`,
  },
  {
    key: "agency",
    title: "Travel Agency",
    description: "Share your registration details and portfolio so vetted partners can connect.",
    href: (locale: string) => `/${locale}/auth/sign-up/agency`,
  },
  {
    key: "dmc",
    title: "Destination Management Company",
    description: "Highlight your destination expertise, services, and case studies.",
    href: (locale: string) => `/${locale}/auth/sign-up/dmc`,
  },
  {
    key: "transport",
    title: "Transport Provider",
    description: "Register your licensed fleet, safety documents, and service areas.",
    href: (locale: string) => `/${locale}/auth/sign-up/transport`,
  },
];

type SignUpLandingProps = {
  params: { locale: string };
};

export default function SignUpLanding({ params }: SignUpLandingProps) {
  const { locale } = params;

  if (!isSupportedLocale(locale)) {
    return null;
  }

  const resolvedLocale = locale as SupportedLocale;

  return (
    <div className="flex min-h-[calc(100vh-6rem)] flex-col items-center bg-background px-6 py-16 text-foreground sm:px-12 lg:px-24">
      <div className="w-full max-w-4xl space-y-6">
        <div className="space-y-3 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Create your Guide Validator account</h1>
          <p className="text-base text-foreground/70 sm:text-lg">
            Choose the profile type that best represents your role in the travel ecosystem. We'll collect the right
            information to verify and publish your presence across the marketplace.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {ROLE_CARDS.map((card) => (
            <Link
              key={card.key}
              href={card.href(resolvedLocale) as Route}
              className="group flex h-full flex-col justify-between rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="space-y-2">
                <h2 className="text-xl font-semibold text-foreground group-hover:text-primary">{card.title}</h2>
                <p className="text-sm text-foreground/70">{card.description}</p>
              </div>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary group-hover:gap-3">
                Start as {card.title}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M13.293 4.707a1 1 0 0 1 1.414-1.414l7 7a1 1 0 0 1 0 1.414l-7 7a1 1 0 0 1-1.414-1.414L18.586 13H3a1 1 0 1 1 0-2h15.586l-5.293-5.293z" />
                </svg>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

