"use client";

import { ReactNode, useMemo, useState } from "react";

type FilterDescriptor = {
  key: string;
  label: string;
};

type FilterPanelProps = {
  title?: string;
  filters: FilterDescriptor[];
  activeFilters?: string[];
  controls?: ReactNode;
  helperText?: string;
};

const DEFAULT_HELPER =
  "Use the controls above to narrow partners by region, city, languages, specialties, and verification status.";

export function FilterPanel({
  title = "Filters",
  filters,
  activeFilters = [],
  controls,
  helperText = DEFAULT_HELPER,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  const baseChips = useMemo(() => filters, [filters]);

  return (
    <section className="space-y-5 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <button
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          className="text-xs font-medium text-secondary transition hover:text-secondary/80"
        >
          {isExpanded ? "Hide" : "Show"}
        </button>
      </div>
      {isExpanded ? (
        <>
          <div className="flex flex-wrap gap-2">
            {baseChips.map((chip) => (
              <span
                key={chip.key}
                className="rounded-full border border-foreground/15 px-3 py-1 text-xs font-medium text-foreground/70"
              >
                {chip.label}
              </span>
            ))}
          </div>
          {activeFilters.length > 0 ? (
            <div className="flex flex-wrap gap-2 text-xs text-foreground/80">
              {activeFilters.map((filter) => (
                <span
                  key={filter}
                  className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary"
                >
                  {filter}
                </span>
              ))}
            </div>
          ) : null}
          {controls ? <div className="space-y-4">{controls}</div> : null}
          <p className="text-xs text-foreground/50">{helperText}</p>
        </>
      ) : null}
    </section>
  );
}
