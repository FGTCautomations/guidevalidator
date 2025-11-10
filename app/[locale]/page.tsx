export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

import { HomePageContent } from "./HomePageContent";

// Simplified page wrapper - all content moved to client component
// to avoid static generation issues
export default function LocaleHomePage() {
  return <HomePageContent />;
}
