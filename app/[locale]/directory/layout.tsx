export const dynamic = "force-dynamic";

import type { ReactNode } from "react";
import { LayoutWithSidebar } from "../layout-with-sidebar";

interface DirectoryLayoutProps {
  children: ReactNode;
}

export default function DirectoryLayout({ children }: DirectoryLayoutProps) {
  return <LayoutWithSidebar>{children}</LayoutWithSidebar>;
}
