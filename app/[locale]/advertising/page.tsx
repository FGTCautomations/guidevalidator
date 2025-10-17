import Link from "next/link";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";

const bannerPackages = [
  {
    name: "City spotlight banners",
    price: "EUR 100 - 300 / month",
    details: [
      "Your brand placed above search results in a chosen city, region or country",
      "Geo-targeted impressions for active agencies and guides",
      "Swap creative assets at any time with no additional cost",
    ],
  },
  {
    name: "Specialised tour banners",
    price: "EUR 150 / month",
    details: [
      "Promote niche experiences like wine trails, cultural immersions or adventure tours",
      "Segmented delivery to operators searching for relevant specialties",
      "Clickable CTA driving directly to your offer page or booking form",
    ],
  },
  {
    name: "Featured slot upgrade",
    price: "+ EUR 50 / month",
    details: [
      "Guarantee top placement with a sponsored badge in matching searches",
      "Combine with banners for full-funnel visibility",
      "Ideal for seasonal campaigns and launch windows",
    ],
  },
];

const intelligenceOffers = [
  {
    name: "Tourism demand report",
    price: "EUR 750 per report",
    description:
      "Understand what agencies and guides are searching for right now: destinations, languages, group sizes and service extras.",
    bullets: [
      "Monthly search and shortlist trends across the network",
      "Top emerging destinations and guide specialisations",
      "Actionable recommendations to adjust staffing and marketing",
    ],
  },
  {
    name: "Annual insights compendium",
    price: "EUR 1,200 per year",
    description:
      "A comprehensive year-in-review covering seasonal demand, booking behaviour, pricing benchmarks and long-term travel trends.",
    bullets: [
      "Quarterly dashboards plus an end-of-year deep dive",
      "Forecasts for key source markets and travel verticals",
      "Executive summary ready for investor or board presentations",
    ],
  },
];

export const metadata = {
  title: "Advertising & Insights | Guide Validator",
  description:
    "Reach tourism decision makers with targeted banners and on-demand intelligence reports from the Guide Validator marketplace.",
};

type AdvertisingPageProps = { params: { locale: string } };

export default function AdvertisingPage({ params }: AdvertisingPageProps) {
  const localePrefix = `/${params.locale}`;

  return (
    <main className="bg-background px-6 py-16 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-16">
        <section className="space-y-4 text-left">
          <Badge variant="secondary" className="uppercase tracking-wide">?? Advertising & Insights</Badge>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Put your tourism brand in front of verified buyers</h1>
          <p className="max-w-3xl text-lg text-foreground/80">
            Guide Validator connects licensed guides, agencies, DMCs and transport partners in one marketplace. Promote your
            offering exactly where professionals are sourcing supply, then back decisions with network-wide demand intelligence.
          </p>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Banner & placement packages</h2>
            <p className="text-sm text-foreground/70">
              Choose persistent placements or run seasonal bursts â€” our team will set up creatives, targeting and reporting.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {bannerPackages.map((pkg) => (
              <article key={pkg.name} className="flex h-full flex-col gap-4 rounded-3xl border border-foreground/10 bg-white/80 p-6 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{pkg.name}</h3>
                  <p className="text-sm font-medium text-primary">{pkg.price}</p>
                </div>
                <ul className="mt-2 space-y-2 text-sm text-foreground/80">
                  {pkg.details.map((detail) => (
                    <li key={detail} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span>{detail}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">Demand intelligence & reports</h2>
            <p className="text-sm text-foreground/70">
              Turn marketplace activity into strategy. Order once for a tactical snapshot or subscribe for year-round insights.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {intelligenceOffers.map((offer) => (
              <article key={offer.name} className="flex h-full flex-col gap-4 rounded-3xl border border-primary/15 bg-primary/5 p-6 shadow-sm">
                <div className="space-y-1">
                  <h3 className="text-lg font-semibold text-foreground">{offer.name}</h3>
                  <p className="text-sm font-medium text-primary">{offer.price}</p>
                </div>
                <p className="text-sm text-foreground/70">{offer.description}</p>
                <ul className="mt-2 space-y-2 text-sm text-foreground/80">
                  {offer.bullets.map((bullet) => (
                    <li key={bullet} className="flex gap-2">
                      <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-auto">
                  <a
                    href="mailto:sales@guidevalidator.com"
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg"
                  >
                    Request availability
                    <span aria-hidden="true">?</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-foreground/10 bg-white/80 p-6 text-sm text-foreground/80">
          <h2 className="text-xl font-semibold text-foreground">How it works</h2>
          <ol className="space-y-2 list-decimal pl-5">
            <li>Tell us your goals â€” distribution, lead generation or insight-driven planning.</li>
            <li>We configure placements and intelligence feeds across the Guide Validator marketplace.</li>
            <li>Receive monthly reports with impressions, clicks and saved-profile metrics.</li>
          </ol>
        </section>

        <section className="rounded-3xl border border-primary/20 bg-primary/10 p-6 text-center">
          <h2 className="text-2xl font-semibold text-primary">Ready to launch an advertising campaign?</h2>
          <p className="mt-2 text-sm text-primary/80">
            Book a call with our partnerships team or return to pricing to select your core subscription.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a
              href="mailto:partners@guidevalidator.com"
              className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:shadow-lg"
            >
              Speak to partnerships
            </a>
            <Link
              href={`${localePrefix}/pricing` as Route}
              className="rounded-full border border-primary px-6 py-2 text-sm font-semibold text-primary shadow-sm transition hover:bg-primary/10"
            >
              Back to pricing
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}


