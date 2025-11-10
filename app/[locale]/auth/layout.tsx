export const dynamic = "force-dynamic";

import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-[calc(100vh-200px)] flex-col items-center justify-center bg-background px-6 py-24">
      {children}
    </div>
  );
}
