"use client";

import { ShieldCheck, Award, Globe, Users } from "lucide-react";
import { useTranslations } from "next-intl";

const iconMap = {
  "shield-check": ShieldCheck,
  award: Award,
  globe: Globe,
  users: Users,
};

const featureKeys = ["verifiedIdentity", "credentialValidation", "globalStandards", "communityTrust"] as const;
const featureIcons: Record<typeof featureKeys[number], keyof typeof iconMap> = {
  verifiedIdentity: "shield-check",
  credentialValidation: "award",
  globalStandards: "globe",
  communityTrust: "users",
};

export function About() {
  const t = useTranslations("home.about");

  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-12 lg:px-24">
      <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left Column - Text Content */}
        <div className="space-y-6">
          {/* Title - Roboto Bold (H2) */}
          <h2 className="font-roboto text-3xl font-bold leading-tight text-brand-navy sm:text-4xl md:text-5xl">
            {t("title")}
          </h2>

          {/* Description - Inter Regular */}
          <p className="font-inter text-lg leading-relaxed text-foreground/80 sm:text-xl">
            {t("description")}
          </p>
        </div>

        {/* Right Column - Feature Grid */}
        <div className="grid grid-cols-2 gap-6">
          {featureKeys.map((featureKey) => {
            const Icon = iconMap[featureIcons[featureKey]];

            return (
              <div key={featureKey} className="space-y-3">
                {/* Icon in brand primary color */}
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-primary/10">
                  <Icon className="h-6 w-6 text-brand-primary" aria-hidden="true" />
                </div>

                {/* Feature Title - Roboto SemiBold (H3) */}
                <h3 className="font-roboto text-lg font-semibold text-brand-navy">
                  {t(`features.${featureKey}.title`)}
                </h3>

                {/* Feature Description - Inter Regular */}
                <p className="font-inter text-sm leading-relaxed text-foreground/70">
                  {t(`features.${featureKey}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
