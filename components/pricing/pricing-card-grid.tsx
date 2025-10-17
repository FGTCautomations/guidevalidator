"use client";

import Link from "next/link";
import type { Route } from "next";

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
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
      {segments.map((segment) => (
        <div key={segment.id} className="group relative h-full min-h-[440px]" style={{ perspective: "1600px" }}>
          <div className="relative h-full w-full transition-transform duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(180deg)]">
            <article className="absolute inset-0 flex h-full flex-col gap-4 rounded-3xl border border-foreground/10 bg-white/90 p-6 shadow-sm [backface-visibility:hidden]">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">{segment.label}</p>
                <h3 className="text-2xl font-semibold text-foreground break-words">{segment.tagline}</h3>
                <p className="text-sm text-foreground/70 break-words">{segment.summary}</p>
              </div>
              <p className="mt-auto text-xs text-foreground/50">Hover to view plans →</p>
            </article>

            <article className="absolute inset-0 flex h-full flex-col gap-5 rounded-3xl border border-primary/20 bg-primary/5 p-6 text-foreground shadow-sm [transform:rotateY(180deg)] [backface-visibility:hidden]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">{segment.label}</p>
                  <h3 className="text-lg font-semibold text-foreground">Select a plan</h3>
                </div>
                <span className="text-xs text-primary/60">Hover out to close</span>
              </div>

              <div className="space-y-4 overflow-y-auto pr-1">
                {segment.options.map((option) => {
                  const isExternal = typeof option.href === "string" && /^(mailto:|https?:)/.test(option.href);

                  if (isExternal && typeof option.href === "string") {
                    return (
                      <a
                        key={option.id}
                        href={option.href}
                        className="flex w-full flex-col gap-2 rounded-2xl border border-foreground/15 bg-white px-4 py-3 text-left shadow-sm transition hover:border-primary/40 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-foreground break-words">{option.name}</span>
                          <span className="text-sm font-medium text-primary whitespace-nowrap">{option.price}</span>
                        </div>
                        <p className="text-xs text-foreground/70 break-words">{option.description}</p>
                        <span className="text-xs font-semibold text-primary">{option.ctaLabel}</span>
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
                      className="flex w-full flex-col gap-2 rounded-2xl border border-foreground/15 bg-white px-4 py-3 text-left shadow-sm transition hover:border-primary/40 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-primary/40"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground break-words">{option.name}</span>
                        <span className="text-sm font-medium text-primary whitespace-nowrap">{option.price}</span>
                      </div>
                      <p className="text-xs text-foreground/70 break-words">{option.description}</p>
                      <span className="text-xs font-semibold text-primary">{option.ctaLabel}</span>
                    </Link>
                  );
                })}
              </div>
            </article>
          </div>
        </div>
      ))}
    </div>
  );
}
