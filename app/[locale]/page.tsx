export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { getTranslations } from "next-intl/server";
import { CallToAction } from "@/components/landing/call-to-action";
import { HeroSection } from "@/components/landing/hero-section";
import { HeroVideo } from "@/components/landing/hero-video";
import { MetricsPanel } from "@/components/landing/metrics-panel";
import { ValueGrid } from "@/components/landing/value-grid";
import { Badge } from "@/components/ui/badge";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export default async function LocaleHomePage() {
  const t = await getTranslations("home");
  const supabase = getSupabaseServerClient();

  const [verifiedQuery, guideCountriesQuery, dmcCountriesQuery, transportCountriesQuery] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { head: true, count: "exact" })
      .eq("verified", true)
      .in("role", ["guide", "agency", "dmc", "transport"]),
    supabase.from("guide_countries").select("country_code"),
    supabase.from("dmc_countries").select("country_code"),
    supabase.from("transport_countries").select("country_code"),
  ]);

  if (verifiedQuery.error) {
    console.error("Failed to load verified profiles count", verifiedQuery.error);
  }

  if (guideCountriesQuery.error) {
    console.error("Failed to load guide country coverage", guideCountriesQuery.error);
  }

  if (dmcCountriesQuery.error) {
    console.error("Failed to load DMC/agency country coverage", dmcCountriesQuery.error);
  }

  if (transportCountriesQuery.error) {
    console.error("Failed to load transport country coverage", transportCountriesQuery.error);
  }

  const verifiedProfessionals = verifiedQuery.count ?? 0;
  const countrySet = new Set<string>();

  const appendCountries = (rows: Array<{ country_code?: string | null }> | null | undefined) => {
    (rows ?? []).forEach((row) => {
      const code = row.country_code;
      if (code) {
        countrySet.add(code);
      }
    });
  };

  appendCountries(guideCountriesQuery.data as Array<{ country_code?: string | null }> | null | undefined);
  appendCountries(dmcCountriesQuery.data as Array<{ country_code?: string | null }> | null | undefined);
  appendCountries(transportCountriesQuery.data as Array<{ country_code?: string | null }> | null | undefined);

  const coveredCountries = countrySet.size;

  const metrics = [
    {
      label: t("metrics.verified.label"),
      value: verifiedProfessionals.toLocaleString(),
    },
    {
      label: t("metrics.countries.label"),
      value: coveredCountries.toLocaleString(),
    },
    {
      label: t("metrics.sla.label"),
      value: t("metrics.sla.value"),
    },
  ];

  const valueProps = [
    {
      title: t("pillars.enterprise.title"),
      body: t("pillars.enterprise.body"),
    },
    {
      title: t("pillars.localization.title"),
      body: t("pillars.localization.body"),
    },
    {
      title: t("pillars.infrastructure.title"),
      body: t("pillars.infrastructure.body"),
    },
  ];

  return (
    <main className="flex flex-col gap-16 bg-background px-6 py-16 text-foreground sm:px-12 lg:px-24">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Badge variant="secondary" className="uppercase tracking-wide">
          {t("trustBadge")}
        </Badge>
        <HeroSection
          badgeLabel={t("tagline")}
          title={t("heroTitle")}
          description={t("heroDescription")}
          primaryCta={{ label: t("primaryCta"), href: t("primaryCtaHref") }}
          secondaryCta={{ label: t("secondaryCta"), href: t("secondaryCtaHref") }}
        />
        <HeroVideo />
        <MetricsPanel metrics={metrics} />
      </div>
      <ValueGrid items={valueProps} />
      <CallToAction
        title={t("cta.title")}
        body={t("cta.body")}
        actionLabel={t("cta.action")}
        actionHref={t("cta.href")}
      />
    </main>
  );
}




