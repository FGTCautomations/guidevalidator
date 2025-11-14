"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Route } from "next";

import { type SupportedLocale } from "@/i18n/config";

interface AccountNavigationProps {
  locale: SupportedLocale;
  userRole: string | null;
}

type NavItem = {
  label: string;
  pathSuffix: string;
  route: Route;
  icon: string;
  allowedRoles: string[];
};

const NAV_ITEMS: NavItem[] = [
  {
    label: "Profile",
    pathSuffix: "/account/profile",
    route: "/[locale]/account/profile" as Route,
    icon: "👤",
    allowedRoles: ["guide", "agency", "dmc", "transport", "admin", "super_admin"],
  },
  {
    label: "Calendar",
    pathSuffix: "/account/availability",
    route: "/[locale]/account/availability" as Route,
    icon: "📅",
    allowedRoles: ["guide", "transport"],
  },
  {
    label: "Billing",
    pathSuffix: "/account/billing",
    route: "/[locale]/account/billing" as Route,
    icon: "💳",
    allowedRoles: ["guide", "agency", "dmc", "transport", "admin", "super_admin"],
  },
  {
    label: "Verification",
    pathSuffix: "/account/verification",
    route: "/[locale]/account/verification" as Route,
    icon: "✅",
    allowedRoles: ["guide", "transport"],
  },
  {
    label: "Security",
    pathSuffix: "/account/security",
    route: "/[locale]/account/security" as Route,
    icon: "🔒",
    allowedRoles: ["guide", "agency", "dmc", "transport", "admin", "super_admin"],
  },
];

export function AccountNavigation({ locale, userRole }: AccountNavigationProps) {
  const pathname = usePathname();
  const localePrefix = `/${locale}`;

  const filteredItems = NAV_ITEMS.filter((item) => !userRole || item.allowedRoles.includes(userRole));

  return (
    <nav className="mb-6 flex gap-2 border-b border-foreground/10">
      {filteredItems.map((item) => {
        const targetPath = `${localePrefix}${item.pathSuffix}`;
        const isActive = pathname === targetPath;

        return (
          <Link
            key={item.label}
            href={targetPath as Route}
            className={`
              flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2
              ${
                isActive
                  ? "border-blue-500 text-blue-600 bg-blue-50"
                  : "border-transparent text-foreground/70 hover:text-foreground hover:bg-gray-50"
              }
            `}
          >
            <span aria-hidden="true" className="text-base">
              {item.icon}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
