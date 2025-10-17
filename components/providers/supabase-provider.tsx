"use client";

import { createContext, PropsWithChildren, useContext } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { useSupabaseBrowserClient } from "@/lib/supabase/browser";

const SupabaseContext = createContext<SupabaseClient | null>(null);

export function SupabaseProvider({ children }: PropsWithChildren) {
  const supabase = useSupabaseBrowserClient();

  return <SupabaseContext.Provider value={supabase}>{children}</SupabaseContext.Provider>;
}

export function useSupabaseClient() {
  const context = useContext(SupabaseContext);

  if (!context) {
    throw new Error("useSupabaseClient must be used within SupabaseProvider");
  }

  return context;
}
