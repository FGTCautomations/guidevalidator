export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { HomePageContent } from "./HomePageContent";
import { AdSlot } from "@/components/ads/AdSlot";
import { GlobalCTA } from "@/components/home/GlobalCTA";

// Page wrapper with server-side ad slot in middle of page
export default function LocaleHomePage() {
  return (
    <>
      <HomePageContent />

      {/* Homepage Ad Slot - Appears between content and CTA */}
      <section className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-12 lg:px-24">
        <AdSlot placement="homepage_mid" />
      </section>

      {/* Global CTA - 4 buttons at bottom */}
      <section className="flex flex-col bg-background text-foreground">
        <GlobalCTA />
      </section>
    </>
  );
}
