import type { ReactNode } from "react";

type InfoSectionProps = {
  title: string;
  children: ReactNode;
};

export function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <section className="space-y-3 rounded-[var(--radius-xl)] border border-foreground/10 bg-white/80 p-6 shadow-sm">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">{title}</h2>
      <div className="space-y-3 text-sm text-foreground/80">{children}</div>
    </section>
  );
}
