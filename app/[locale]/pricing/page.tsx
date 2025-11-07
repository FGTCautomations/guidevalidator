import Link from "next/link";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { PricingCardGrid, type PricingSegment } from "@/components/pricing/pricing-card-grid";

const whyChoose = [
  "Verified professionals only - licences and company registrations are checked before listing.",
  "Global reach with multilingual profiles and search filters for every destination.",
  "Flexible plans that scale from individual guides to multi-market DMCs.",
  "Smart filtering across language, specialties, location, pricing, ratings, gender and verification status.",
  "AI-ready profile structure keeps your services discoverable in emerging channels and languages.",
];

export const metadata = {
  title: "Pricing | Guide Validator",
  description:
    "Transparent pricing for licensed guides, travel agencies, DMCs and transport providers using the Guide Validator marketplace.",
};

type PricingPageProps = { params: { locale: string } };

export default function PricingPage({ params }: PricingPageProps) {
  const withLocale = (pathname: string) => `/${params.locale}${pathname}` as Route;

  const segments: PricingSegment[] = [
    {
      id: "guide",
      label: "Licensed guide",
      tagline: "Build your reputation and stay visible to vetted agencies",
      summary:
        "Start for free, upgrade to premium visibility when you need more leads, and keep your licence up-to-date with our verification workflow.",
      options: [
        {
          id: "guide-free",
          name: "Free plan",
          price: "EUR 0",
          description: "Create your profile, appear in search with basic visibility and collect reviews once verified.",
          ctaLabel: "Sign up as a guide",
          href: withLocale("/auth/sign-up/guide?plan=guide-free"),
        },
        {
          id: "guide-premium-monthly",
          name: "Premium Profile",
          price: "EUR 9.99 / month",
          description: "Priority placement, unlimited introductions and access to detailed review analytics.",
          ctaLabel: "Upgrade to premium",
          href: withLocale("/auth/sign-up/guide?plan=guide-premium-monthly"),
        },
        {
          id: "guide-premium-annual",
          name: "Premium Profile (Annual)",
          price: "EUR 90 / year",
          description: "Save 25% with annual billing. Priority placement, unlimited introductions and detailed analytics.",
          ctaLabel: "Upgrade to premium (annual)",
          href: withLocale("/auth/sign-up/guide?plan=guide-premium-annual"),
        },
        {
          id: "guide-verification",
          name: "Verification Renewal",
          price: "EUR 40 / year",
          description: "Renew your badge annually and meet regional compliance requirements in minutes.",
          ctaLabel: "Renew verification",
          href: withLocale("/auth/sign-up/guide?plan=guide-verification"),
        },
      ],
    },
    {
      id: "agency",
      label: "Travel agency",
      tagline: "Source verified guides faster and protect every itinerary",
      summary:
        "Designed for agencies that need reliable partners, shared workspaces and dispute support without per-booking commissions.",
      options: [
        {
          id: "agency-basic-monthly",
          name: "Basic Subscription",
          price: "EUR 99/mo",
          description: "EUR 250 one-time setup. Full marketplace access, direct messaging and shortlist management.",
          ctaLabel: "Start agency plan",
          href: withLocale("/auth/sign-up/agency?plan=agency-basic-monthly"),
        },
        {
          id: "agency-basic-annual",
          name: "Basic (Annual - Save 25%)",
          price: "EUR 890/yr",
          description: "EUR 250 one-time setup. Full marketplace access and shortlist management.",
          ctaLabel: "Start agency plan",
          href: withLocale("/auth/sign-up/agency?plan=agency-basic-annual"),
        },
        {
          id: "agency-pro-monthly",
          name: "Pro Subscription",
          price: "EUR 199/mo",
          description: "EUR 250 one-time setup. Advanced filters, featured placement and additional seats.",
          ctaLabel: "Launch pro workspace",
          href: withLocale("/auth/sign-up/agency?plan=agency-pro-monthly"),
        },
        {
          id: "agency-pro-annual",
          name: "Pro (Annual - Save 25%)",
          price: "EUR 1,790/yr",
          description: "EUR 250 one-time setup. Advanced filters, featured placement and additional seats.",
          ctaLabel: "Launch pro workspace",
          href: withLocale("/auth/sign-up/agency?plan=agency-pro-annual"),
        },
      ],
    },
    {
      id: "dmc",
      label: "Destination management company",
      tagline: "Coordinate multi-region experiences with enterprise controls",
      summary:
        "For DMCs that manage complex itineraries, require custom SLAs and want concierge onboarding for regional teams.",
      options: [
        {
          id: "dmc-regional-monthly",
          name: "Regional Subscription",
          price: "EUR 199/mo",
          description: "EUR 250 one-time setup. Curated guide pools, transport partners and compliance dashboards.",
          ctaLabel: "Activate regional plan",
          href: withLocale("/auth/sign-up/dmc?plan=dmc-regional-monthly"),
        },
        {
          id: "dmc-regional-annual",
          name: "Regional (Annual - Save 25%)",
          price: "EUR 1,790/yr",
          description: "EUR 250 one-time setup. Curated guide pools and compliance dashboards.",
          ctaLabel: "Activate regional plan",
          href: withLocale("/auth/sign-up/dmc?plan=dmc-regional-annual"),
        },
        {
          id: "dmc-multimarket-monthly",
          name: "Multi-Market Subscription",
          price: "EUR 299/mo",
          description: "EUR 250 one-time setup. Multi-country coverage, advanced branding and private folders.",
          ctaLabel: "Scale multi-market",
          href: withLocale("/auth/sign-up/dmc?plan=dmc-multimarket-monthly"),
        },
        {
          id: "dmc-multimarket-annual",
          name: "Multi-Market (Annual - Save 25%)",
          price: "EUR 2,690/yr",
          description: "EUR 250 one-time setup. Multi-country coverage and advanced branding.",
          ctaLabel: "Scale multi-market",
          href: withLocale("/auth/sign-up/dmc?plan=dmc-multimarket-annual"),
        },
        {
          id: "dmc-enterprise",
          name: "Enterprise Partnership",
          price: "Custom",
          description: "Dedicated success manager, API access and procurement-ready agreements.",
          ctaLabel: "Talk to sales",
          href: "mailto:sales@guidevalidator.com",
        },
      ],
    },
    {
      id: "transport",
      label: "Transport company",
      tagline: "Showcase your fleet to agencies that demand reliability",
      summary:
        "List your vehicles with capacity, amenities and coverage regions, then add on marketing when you need it.",
      options: [
        {
          id: "transport-fleet-monthly",
          name: "Fleet Subscription",
          price: "EUR 49/mo",
          description: "EUR 250 one-time setup. Searchable profile with service routes, compliance docs and messaging.",
          ctaLabel: "List your fleet",
          href: withLocale("/auth/sign-up/transport?plan=transport-fleet-monthly"),
        },
        {
          id: "transport-fleet-annual",
          name: "Fleet (Annual - Save 25%)",
          price: "EUR 440/yr",
          description: "EUR 250 one-time setup. Searchable company profile with service routes.",
          ctaLabel: "List your fleet",
          href: withLocale("/auth/sign-up/transport?plan=transport-fleet-annual"),
        },
        {
          id: "transport-growth-monthly",
          name: "Growth Pack",
          price: "EUR 79/mo",
          description: "EUR 250 one-time setup. Featured placement and quarterly performance snapshots.",
          ctaLabel: "Unlock growth pack",
          href: withLocale("/auth/sign-up/transport?plan=transport-growth-monthly"),
        },
        {
          id: "transport-growth-annual",
          name: "Growth Pack (Annual - Save 25%)",
          price: "EUR 710/yr",
          description: "EUR 250 one-time setup. Featured placement and quarterly performance snapshots.",
          ctaLabel: "Unlock growth pack",
          href: withLocale("/auth/sign-up/transport?plan=transport-growth-annual"),
        },
        {
          id: "transport-verification",
          name: "Verification Renewal",
          price: "EUR 40 / month",
          description: "Annual document review that displays a trusted badge across all vehicle listings.",
          ctaLabel: "Add verification",
          href: withLocale("/auth/sign-up/transport?plan=transport-verification"),
        },
      ],
    },
  ];
  const advertisingHref = withLocale("/advertising");

  return (
    <main className="bg-background px-4 py-12 text-foreground sm:px-6 sm:py-16 lg:px-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 sm:gap-12 lg:gap-16">
        <section className="space-y-3 sm:space-y-4 text-left">
          <Badge variant="secondary" className="uppercase tracking-wide text-xs sm:text-sm">
            Pricing — Guide Validator
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">Find the right plan for your tourism business</h1>
          <p className="max-w-3xl text-base sm:text-lg text-foreground/80 leading-relaxed">
            Guide Validator connects licensed tour guides, travel agencies, DMCs and transport providers in one trusted global platform.
            Choose the plan that matches your current stage and switch tiers as your network expands.
          </p>
        </section>

        <PricingCardGrid segments={segments} />

        <section className="rounded-2xl sm:rounded-3xl border border-primary/15 bg-primary/5 p-5 sm:p-6 text-sm text-foreground/80">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Looking to advertise or analyse demand?</h2>
          <p className="mt-2 text-sm sm:text-base">
            Explore banner placements, specialty campaigns and tourism intelligence reports on our advertising page.
          </p>
          <Link
            href={advertisingHref}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-4 sm:px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg"
          >
            View advertising & reports
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>

        <section className="space-y-3 rounded-2xl sm:rounded-3xl border border-foreground/10 bg-white/80 p-5 sm:p-6 text-sm text-foreground/80">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">Why choose Guide Validator?</h2>
          <ul className="space-y-2.5 sm:space-y-2">
            {whyChoose.map((item) => (
              <li key={item} className="flex gap-2.5 sm:gap-2">
                <span className="mt-1.5 sm:mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span className="text-sm sm:text-base leading-relaxed">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl sm:rounded-3xl border border-primary/20 bg-primary/10 p-6 sm:p-8 text-center">
          <h2 className="text-xl sm:text-2xl font-semibold text-primary">Ready to protect every itinerary?</h2>
          <p className="mt-2 text-sm sm:text-base text-primary/80 max-w-2xl mx-auto">
            Chat with our team to tailor an enterprise rollout or start a 14-day pilot with your existing guides.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
            <a
              href="mailto:sales@guidevalidator.com"
              className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg"
            >
              Talk to sales
            </a>
            <Link
              href={withLocale("/auth/sign-up/agency")}
              className="rounded-full border border-primary px-6 py-2.5 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/10"
            >
              Start agency trial
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
