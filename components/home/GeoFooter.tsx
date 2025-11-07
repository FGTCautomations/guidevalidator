"use client";

import { useRef } from "react";
import { homeContent } from "@/content/home";

export function GeoFooter() {
  const { text, countries } = homeContent.geoFooter;
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 py-12 sm:px-12 lg:px-24">
      <div className="rounded-2xl bg-brand-bg p-6 sm:p-8">
        {/* Intro Text - Inter Medium */}
        <p className="font-inter mb-4 text-center text-base font-medium text-foreground/70 sm:text-lg">
          {text}
        </p>

        {/* Scrolling Country List */}
        <div className="relative overflow-hidden">
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {countries.map((country) => (
              <span
                key={country}
                className="font-inter inline-block whitespace-nowrap rounded-lg bg-white/50 px-4 py-2 text-sm text-brand-navy transition-colors hover:bg-brand-primary/10 hover:text-brand-primary hover:underline focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
                role="link"
                tabIndex={0}
              >
                {country}
              </span>
            ))}
          </div>

          {/* Gradient Overlays for scroll effect */}
          <div
            className="pointer-events-none absolute left-0 top-0 h-full w-12 bg-gradient-to-r from-brand-bg to-transparent"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-0 top-0 h-full w-12 bg-gradient-to-l from-brand-bg to-transparent"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Hide scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
}
