import type { Route } from "next";
import Link from "next/link";
import type { PropsWithChildren, ReactNode } from "react";

export type AuthCardProps = PropsWithChildren<{
  title: string;
  description?: string;
  footer?: ReactNode;
}>;

export function AuthCard({ title, description, footer, children }: AuthCardProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-6 rounded-[var(--radius-2xl)] bg-white/85 p-8 shadow-[var(--shadow-soft)]">
      <div className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
          GV
        </div>
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
        {description ? <p className="text-sm text-foreground/75">{description}</p> : null}
      </div>
      <div className="space-y-4">{children}</div>
      {footer ? <div className="border-t border-foreground/10 pt-4 text-center text-sm text-foreground/70">{footer}</div> : null}
    </div>
  );
}

export function AuthCardFooterLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href as Route} className="font-semibold text-primary transition hover:text-primary/80">
      {children}
    </Link>
  );
}
