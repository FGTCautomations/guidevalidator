"use client";

import { PropsWithChildren } from "react";
import { SupabaseProvider } from "@/components/providers/supabase-provider";

export function AppProviders({ children }: PropsWithChildren) {
  return <SupabaseProvider>{children}</SupabaseProvider>;
}
