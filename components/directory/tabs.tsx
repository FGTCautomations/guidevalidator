"use client";

import Link from "next/link";
import clsx from "clsx";
import { useState } from "react";
import type { Route } from "next";

export type DirectoryTab = {
  key: string;
  label: string;
  href: string;
};

type DirectoryTabsProps = {
  tabs: DirectoryTab[];
  activeKey: string;
};

export function DirectoryTabs({ tabs, activeKey }: DirectoryTabsProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  return (
    <div className="flex items-center justify-between">
      <div className="hidden text-sm text-foreground/60 md:block">{tabs.length} segments</div>
      <div className="flex flex-wrap items-center gap-2 rounded-full border border-foreground/10 bg-background/80 p-2 shadow-sm">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href as Route}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium transition",
              activeKey === tab.key
                ? "bg-primary text-primary-foreground shadow"
                : "text-foreground/70 hover:text-foreground"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
