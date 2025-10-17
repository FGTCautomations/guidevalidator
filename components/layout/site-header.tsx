import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { SignOutButton } from "@/components/auth/sign-out-button";

export type NavItem = {
  label: string;
  href: string;
};

type SiteHeaderProps = {
  navItems: NavItem[];
  ctaLabel: string;
  ctaHref: string;
  signinLabel: string;
  signinHref: string;
  signOutLabel?: string;
  userEmail?: string | null;
  locale: string;
};

export function SiteHeader({
  navItems,
  ctaLabel,
  ctaHref,
  signinLabel,
  signinHref,
  signOutLabel,
  userEmail,
  locale,
}: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-5 sm:px-10">
        <Link href={(navItems[0]?.href ?? "/") as Route} className="flex items-center gap-3">
          <Image
            src="/images/guide-validator-logo.svg"
            alt="Guide Validator"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full"
            priority
          />
          <span className="text-lg font-semibold tracking-tight text-foreground">Guide Validator</span>
        </Link>
        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/80 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href as Route} className="transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3">
          {userEmail ? (
            <>
              <span className="hidden text-sm text-foreground/70 md:inline">{userEmail}</span>
              <SignOutButton locale={locale} label={signOutLabel ?? "Sign out"} />
            </>
          ) : (
            <>
              <Link
                href={signinHref as Route}
                className="text-sm font-medium text-foreground/70 transition hover:text-foreground"
              >
                {signinLabel}
              </Link>
              <Link
                href={ctaHref as Route}
                className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition hover:shadow-md sm:px-5"
              >
                {ctaLabel}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
