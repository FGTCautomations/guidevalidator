// SidebarAd component - Sticky sidebar ad for desktop (optional placement)
// Only renders if ad is available, max 20% viewport height

import { AdSlot } from "./AdSlot";

interface SidebarAdProps {
  country?: string;
  className?: string;
}

export async function SidebarAd({ country, className = "" }: SidebarAdProps) {
  return (
    <aside
      className={`hidden lg:block ${className}`}
      aria-label="Sponsored content"
    >
      <div className="sticky top-24">
        <AdSlot placement="sidebar" country={country} />
      </div>
    </aside>
  );
}
