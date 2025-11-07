"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";
import { Menu, X } from "lucide-react";
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
  userName?: string | null;
  userProfileHref?: string;
  locale: string;
};

export function SiteHeader({
  navItems,
  ctaLabel,
  ctaHref,
  signinLabel,
  signinHref,
  signOutLabel,
  userName,
  userProfileHref,
  locale,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-foreground/10 bg-background/80 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5 lg:px-10">
        {/* Logo */}
        <Link href={(navItems[0]?.href ?? "/") as Route} className="flex items-center gap-2 sm:gap-3">
          <Image
            src="/images/guide-validator-logo.svg"
            alt="Guide Validator"
            width={40}
            height={40}
            className="h-8 w-8 rounded-full sm:h-10 sm:w-10"
            priority
          />
          <span className="text-base font-semibold tracking-tight text-foreground sm:text-lg">Guide Validator</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 text-sm font-medium text-foreground/80 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href as Route} className="transition hover:text-foreground">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          {userName ? (
            <>
              {userProfileHref ? (
                <Link
                  href={userProfileHref as Route}
                  className="text-sm font-medium text-foreground/70 transition hover:text-foreground"
                >
                  {userName}
                </Link>
              ) : (
                <span className="text-sm text-foreground/70">{userName}</span>
              )}
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

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex items-center justify-center rounded-lg p-2 text-foreground transition hover:bg-foreground/5 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t border-foreground/10 bg-background md:hidden">
          <div className="mx-auto max-w-6xl space-y-1 px-4 py-4 sm:px-6">
            {/* Mobile Navigation Links */}
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href as Route}
                className="block rounded-lg px-4 py-3 text-base font-medium text-foreground transition hover:bg-foreground/5"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Auth Section */}
            <div className="border-t border-foreground/10 pt-4">
              {userName ? (
                <div className="space-y-2">
                  {userProfileHref && (
                    <Link
                      href={userProfileHref as Route}
                      className="block rounded-lg px-4 py-3 text-base font-medium text-foreground transition hover:bg-foreground/5"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {userName}
                    </Link>
                  )}
                  <div className="px-4">
                    <SignOutButton locale={locale} label={signOutLabel ?? "Sign out"} />
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link
                    href={signinHref as Route}
                    className="block rounded-lg px-4 py-3 text-base font-medium text-foreground transition hover:bg-foreground/5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {signinLabel}
                  </Link>
                  <Link
                    href={ctaHref as Route}
                    className="mx-4 block rounded-full bg-primary px-4 py-3 text-center text-base font-semibold text-primary-foreground shadow-sm"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {ctaLabel}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
