export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { HomePageContent } from "./HomePageContent";
import { AdSlot } from "@/components/ads/AdSlot";

// Page wrapper with server-side ad slot
export default function LocaleHomePage() {
  return (
    <>
      <HomePageContent />
      {/* Homepage Ad Slot - Server component for dynamic ad selection */}
      <section className="mx-auto w-full max-w-6xl px-6 py-8 sm:px-12 lg:px-24">
        <AdSlot placement="homepage_mid" />
      </section>
    </>
  );
}
