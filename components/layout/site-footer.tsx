import Image from "next/image";
import Link from "next/link";
import type { Route } from "next";

type FooterLink = {
  label: string;
  href: string;
};

type SiteFooterProps = {
  description: string;
  links: FooterLink[];
  cta: {
    title: string;
    body: string;
    actionLabel: string;
    actionHref: string;
  };
};

export function SiteFooter({ description, links, cta }: SiteFooterProps) {
  return (
    <footer className="border-t border-foreground/10 bg-surface/60">
      <div className="mx-auto grid w-full max-w-6xl gap-12 px-6 py-16 sm:px-10 md:grid-cols-[1.2fr_1fr]">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <Image
              src="/images/guide-validator-logo.svg"
              alt="Guide Validator"
              width={40}
              height={40}
              className="h-10 w-10"
              priority
            />
            <span className="text-lg font-semibold tracking-tight text-foreground">Guide Validator</span>
          </div>
          <p className="max-w-lg text-sm text-foreground/70">{description}</p>
          <div className="flex flex-wrap gap-3 text-sm text-foreground/70">
            {links.map((link) => (
              <Link key={link.href} href={link.href as Route} className="transition hover:text-foreground">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="space-y-4 rounded-[var(--radius-xl)] bg-background/70 p-6 shadow-sm">
          <h3 className="text-base font-semibold text-foreground">{cta.title}</h3>
          <p className="text-sm text-foreground/75">{cta.body}</p>
          <Link
            href={cta.actionHref as Route}
            className="inline-flex items-center justify-center rounded-full border border-secondary px-4 py-2 text-sm font-semibold text-secondary transition hover:bg-secondary hover:text-secondary-foreground"
          >
            {cta.actionLabel}
          </Link>
        </div>
      </div>
      <div className="border-t border-foreground/10 bg-background/60 py-4 text-center text-xs text-foreground/60">
        © {new Date().getFullYear()} Guide Validator. All rights reserved.
      </div>
    </footer>
  );
}