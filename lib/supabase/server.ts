import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { CookieMethodsServer, CookieMethodsServerDeprecated, CookieOptions } from "@supabase/ssr";
import { cache } from "react";

type MutableCookieAdapter = CookieMethodsServer & CookieMethodsServerDeprecated;

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function withMutableCookies(): MutableCookieAdapter {
  const cookieStore = cookies();

  return {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    getAll() {
      return cookieStore.getAll().map((cookie) => ({ name: cookie.name, value: cookie.value }));
    },
    set(name: string, value: string, options: CookieOptions = {}) {
      try {
        cookieStore.set({ name, value, ...options });
      } catch {
        // noop: read-only cookie store (static rendering)
      }
    },
    setAll(cookiesToSet) {
      try {
        cookiesToSet.forEach(({ name, value, options }) => {
          cookieStore.set({ name, value, ...options });
        });
      } catch {
        // noop
      }
    },
    remove(name: string, options: CookieOptions = {}) {
      try {
        cookieStore.set({ name, value: "", ...options, maxAge: 0 });
      } catch {
        // noop
      }
    },
  };
}

export const getSupabaseServerClient = cache(() => {
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: withMutableCookies(),
    }
  );
});

export function getSupabaseServiceRoleClient() {
  return createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      cookies: {
        get() { return undefined; },
        set() {},
        remove() {},
      },
    }
  );
}

// Alias for backwards compatibility and cleaner API
export const createClient = getSupabaseServerClient;
