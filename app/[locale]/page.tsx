export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import type { Metadata } from "next";
import { HeroVideo } from "@/components/landing/hero-video";
import { Hero } from "@/components/home/Hero";
import { About } from "@/components/home/About";
import { StakeholderGrid } from "@/components/home/StakeholderGrid";
import { HowItWorks } from "@/components/home/HowItWorks";
import { GlobalCTA } from "@/components/home/GlobalCTA";
import { AdSlot } from "@/components/ads/AdSlot";

export const metadata: Metadata = {
  title: "Find Verified Tour Guides, DMCs & Travel Agencies Worldwide | GuideValidator",
  description:
    "Discover verified tour guides, travel agencies, DMCs, and transportation partners — all in one place. Join the world's trusted marketplace for verified travel professionals.",
};

export default function LocaleHomePage() {
  return (
    <main className="flex flex-col bg-background text-foreground">
      {/* Hero Section - Navy background with white text */}
      <Hero />

      {/* Preserved Video Section - EXACT component, props, and placement */}
      <section className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-12 lg:px-24">
        <HeroVideo />
      </section>

      {/* About Section */}
      <About />

      {/* Stakeholder Value Grid - 4 cards */}
      <StakeholderGrid />

      {/* How It Works - 3 steps */}
      <HowItWorks />

      {/* Ad Slot - Homepage Mid (conditionally rendered) */}
      {/* Temporarily disabled for build - needs fix for static generation */}
      {/* <section className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-12 lg:px-24">
        <AdSlot placement="homepage_mid" />
      </section> */}

      {/* Global CTA - 4 buttons */}
      <GlobalCTA />
    </main>
  );
}
