"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { ChevronDown, ChevronUp } from "lucide-react";

type InternalHref = { pathname: Route; query?: Record<string, string> };

type PricingOption = {
  id: string;
  name: string;
  price: string;
  description: string;
  ctaLabel: string;
  href: InternalHref | string;
};

export type PricingSegment = {
  id: string;
  label: string;
  tagline: string;
  summary: string;
  options: PricingOption[];
};

type PricingCardGridProps = {
  segments: PricingSegment[];
};

export function PricingCardGrid({ segments }: PricingCardGridProps) {
  // Mobile: Track which cards are expanded
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleCard = (segmentId: string) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(segmentId)) {
        next.delete(segmentId);
      } else {
        next.add(segmentId);
      }
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 relative w-full">
      {segments.map((segment) => {
        const isExpanded = expandedCards.has(segment.id);

        return (
          <div
            key={segment.id}
            className="group relative flex-1 transition-all duration-700 ease-in-out lg:min-h-[580px] lg:hover:flex-[2.5] lg:hover:shadow-2xl lg:hover:z-10"
            style={{ perspective: "1600px" }}
          >
            {/* Mobile: Simple expandable card */}
            <div className="lg:hidden">
              <article className="rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-white to-primary/5 shadow-md">
                {/* Header - Always visible */}
                <button
                  onClick={() => toggleCard(segment.id)}
                  className="w-full p-6 text-left"
                  aria-expanded={isExpanded}
                  aria-controls={`pricing-options-${segment.id}`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="inline-block px-3 py-1.5 bg-primary/10 rounded-full">
                        <p className="text-sm font-bold uppercase tracking-wider text-primary">{segment.label}</p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <h3 className="text-xl font-bold text-foreground leading-tight">{segment.tagline}</h3>
                    <p className="text-sm text-foreground/70 leading-relaxed">{segment.summary}</p>
                  </div>
                </button>

                {/* Expandable options */}
                {isExpanded && (
                  <div
                    id={`pricing-options-${segment.id}`}
                    className="px-6 pb-6 space-y-3 border-t border-primary/10 pt-4 mt-2"
                  >
                    {segment.options.map((option) => {
                      const isExternal = typeof option.href === "string" && /^(mailto:|https?:)/.test(option.href);

                      if (isExternal && typeof option.href === "string") {
                        return (
                          <a
                            key={option.id}
                            href={option.href}
                            className="block w-full rounded-xl border border-foreground/15 bg-gradient-to-br from-white to-gray-50 p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-bold text-foreground">{option.name}</span>
                                <span className="text-sm font-bold text-primary whitespace-nowrap">{option.price}</span>
                              </div>
                              <p className="text-sm text-foreground/70 leading-relaxed">{option.description}</p>
                              <span className="text-sm font-semibold text-primary">{option.ctaLabel} →</span>
                            </div>
                          </a>
                        );
                      }

                      // Parse URL and query string for internal links
                      let internalHref: InternalHref | Route;
                      if (typeof option.href === "string") {
                        const [pathname, queryString] = option.href.split("?");
                        if (queryString) {
                          const query: Record<string, string> = {};
                          const params = new URLSearchParams(queryString);
                          params.forEach((value, key) => {
                            query[key] = value;
                          });
                          internalHref = { pathname: pathname as Route, query };
                        } else {
                          internalHref = pathname as Route;
                        }
                      } else {
                        internalHref = option.href;
                      }

                      return (
                        <Link
                          key={option.id}
                          href={internalHref}
                          className="block w-full rounded-xl border border-foreground/15 bg-gradient-to-br from-white to-gray-50 p-4 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-sm font-bold text-foreground">{option.name}</span>
                              <span className="text-sm font-bold text-primary whitespace-nowrap">{option.price}</span>
                            </div>
                            <p className="text-sm text-foreground/70 leading-relaxed">{option.description}</p>
                            <span className="text-sm font-semibold text-primary">{option.ctaLabel} →</span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </article>
            </div>

            {/* Desktop: Hover flip card */}
            <div className="hidden lg:block relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
              {/* Front of card */}
              <article className="absolute inset-0 flex h-full flex-col gap-4 rounded-3xl border-2 border-primary/30 bg-gradient-to-br from-white to-primary/5 p-6 shadow-md [backface-visibility:hidden]">
                <div className="space-y-3">
                  <div className="inline-block px-3 py-1.5 bg-primary/10 rounded-full">
                    <p className="text-sm font-bold uppercase tracking-wider text-primary">{segment.label}</p>
                  </div>
                  <h3 className="text-2xl font-bold text-foreground leading-tight">{segment.tagline}</h3>
                  <p className="text-sm text-foreground/70 leading-relaxed">{segment.summary}</p>
                </div>
                <p className="mt-auto text-sm font-medium text-primary/80">Hover to view plans →</p>
              </article>

              {/* Back of card */}
              <article className="absolute inset-0 flex h-full flex-col rounded-3xl border-2 border-primary/30 bg-white p-5 text-foreground shadow-md [transform:rotateY(180deg)] [backface-visibility:hidden] overflow-hidden">
                <div className="flex-shrink-0 mb-3 pb-3 border-b border-foreground/10">
                  <div className="inline-block px-2 py-1 bg-primary/10 rounded mb-1">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary">{segment.label}</p>
                  </div>
                  <h3 className="text-base font-bold text-foreground">Select a plan</h3>
                </div>

                <div className="space-y-2 overflow-y-auto overflow-x-hidden pr-1 flex-1 min-h-0" style={{ scrollbarWidth: 'thin' }}>
                  {segment.options.map((option) => {
                    const isExternal = typeof option.href === "string" && /^(mailto:|https?:)/.test(option.href);

                    if (isExternal && typeof option.href === "string") {
                      return (
                        <a
                          key={option.id}
                          href={option.href}
                          className="block w-full rounded-xl border border-foreground/15 bg-gradient-to-br from-white to-gray-50 p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-xs font-bold text-foreground break-words flex-1 min-w-0">{option.name}</span>
                              <span className="text-xs font-bold text-primary whitespace-nowrap flex-shrink-0">{option.price}</span>
                            </div>
                            <p className="text-xs text-foreground/70 leading-relaxed break-words">{option.description}</p>
                            <span className="text-xs font-semibold text-primary block">{option.ctaLabel} →</span>
                          </div>
                        </a>
                      );
                    }

                    // Parse URL and query string for internal links
                    let internalHref: InternalHref | Route;
                    if (typeof option.href === "string") {
                      const [pathname, queryString] = option.href.split("?");
                      if (queryString) {
                        const query: Record<string, string> = {};
                        const params = new URLSearchParams(queryString);
                        params.forEach((value, key) => {
                          query[key] = value;
                        });
                        internalHref = { pathname: pathname as Route, query };
                      } else {
                        internalHref = pathname as Route;
                      }
                    } else {
                      internalHref = option.href;
                    }

                    return (
                      <Link
                        key={option.id}
                        href={internalHref}
                        className="block w-full rounded-xl border border-foreground/15 bg-gradient-to-br from-white to-gray-50 p-3 text-left shadow-sm transition hover:border-primary/40 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-foreground break-words flex-1 min-w-0">{option.name}</span>
                            <span className="text-xs font-bold text-primary whitespace-nowrap flex-shrink-0">{option.price}</span>
                          </div>
                          <p className="text-xs text-foreground/70 leading-relaxed break-words">{option.description}</p>
                          <span className="text-xs font-semibold text-primary block">{option.ctaLabel} →</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </article>
            </div>
          </div>
        );
      })}
    </div>
  );
}
