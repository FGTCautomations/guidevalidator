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
          id: "guide-premium",
          name: "Premium profile",
          price: "EUR 9.99 / month",
          description: "Priority placement, unlimited introductions and access to detailed review analytics.",
          ctaLabel: "Upgrade to premium",
          href: withLocale("/auth/sign-up/guide?plan=guide-premium"),
        },
        {
          id: "guide-verification",
          name: "Verification renewal",
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
          id: "agency-basic",
          name: "Basic subscription",
          price: "EUR 99 / month",
          description: "Full marketplace access, direct messaging and shortlist management for small teams.",
          ctaLabel: "Start agency plan",
          href: withLocale("/auth/sign-up/agency?plan=agency-basic"),
        },
        {
          id: "agency-pro",
          name: "Pro subscription",
          price: "EUR 199 / month",
          description: "Advanced filters, featured placement and additional seats for growing operations.",
          ctaLabel: "Launch pro workspace",
          href: withLocale("/auth/sign-up/agency?plan=agency-pro"),
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
          id: "dmc-core",
          name: "Regional DMC",
          price: "EUR 199 / month",
          description: "Access curated guide pools, transport partners and compliance dashboards for one region.",
          ctaLabel: "Activate regional plan",
          href: withLocale("/auth/sign-up/dmc?plan=dmc-core"),
        },
        {
          id: "dmc-multimarket",
          name: "Multi-market DMC",
          price: "EUR 299 / month",
          description: "Multi-country coverage, advanced branding, private folders and quarterly supply reviews.",
          ctaLabel: "Scale multi-market",
          href: withLocale("/auth/sign-up/dmc?plan=dmc-multimarket"),
        },
        {
          id: "dmc-enterprise",
          name: "Enterprise partnership",
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
          id: "transport-subscription",
          name: "Fleet subscription",
          price: "EUR 49 / month",
          description: "Searchable company profile with service routes, compliance docs and messaging.",
          ctaLabel: "List your fleet",
          href: withLocale("/auth/sign-up/transport?plan=transport-subscription"),
        },
        {
          id: "transport-verified",
          name: "Verified badge add-on",
          price: "EUR 40 / year",
          description: "Annual document review that displays a trusted badge across all vehicle listings.",
          ctaLabel: "Add verification",
          href: withLocale("/auth/sign-up/transport?plan=transport-verified"),
        },
        {
          id: "transport-growth",
          name: "Growth pack",
          price: "EUR 79 / month",
          description: "Featured placement plus quarterly performance snapshots for your key destinations.",
          ctaLabel: "Unlock growth pack",
          href: withLocale("/auth/sign-up/transport?plan=transport-growth"),
        },
      ],
    },
  ];
  const advertisingHref = withLocale("/advertising");

  return (
    <main className="bg-background px-6 py-16 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <section className="space-y-4 text-left">
          <Badge variant="secondary" className="uppercase tracking-wide">
            Pricing — Guide Validator
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Find the right plan for your tourism business</h1>
          <p className="max-w-3xl text-lg text-foreground/80">
            Guide Validator connects licensed tour guides, travel agencies, DMCs and transport providers in one trusted global platform.
            Choose the plan that matches your current stage and switch tiers as your network expands.
          </p>
        </section>

        <PricingCardGrid segments={segments} />

        <section className="rounded-3xl border border-primary/15 bg-primary/5 p-6 text-sm text-foreground/80">
          <h2 className="text-xl font-semibold text-foreground">Looking to advertise or analyse demand?</h2>
          <p className="mt-2">
            Explore banner placements, specialty campaigns and tourism intelligence reports on our advertising page.
          </p>
          <Link
            href={advertisingHref}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg"
          >
            View advertising & reports
            <span aria-hidden="true">&rarr;</span>
          </Link>
        </section>

        <section className="space-y-3 rounded-3xl border border-foreground/10 bg-white/80 p-6 text-sm text-foreground/80">
          <h2 className="text-xl font-semibold text-foreground">Why choose Guide Validator?</h2>
          <ul className="space-y-2">
            {whyChoose.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-3xl border border-primary/20 bg-primary/10 p-6 text-center">
          <h2 className="text-2xl font-semibold text-primary">Ready to protect every itinerary?</h2>
          <p className="mt-2 text-sm text-primary/80">
            Chat with our team to tailor an enterprise rollout or start a 14-day pilot with your existing guides.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:sales@guidevalidator.com"
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg"
            >
              Talk to sales
            </a>
            <Link
              href={withLocale("/auth/sign-up/agency")}
              className="rounded-full border border-primary px-6 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/10"
            >
              Start agency trial
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
