// Server component wrapper that adds sidebar to all pages except homepage
import { SidebarAd } from "@/components/ads/SidebarAd";
import type { ReactNode } from "react";

interface LayoutWithSidebarProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export function LayoutWithSidebar({ children, showSidebar = true }: LayoutWithSidebarProps) {
  // If homepage or showSidebar is false, render without sidebar
  if (!showSidebar) {
    return <>{children}</>;
  }

  // For all other pages, render with sidebar
  return (
    <div className="mx-auto flex w-full max-w-[1400px] gap-6 px-4 py-6 lg:px-8">
      {/* Main content area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>

      {/* Sidebar ad - desktop only, hidden on mobile */}
      <SidebarAd className="w-[300px] shrink-0" />
    </div>
  );
}
