"use client";

// ClientAdInjector - Client-side component for injecting ads into listing results
// Fetches ads client-side and injects them at positions 3 and 10

import { useEffect, useState } from "react";
import type { Ad } from "@/lib/ads/types";
import { NativeCardAd } from "./NativeCardAd";

interface ClientAdInjectorProps {
  position: 3 | 10;
  listContext: "guides" | "dmcs" | "transport" | "agencies";
  country?: string;
}

export function ClientAdInjector({
  position,
  listContext,
  country,
}: ClientAdInjectorProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAd = async () => {
      try {
        const params = new URLSearchParams({
          placement: "listings",
          listContext,
        });

        if (country) {
          params.append("country", country);
        }

        const response = await fetch(`/api/ads?${params.toString()}`);

        if (response.ok) {
          const data = await response.json();
          // Check if data is not empty object
          if (data && Object.keys(data).length > 0) {
            setAd(data);
          }
        }
      } catch (error) {
        console.error("Error fetching ad:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAd();
  }, [listContext, country]);

  // Don't render anything while loading or if no ad
  if (loading || !ad) {
    return null;
  }

  return <NativeCardAd ad={ad} />;
}
