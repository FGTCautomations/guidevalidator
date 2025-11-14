export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { HomePageContent } from "./HomePageContent";
import { GlobalCTA } from "@/components/home/GlobalCTA";

// Page wrapper - ad now appears inside HomePageContent before "How It Works"
export default function LocaleHomePage() {
  return (
    <>
      <HomePageContent />

      {/* Global CTA - 4 buttons at bottom */}
      <section className="flex flex-col bg-background text-foreground">
        <GlobalCTA />
      </section>
    </>
  );
}
