import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import Link from "next/link";

export default async function DirectoryPreviewPage({ params }: { params: { locale: string } }) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "directory" });

  // Dummy data to show what's behind the paywall
  const dummyListings = [
    {
      id: "1",
      name: "Professional Tour Guide",
      location: "Paris, France",
      rating: 4.9,
      reviews: 127,
      languages: ["English", "French", "Spanish"],
      specialties: ["Cultural Tours", "Museums", "Food Tours"],
      image: "/images/placeholder-guide.jpg",
    },
    {
      id: "2",
      name: "Expert Mountain Guide",
      location: "Swiss Alps, Switzerland",
      rating: 5.0,
      reviews: 89,
      languages: ["English", "German", "Italian"],
      specialties: ["Mountain Hiking", "Skiing", "Adventure"],
      image: "/images/placeholder-guide.jpg",
    },
    {
      id: "3",
      name: "Premium Travel Agency",
      location: "Tokyo, Japan",
      rating: 4.8,
      reviews: 234,
      languages: ["English", "Japanese", "Korean"],
      specialties: ["Luxury Travel", "Cultural Experiences", "MICE"],
      image: "/images/placeholder-agency.jpg",
    },
    {
      id: "4",
      name: "Elite DMC Services",
      location: "Dubai, UAE",
      rating: 4.9,
      reviews: 156,
      languages: ["English", "Arabic"],
      specialties: ["Corporate Events", "Luxury DMC", "VIP Services"],
      image: "/images/placeholder-dmc.jpg",
    },
  ];

  return (
    <div className="relative flex flex-col gap-10 bg-background px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t("title")}
          </h1>
          <p className="text-sm text-foreground/70 sm:text-base">{t("description")}</p>
        </div>
      </div>

      {/* Preview Content with Blur */}
      <div className="relative mx-auto w-full max-w-6xl">
        {/* Blurred preview grid */}
        <div className="pointer-events-none blur-sm filter">
          <div className="grid gap-4 md:grid-cols-2">
            {dummyListings.map((listing) => (
              <div
                key={listing.id}
                className="flex flex-col gap-4 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-[var(--radius-lg)] bg-foreground/10" />
                  <div className="flex-1 space-y-2">
                    <h3 className="text-lg font-semibold text-foreground">{listing.name}</h3>
                    <p className="text-sm text-foreground/60">{listing.location}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-amber-500">★ {listing.rating}</span>
                      <span className="text-foreground/60">({listing.reviews} reviews)</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {listing.languages.map((lang, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-foreground/5 px-2 py-1 text-xs text-foreground/70"
                      >
                        {lang}
                      </span>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {listing.specialties.map((specialty, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-foreground/5 px-2 py-1 text-xs text-foreground/70"
                      >
                        {specialty}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Paywall Overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-white/80 to-white">
          <div className="mx-auto max-w-xl space-y-6 rounded-[var(--radius-xl)] border border-foreground/20 bg-white p-8 text-center shadow-xl">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-foreground">
                Access Our Full Directory
              </h2>
              <p className="text-sm text-foreground/70">
                Join Guide Validator to access thousands of verified guides, agencies, DMCs, and transport providers worldwide.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-left text-sm text-foreground/80">
                <span className="text-emerald-600">✓</span>
                <span>Browse verified profiles with ratings and reviews</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm text-foreground/80">
                <span className="text-emerald-600">✓</span>
                <span>Filter by location, language, and specialty</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm text-foreground/80">
                <span className="text-emerald-600">✓</span>
                <span>View availability and book directly</span>
              </div>
              <div className="flex items-center gap-3 text-left text-sm text-foreground/80">
                <span className="text-emerald-600">✓</span>
                <span>Access contact information and rates</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row">
              <Link
                href={`/${locale}/auth/sign-in`}
                className="flex-1 rounded-[var(--radius-lg)] border border-foreground/20 bg-white px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                Sign In
              </Link>
              <Link
                href={`/${locale}/pricing`}
                className="flex-1 rounded-[var(--radius-lg)] bg-foreground px-6 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
              >
                View Pricing
              </Link>
            </div>

            <p className="text-xs text-foreground/50">
              Already have an account?{" "}
              <Link href={`/${locale}/auth/sign-in`} className="text-foreground underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}