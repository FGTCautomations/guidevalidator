import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { isSupportedLocale, type SupportedLocale } from "@/i18n/config";
import Link from "next/link";

type DirectoryPageProps = {
  params: { locale: string };
};

export default async function DirectoryPage({ params }: DirectoryPageProps) {
  const { locale: requestedLocale } = params;

  if (!isSupportedLocale(requestedLocale)) {
    notFound();
  }

  const locale = requestedLocale as SupportedLocale;
  const t = await getTranslations({ locale, namespace: "directory" });

  const segments = [
    {
      title: "Guides",
      description: "Find verified professional tour guides worldwide",
      icon: "👤",
      href: `/${locale}/directory/guides` as const,
      color: "from-blue-500 to-cyan-500",
    },
    {
      title: "Agencies",
      description: "Discover travel agencies and tour operators",
      icon: "🏢",
      href: `/${locale}/directory/agencies` as const,
      color: "from-purple-500 to-pink-500",
    },
    {
      title: "DMCs",
      description: "Connect with destination management companies",
      icon: "🌍",
      href: `/${locale}/directory/dmcs` as const,
      color: "from-green-500 to-emerald-500",
    },
    {
      title: "Transportation",
      description: "Book transportation and transfer services",
      icon: "🚗",
      href: `/${locale}/directory/transport` as const,
      color: "from-orange-500 to-red-500",
    },
  ] as const;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 px-6 py-12 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-foreground/70">
            {t("description")}
          </p>
        </div>

        {/* Segment Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {segments.map((segment) => (
            <Link
              key={segment.href}
              href={segment.href}
              className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
            >
              {/* Gradient background on hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${segment.color} opacity-0 transition-opacity duration-300 group-hover:opacity-10`} />

              {/* Content */}
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="mb-4 text-6xl">{segment.icon}</div>
                <h2 className="mb-2 text-2xl font-semibold text-foreground">
                  {segment.title}
                </h2>
                <p className="text-sm text-foreground/60">{segment.description}</p>

                {/* Arrow icon */}
                <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 transition-all duration-300 group-hover:bg-foreground/10">
                  <svg
                    className="h-5 w-5 text-foreground/40 transition-transform duration-300 group-hover:translate-x-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-16 rounded-2xl bg-white p-8 shadow-lg">
          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mb-3 text-4xl">✓</div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Verified Professionals</h3>
              <p className="text-sm text-foreground/60">
                All listed providers are verified and reviewed
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">🌐</div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Global Coverage</h3>
              <p className="text-sm text-foreground/60">
                Find services in destinations worldwide
              </p>
            </div>
            <div className="text-center">
              <div className="mb-3 text-4xl">⚡</div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">Instant Connect</h3>
              <p className="text-sm text-foreground/60">
                Connect directly with service providers
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
