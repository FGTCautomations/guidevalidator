// FooterAd component - Ad slot above global footer
// Responsive strip ad or partner tile (conditionally rendered)

import { AdSlot } from "./AdSlot";

interface FooterAdProps {
  country?: string;
  className?: string;
}

export async function FooterAd({ country, className = "" }: FooterAdProps) {
  return (
    <section
      className={`mx-auto w-full max-w-6xl px-6 py-8 sm:px-12 lg:px-24 ${className}`}
      aria-label="Sponsored content"
    >
      <AdSlot placement="footer" country={country} />
    </section>
  );
}
